import { prisma } from "@/lib/dbHelper";
import { 
  parseISO, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  subDays,
  subWeeks,
  differenceInDays,
  format,
} from "date-fns";

export type DateFilterPreset = 
  | "daily" 
  | "current_week" 
  | "last_week"
  | "current_month" 
  | "last_month" 
  | "custom";

export type PaymentGroupByType = "Payment Method" | "Daily" | "Shop";

interface PaymentSalesAnalyticsQueryParams {
  businessId: string;
  shopId?: string; 
  filter?: DateFilterPreset;
  customStartDate?: string | Date;
  customEndDate?: string | Date;
  compareWithPrevious?: boolean;
  groupBy?: PaymentGroupByType;
}

export class PaymentSalesAnalyticsService {
  /**
   * Resolves start and end dates based on the preset filter or custom values.
   */
  private static getDateRange(
    filter: DateFilterPreset, 
    customStartDate?: string | Date, 
    customEndDate?: string | Date
  ) {
    const now = new Date();
    let start = startOfDay(now);
    let end = endOfDay(now);

    switch (filter) {
      case "daily":
        start = startOfDay(now);
        end = endOfDay(now);
        break;

      case "current_week":
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;

      case "last_week":
        const lastWeekDate = subWeeks(now, 1);
        start = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
        end = endOfWeek(lastWeekDate, { weekStartsOn: 1 });
        break;

      case "current_month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;

      case "last_month":
        const lastMonthDate = subMonths(now, 1);
        start = startOfMonth(lastMonthDate);
        end = endOfMonth(lastMonthDate);
        break;

      case "custom":
        if (customStartDate) {
          start = startOfDay(typeof customStartDate === "string" ? parseISO(customStartDate) : customStartDate);
        }
        if (customEndDate) {
          end = endOfDay(typeof customEndDate === "string" ? parseISO(customEndDate) : customEndDate);
        }
        break;
    }

    return { start, end };
  }

  /**
   * Calculates the equivalent previous period for percentage change calculations.
   */
  private static getPreviousDateRange(start: Date, end: Date) {
    const durationDays = differenceInDays(end, start) + 1;
    const prevEnd = endOfDay(subDays(start, 1));
    const prevStart = startOfDay(subDays(prevEnd, durationDays - 1));
    return { prevStart, prevEnd };
  }

  /**
   * Main service function to power the "Sale By Payment Method" UI dashboard and multi-grouping views.
   */
  static async getPaymentSalesAnalyticsReport({
    businessId,
    shopId,
    filter = "current_month",
    customStartDate,
    customEndDate,
    compareWithPrevious = true,
    groupBy = "Payment Method",
  }: PaymentSalesAnalyticsQueryParams) {
    // 1. Resolve date intervals for primary and comparison ranges
    const { start, end } = this.getDateRange(filter, customStartDate, customEndDate);
    const { prevStart, prevEnd } = this.getPreviousDateRange(start, end);

    // 2. Build common prisma where clause filters for shop constraints
    const shopFilter = shopId && shopId !== "All Shops" ? { shopId } : {};

    const primarySaleFilter = {
      businessId,
      ...shopFilter,
      createdAt: { gte: start, lte: end },
      status: "COMPLETED" as const,
    };

    const previousSaleFilter = {
      businessId,
      ...shopFilter,
      createdAt: { gte: prevStart, lte: prevEnd },
      status: "COMPLETED" as const,
    };

    const refundSaleFilter = {
      businessId,
      ...shopFilter,
      createdAt: { gte: start, lte: end },
      status: "REFUNDED" as const,
    };

    // 3. Execute core queries in parallel for maximum performance using Payment and Sale models
    const [
      overallSalesAgg,
      previousSalesAgg,
      totalRefundsAgg,
      currentPayments,
      previousPayments,
      allShops
    ] = await Promise.all([
      // Total sales summary KPI via Sales
      prisma.sale.aggregate({
        where: primarySaleFilter,
        _sum: { totalAmount: true, discountAmount: true },
        _count: { id: true },
      }),

      // Previous period total sales KPI (for growth percentage)
      compareWithPrevious
        ? prisma.sale.aggregate({
            where: previousSaleFilter,
            _sum: { totalAmount: true },
            _count: { id: true },
          })
        : Promise.resolve(null),

      // Total refunds KPI for the header card
      prisma.sale.aggregate({
        where: refundSaleFilter,
        _sum: { totalAmount: true },
      }),

      // Payments for primary period including related sale items, shop, and sale
      prisma.payment.findMany({
        where: {
          businessId,
          ...shopFilter,
          createdAt: { gte: start, lte: end },
          status: "COMPLETED",
          sale: { status: "COMPLETED" },
        },
        include: {
          shop: true,
          sale: {
            include: {
              items: true,
            },
          },
        },
      }),

      // Payments for previous period (to calculate payment-level growth percentages)
      compareWithPrevious
        ? prisma.payment.findMany({
            where: {
              businessId,
              ...shopFilter,
              createdAt: { gte: prevStart, lte: prevEnd },
              status: "COMPLETED",
              sale: { status: "COMPLETED" },
            },
            include: {
              sale: true,
            },
          })
        : Promise.resolve([]),

      // Fetch all shops for the business
      prisma.shop.findMany({
        where: { businessId, isDeleted: false, isActive: true },
      })
    ]);

    // 4. Calculate total items sold in primary period
    const currentItemsSoldAgg = await prisma.saleItem.aggregate({
      where: {
        businessId,
        sale: {
          ...shopFilter,
          createdAt: { gte: start, lte: end },
          status: "COMPLETED",
        },
      },
      _sum: { quantity: true },
    });

    // 5. Compute Top-Level Summary Metrics (KPI Cards)
    const totalSales = Number(overallSalesAgg._sum.totalAmount || 0);
    const totalTransactions = overallSalesAgg._count.id;
    const itemsSold = currentItemsSoldAgg._sum.quantity || 0;
    const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalRefunds = Number(totalRefundsAgg._sum.totalAmount || 0);

    let salesGrowthPercentage = 0;
    if (previousSalesAgg && previousSalesAgg._sum.totalAmount) {
      const prevTotal = Number(previousSalesAgg._sum.totalAmount);
      if (prevTotal > 0) {
        salesGrowthPercentage = ((totalSales - prevTotal) / prevTotal) * 100;
      }
    }

    // 6. Fetch refund payments or sales context for computing refunds per payment channel/entity
    const refundPayments = await prisma.payment.findMany({
      where: {
        businessId,
        ...shopFilter,
        createdAt: { gte: start, lte: end },
        sale: { status: "REFUNDED" },
      },
      include: {
        shop: true,
        sale: {
          include: { items: true },
        },
      },
    });

    // 7. Dynamic Grouping Logic (Payment Method vs Daily vs Shop)
    const performanceMap = new Map<string, {
      id: string;
      name: string;
      subtitle?: string;
      channelType?: string;
      totalSales: number;
      totalTransactions: number;
      itemsSold: number;
      discountsTotal: number;
      refundsTotal: number;
    }>();

    if (groupBy === "Payment Method") {
      // Initialize common payment methods dynamically or explicitly based on PaymentType enum
      const defaultMethods = ["CASH", "MOMO", "CARD", "SPLIT"];
      defaultMethods.forEach(method => {
        performanceMap.set(method, {
          id: method,
          name: method === "MOMO" ? "Mobile Money (MTN)" : method === "CARD" ? "Credit / Debit Card" : method === "CASH" ? "Cash" : "Split Payment",
          subtitle: method === "MOMO" ? "Mobile Money" : method === "CARD" ? "Card Payment" : "Physical Cash",
          channelType: method,
          totalSales: 0,
          totalTransactions: 0,
          itemsSold: 0,
          discountsTotal: 0,
          refundsTotal: 0,
        });
      });

      // Populate primary payment metrics
      currentPayments.forEach(payment => {
        const methodKey = payment.method;
        let entry = performanceMap.get(methodKey);
        if (!entry) {
          entry = {
            id: methodKey,
            name: methodKey,
            subtitle: "Payment Channel",
            channelType: methodKey,
            totalSales: 0,
            totalTransactions: 0,
            itemsSold: 0,
            discountsTotal: 0,
            refundsTotal: 0,
          };
          performanceMap.set(methodKey, entry);
        }

        entry.totalSales += Number(payment.amount);
        entry.totalTransactions += 1;
        entry.discountsTotal += Number(payment.sale?.discountAmount || 0);
        entry.itemsSold += payment.sale?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      });

      // Populate refunds per payment method
      refundPayments.forEach(payment => {
        const methodKey = payment.method;
        const entry = performanceMap.get(methodKey);
        if (entry) {
          entry.refundsTotal += Number(payment.amount);
        }
      });

    } else if (groupBy === "Shop") {
      // Initialize with all business shops
      allShops.forEach(shop => {
        performanceMap.set(shop.id, {
          id: shop.id,
          name: shop.name,
          subtitle: `${shop.city || ""}, ${shop.region || ""}`.trim(),
          totalSales: 0,
          totalTransactions: 0,
          itemsSold: 0,
          discountsTotal: 0,
          refundsTotal: 0,
        });
      });

      currentPayments.forEach(payment => {
        const shopKey = payment.shopId;
        let entry = performanceMap.get(shopKey);
        if (!entry) {
          entry = {
            id: shopKey,
            name: payment.shop.name,
            subtitle: payment.shop.city || "",
            totalSales: 0,
            totalTransactions: 0,
            itemsSold: 0,
            discountsTotal: 0,
            refundsTotal: 0,
          };
          performanceMap.set(shopKey, entry);
        }

        entry.totalSales += Number(payment.amount);
        entry.totalTransactions += 1;
        entry.discountsTotal += Number(payment.sale?.discountAmount || 0);
        entry.itemsSold += payment.sale?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      });

      refundPayments.forEach(payment => {
        const shopKey = payment.shopId;
        const entry = performanceMap.get(shopKey);
        if (entry) {
          entry.refundsTotal += Number(payment.amount);
        }
      });

    } else if (groupBy === "Daily") {
      currentPayments.forEach(payment => {
        const dayKey = format(payment.createdAt, "yyyy-MM-dd");
        let entry = performanceMap.get(dayKey);
        if (!entry) {
          entry = {
            id: dayKey,
            name: format(payment.createdAt, "MMM d, yyyy"),
            subtitle: format(payment.createdAt, "EEEE"),
            totalSales: 0,
            totalTransactions: 0,
            itemsSold: 0,
            discountsTotal: 0,
            refundsTotal: 0,
          };
          performanceMap.set(dayKey, entry);
        }

        entry.totalSales += Number(payment.amount);
        entry.totalTransactions += 1;
        entry.discountsTotal += Number(payment.sale?.discountAmount || 0);
        entry.itemsSold += payment.sale?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      });

      refundPayments.forEach(payment => {
        const dayKey = format(payment.createdAt, "yyyy-MM-dd");
        const entry = performanceMap.get(dayKey);
        if (entry) {
          entry.refundsTotal += Number(payment.amount);
        }
      });
    }

    // 8. Aggregate Previous Period for Growth Calculations per entity key
    const prevPerformanceMap = new Map<string, number>();
    previousPayments.forEach(payment => {
      let key = "";
      if (groupBy === "Payment Method") key = payment.method;
      else if (groupBy === "Shop") key = payment.shopId;
      else if (groupBy === "Daily") key = format(payment.createdAt, "yyyy-MM-dd");

      const currentVal = prevPerformanceMap.get(key) || 0;
      prevPerformanceMap.set(key, currentVal + Number(payment.amount));
    });

    // 9. Format Performance List with Percentage Share, AOV, and Growth
    const performanceList = Array.from(performanceMap.values()).map(entry => {
      const aov = entry.totalTransactions > 0 ? entry.totalSales / entry.totalTransactions : 0;
      const percentageShare = totalSales > 0 ? (entry.totalSales / totalSales) * 100 : 0;
      
      const prevSales = prevPerformanceMap.get(entry.id) || 0;
      let salesGrowth = 0;
      if (prevSales > 0) {
        salesGrowth = ((entry.totalSales - prevSales) / prevSales) * 100;
      } else if (entry.totalSales > 0) {
        salesGrowth = 100;
      }

      return {
        id: entry.id,
        name: entry.name,
        subtitle: entry.subtitle,
        channelType: entry.channelType,
        totalSales: entry.totalSales,
        transactions: entry.totalTransactions,
        averageOrderValue: aov,
        itemsSold: entry.itemsSold,
        discounts: entry.discountsTotal,
        refunds: entry.refundsTotal,
        percentageShare,
        salesGrowth,
      };
    });

    // Sort by total sales descending by default
    performanceList.sort((a, b) => b.totalSales - a.totalSales);

    // Active items for bar chart & donut visualization
    const activePerformanceList = performanceList.filter(p => p.totalSales > 0);

    // Top list sorted by growth percentage
    const topByGrowth = [...performanceList]
      .filter(p => p.totalSales > 0)
      .sort((a, b) => b.salesGrowth - a.salesGrowth);

    return {
      dateRange: { start, end },
      groupBy,
      summaryMetrics: {
        totalSales,
        totalTransactions,
        averageOrderValue,
        itemsSold,
        totalRefunds,
        salesGrowthPercentage,
      },
      // Data powering the main distribution view / charts
      barChartData: activePerformanceList.map(item => ({
        label: item.name,
        subtitle: item.subtitle,
        totalSales: item.totalSales,
        transactions: item.transactions,
      })),
      // Data powering the Donut Chart and Center Text matching UI requirements
      donutChartData: activePerformanceList.map(item => ({
        label: item.name,
        totalSales: item.totalSales,
        percentageShare: Number(item.percentageShare.toFixed(1)),
        salesGrowth: Number(item.salesGrowth.toFixed(1)),
      })),
      // Data powering the "Payment Growth & Trends" side widget card
      topListByGrowth: topByGrowth.slice(0, 6).map(item => ({
        label: item.name,
        subtitle: item.subtitle,
        totalSales: item.totalSales,
        transactions: item.transactions,
        salesGrowth: Number(item.salesGrowth.toFixed(1)),
      })),
      // Data powering the detailed data table at the bottom ("Payment Channel Performance Breakdown")
      tableDetails: performanceList,
    };
  }
}