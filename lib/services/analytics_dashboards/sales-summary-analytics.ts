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
  format
} from "date-fns";

export type DateFilterPreset = 
  | "daily" 
  | "current_week" 
  | "last_week"
  | "current_month" 
  | "last_month" 
  | "custom";

interface SalesAnalyticsQueryParams {
  businessId: string;
  shopId?: string; // Optional: "All Shops" if omitted
  filter?: DateFilterPreset;
  customStartDate?: string | Date;
  customEndDate?: string | Date;
  compareWithPrevious?: boolean;
}

export class SalesAnalyticsService {
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
   * Calculates the equivalent previous period for percentage change comparisons.
   */
  private static getPreviousDateRange(start: Date, end: Date) {
    const durationDays = differenceInDays(end, start) + 1;
    const prevEnd = endOfDay(subDays(start, 1));
    const prevStart = startOfDay(subDays(prevEnd, durationDays - 1));
    return { prevStart, prevEnd };
  }

  /**
   * Main entry point to fetch comprehensive sales performance metrics, charts, highlights, and history.
   */
  static async getSalesSummaryReport({
    businessId,
    shopId,
    filter = "current_month",
    customStartDate,
    customEndDate,
    compareWithPrevious = true,
  }: SalesAnalyticsQueryParams) {
    // 1. Resolve primary and comparison date intervals
    const { start, end } = this.getDateRange(filter, customStartDate, customEndDate);
    const { prevStart, prevEnd } = this.getPreviousDateRange(start, end);

    // 2. Build common prisma where clause filters
    const shopFilter = shopId && shopId !== "All Shops" ? { shopId } : {};

    const primaryWhere = {
      businessId,
      ...shopFilter,
      createdAt: { gte: start, lte: end },
      status: "COMPLETED" as const,
    };

    const previousWhere = {
      businessId,
      ...shopFilter,
      createdAt: { gte: prevStart, lte: prevEnd },
      status: "COMPLETED" as const,
    };

    // 3. Execute primary aggregates, previous aggregates, refunds, and shop groupings in parallel
    const [
      currentSalesAgg, 
      previousSalesAgg, 
      totalRefundsAgg, 
      salesByShopRaw, 
      currentSalesList, 
      previousSalesList,
      salesItemsForCategory,
      completedSalesForPeak,
      historicalPeriodsData
    ] = await Promise.all([
      // Current period sales metrics
      prisma.sale.aggregate({
        where: primaryWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // Previous period sales metrics (for growth calculations)
      compareWithPrevious
        ? prisma.sale.aggregate({
            where: previousWhere,
            _sum: { totalAmount: true },
            _count: { id: true },
          })
        : Promise.resolve(null),

      // Refunds calculation for the primary period
      prisma.sale.aggregate({
        where: {
          businessId,
          ...shopFilter,
          createdAt: { gte: start, lte: end },
          status: "REFUNDED",
        },
        _sum: { totalAmount: true },
      }),

      // Breakdown by Shop (for pie chart & shop list)
      prisma.sale.groupBy({
        by: ["shopId"],
        where: primaryWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: "desc" } },
      }),

      // Raw sales for primary period time-series chart mapping
      prisma.sale.findMany({
        where: primaryWhere,
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: "asc" },
      }),

      // Raw sales for comparison period time-series chart mapping
      compareWithPrevious ? prisma.sale.findMany({
        where: previousWhere,
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: "asc" },
      }) : Promise.resolve([]),

      // Sale items with product and category info for Best Category calculation
      prisma.saleItem.findMany({
        where: {
          businessId,
          sale: {
            ...shopFilter,
            createdAt: { gte: start, lte: end },
            status: "COMPLETED",
          },
        },
        include: {
          variant: {
            include: {
              product: {
                include: { category: true }
              }
            }
          }
        }
      }),

      // Completed sales for peak hour & best day calculation
      prisma.sale.findMany({
        where: primaryWhere,
        select: { id: true, createdAt: true, totalAmount: true }
      }),

      // 4. Fetch historical periodic table data (Last 3 full months history rows)
      Promise.all([
        // Current/Selected Filter Range Row
        (async () => {
          const agg = await prisma.sale.aggregate({ where: primaryWhere, _sum: { totalAmount: true }, _count: { id: true } });
          const ref = await prisma.sale.aggregate({ where: { businessId, ...shopFilter, createdAt: { gte: start, lte: end }, status: "REFUNDED" }, _sum: { totalAmount: true } });
          const total = Number(agg._sum.totalAmount || 0);
          const count = agg._count.id;
          return {
            periodLabel: `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`,
            totalSales: total,
            transactions: count,
            aov: count > 0 ? total / count : 0,
            refunds: Number(ref._sum.totalAmount || 0)
          };
        })(),
        // Month - 1 Historical Row
        (async () => {
          const mStart = startOfMonth(subMonths(new Date(), 1));
          const mEnd = endOfMonth(subMonths(new Date(), 1));
          const wh = { businessId, ...shopFilter, createdAt: { gte: mStart, lte: mEnd }, status: "COMPLETED" as const };
          const agg = await prisma.sale.aggregate({ where: wh, _sum: { totalAmount: true }, _count: { id: true } });
          const ref = await prisma.sale.aggregate({ where: { businessId, ...shopFilter, createdAt: { gte: mStart, lte: mEnd }, status: "REFUNDED" }, _sum: { totalAmount: true } });
          const total = Number(agg._sum.totalAmount || 0);
          const count = agg._count.id;
          return {
            periodLabel: `${format(mStart, "MMM d, yyyy")} - ${format(mEnd, "MMM d, yyyy")}`,
            totalSales: total,
            transactions: count,
            aov: count > 0 ? total / count : 0,
            refunds: Number(ref._sum.totalAmount || 0)
          };
        })(),
        // Month - 2 Historical Row
        (async () => {
          const mStart = startOfMonth(subMonths(new Date(), 2));
          const mEnd = endOfMonth(subMonths(new Date(), 2));
          const wh = { businessId, ...shopFilter, createdAt: { gte: mStart, lte: mEnd }, status: "COMPLETED" as const };
          const agg = await prisma.sale.aggregate({ where: wh, _sum: { totalAmount: true }, _count: { id: true } });
          const ref = await prisma.sale.aggregate({ where: { businessId, ...shopFilter, createdAt: { gte: mStart, lte: mEnd }, status: "REFUNDED" }, _sum: { totalAmount: true } });
          const total = Number(agg._sum.totalAmount || 0);
          const count = agg._count.id;
          return {
            periodLabel: `${format(mStart, "MMM d, yyyy")} - ${format(mEnd, "MMM d, yyyy")}`,
            totalSales: total,
            transactions: count,
            aov: count > 0 ? total / count : 0,
            refunds: Number(ref._sum.totalAmount || 0)
          };
        })()
      ])
    ]);

    // 4. Calculate total items sold via sale items relation
    const currentItemsSold = await prisma.saleItem.aggregate({
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

    // 5. Compute derived metrics (AOV, growth percentages)
    const totalSales = Number(currentSalesAgg._sum.totalAmount || 0);
    const totalTransactions = currentSalesAgg._count.id;
    const itemsSold = currentItemsSold._sum.quantity || 0;
    const totalRefunds = Number(totalRefundsAgg._sum.totalAmount || 0);
    const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    let salesGrowthPercentage = 0;
    if (previousSalesAgg && previousSalesAgg._sum.totalAmount) {
      const prevTotal = Number(previousSalesAgg._sum.totalAmount);
      if (prevTotal > 0) {
        salesGrowthPercentage = ((totalSales - prevTotal) / prevTotal) * 100;
      }
    }

    // 6. Enrich shop breakdown with actual Shop names
    const shopIds = salesByShopRaw.map((s) => s.shopId);
    const shops = await prisma.shop.findMany({
      where: { id: { in: shopIds } },
      select: { id: true, name: true },
    });
    const shopMap = new Map(shops.map((s) => [s.id, s.name]));

    const salesByShop = salesByShopRaw.map((item) => ({
      shopId: item.shopId,
      shopName: shopMap.get(item.shopId) || "Unknown Shop",
      totalSales: Number(item._sum.totalAmount || 0),
      transactionCount: item._count.id,
      percentageShare: totalSales > 0 ? (Number(item._sum.totalAmount || 0) / totalSales) * 100 : 0,
    }));

    // 7. Process Time-Series Chart Data for Dual Line Graph
    const timeSeriesMapPrimary = new Map<string, number>();
    currentSalesList.forEach(sale => {
      const dayKey = format(sale.createdAt, "yyyy-MM-dd");
      const currentVal = timeSeriesMapPrimary.get(dayKey) || 0;
      timeSeriesMapPrimary.set(dayKey, currentVal + Number(sale.totalAmount));
    });

    const timeSeriesMapPrevious = new Map<string, number>();
    const durationDays = differenceInDays(end, start);
    previousSalesList.forEach(sale => {
      const dayOffset = differenceInDays(sale.createdAt, prevStart);
      if (dayOffset >= 0 && dayOffset <= durationDays) {
        const matchingPrimaryDate = format(subDays(end, durationDays - dayOffset), "yyyy-MM-dd");
        const currentVal = timeSeriesMapPrevious.get(matchingPrimaryDate) || 0;
        timeSeriesMapPrevious.set(matchingPrimaryDate, currentVal + Number(sale.totalAmount));
      }
    });

    const salesOverTimeChart = Array.from(timeSeriesMapPrimary.entries()).map(([date, primarySales]) => ({
      date,
      primarySales,
      comparisonSales: timeSeriesMapPrevious.get(date) || 0,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 8. Calculate Sales Highlights (Best Day, Top Category, Peak Hour, Highest Shop)
    // Best Day Calculation
    const daySalesMap = new Map<string, { totalSales: number; transactions: number; dateStr: string }>();
    completedSalesForPeak.forEach(sale => {
      const dayKey = format(sale.createdAt, "yyyy-MM-dd");
      const existing = daySalesMap.get(dayKey) || { totalSales: 0, transactions: 0, dateStr: format(sale.createdAt, "EEEE, MMMM d, yyyy") };
      existing.totalSales += Number(sale.totalAmount);
      existing.transactions += 1;
      daySalesMap.set(dayKey, existing);
    });
    let bestDayObj = { totalSales: 0, transactions: 0, dateStr: "N/A" };
    daySalesMap.forEach(val => {
      if (val.totalSales > bestDayObj.totalSales) {
        bestDayObj = val;
      }
    });

    // Top Selling Category Calculation
    const categorySalesMap = new Map<string, { categoryName: string; totalSales: number }>();
    salesItemsForCategory.forEach(item => {
      const cat = item.variant.product.category;
      const catName = cat ? cat.name : "Uncategorized";
      const catId = cat ? cat.id : "uncategorized";
      const subtotal = Number(item.subtotal);
      const existing = categorySalesMap.get(catId) || { categoryName: catName, totalSales: 0 };
      existing.totalSales += subtotal;
      categorySalesMap.set(catId, existing);
    });
    let topCategoryObj = { categoryName: "N/A", totalSales: 0 };
    categorySalesMap.forEach(val => {
      if (val.totalSales > topCategoryObj.totalSales) {
        topCategoryObj = val;
      }
    });

    // Peak Hour Calculation
    const hourSalesMap = new Map<number, { totalSales: number; transactions: number }>();
    completedSalesForPeak.forEach(sale => {
      const hour = sale.createdAt.getHours();
      const existing = hourSalesMap.get(hour) || { totalSales: 0, transactions: 0 };
      existing.totalSales += Number(sale.totalAmount);
      existing.transactions += 1;
      hourSalesMap.set(hour, existing);
    });
    let peakHourNum = 0;
    let peakHourVal = { totalSales: 0, transactions: 0 };
    hourSalesMap.forEach((val, hour) => {
      if (val.totalSales > peakHourVal.totalSales) {
        peakHourVal = val;
        peakHourNum = hour;
      }
    });
    const formatHourLabel = (h: number) => {
      const period = h >= 12 ? "PM" : "AM";
      const normalizedHour = h % 12 === 0 ? 12 : h % 12;
      const nextNormalized = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12;
      const nextPeriod = (h + 1) >= 12 ? "PM" : "AM";
      return `${normalizedHour}:00 ${period} - ${nextNormalized}:00 ${nextPeriod}`;
    };

    // Highest Selling Shop
    const highestShop = salesByShop.length > 0 ? salesByShop[0] : { shopName: "N/A", totalSales: 0, percentageShare: 0 };

    return {
      dateRange: { start, end },
      metrics: {
        totalSales,
        totalTransactions,
        averageOrderValue,
        itemsSold,
        totalRefunds,
        salesGrowthPercentage,
      },
      salesByShop,
      salesOverTimeChart,
      historicalPeriods: historicalPeriodsData,
      salesHighlights: {
        bestDay: {
          date: bestDayObj.dateStr,
          totalSales: bestDayObj.totalSales,
          transactions: bestDayObj.transactions,
        },
        highestSellingShop: {
          shopName: highestShop.shopName,
          totalSales: highestShop.totalSales,
          percentageShare: highestShop.percentageShare,
        },
        topSellingCategory: {
          categoryName: topCategoryObj.categoryName,
          totalSales: topCategoryObj.totalSales,
        },
        peakHour: {
          timeRange: hourSalesMap.size > 0 ? formatHourLabel(peakHourNum) : "N/A",
          totalSales: peakHourVal.totalSales,
          transactions: peakHourVal.transactions,
        }
      }
    };
  }
}