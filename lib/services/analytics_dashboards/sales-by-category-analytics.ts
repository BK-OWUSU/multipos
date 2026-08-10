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
} from "date-fns";

export type DateFilterPreset = 
  | "daily" 
  | "current_week" 
  | "last_week"
  | "current_month" 
  | "last_month" 
  | "custom";

interface CategorySalesAnalyticsQueryParams {
  businessId: string;
  shopId?: string; 
  filter?: DateFilterPreset;
  customStartDate?: string | Date;
  customEndDate?: string | Date;
  compareWithPrevious?: boolean;
}

export class CategorySalesAnalyticsService {
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
   * Main service function to power the "Sale By Category" UI dashboard.
   */
  static async getCategorySalesAnalyticsReport({
    businessId,
    shopId,
    filter = "current_month",
    customStartDate,
    customEndDate,
    compareWithPrevious = true,
  }: CategorySalesAnalyticsQueryParams) {
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

    // 3. Execute core queries in parallel for maximum performance
    const [
      overallSalesAgg,
      previousSalesAgg,
      totalRefundsAgg,
      currentSaleItems,
      previousSaleItems,
      allCategories
    ] = await Promise.all([
      // Total sales summary KPI
      prisma.sale.aggregate({
        where: primarySaleFilter,
        _sum: { totalAmount: true },
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

      // Sale items for the primary period with category and refund data via relation
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
          sale: true,
          variant: {
            include: {
              product: {
                include: { category: true }
              }
            }
          }
        }
      }),

      // Sale items for the previous period (to calculate category growth percentages)
      compareWithPrevious ? prisma.saleItem.findMany({
        where: {
          businessId,
          sale: {
            ...shopFilter,
            createdAt: { gte: prevStart, lte: prevEnd },
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
      }) : Promise.resolve([]),

      // Fetch all active categories defined for the business to handle zero-sales categories cleanly
      prisma.category.findMany({
        where: { businessId, isDeleted: false, isActive: true },
        select: { id: true, name: true, imageUrl: true }
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

    // 6. Aggregate Data by Category for Primary Period
    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      totalSales: number;
      transactionsSet: Set<string>;
      itemsSold: number;
      refundsTotal: number;
    }>();

    // Initialize map with all business categories
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, {
        categoryId: cat.id,
        categoryName: cat.name,
        totalSales: 0,
        transactionsSet: new Set<string>(),
        itemsSold: 0,
        refundsTotal: 0,
      });
    });

    // Handle Uncategorized bucket safely
    categoryMap.set("uncategorized", {
      categoryId: "uncategorized",
      categoryName: "Uncategorized",
      totalSales: 0,
      transactionsSet: new Set<string>(),
      itemsSold: 0,
      refundsTotal: 0,
    });

    // Populate primary metrics into category map
    currentSaleItems.forEach(item => {
      const category = item.variant.product.category;
      const catKey = category ? category.id : "uncategorized";
      
      let entry = categoryMap.get(catKey);
      if (!entry) {
        entry = {
          categoryId: catKey,
          categoryName: category ? category.name : "Uncategorized",
          totalSales: 0,
          transactionsSet: new Set<string>(),
          itemsSold: 0,
          refundsTotal: 0,
        };
        categoryMap.set(catKey, entry);
      }

      entry.totalSales += Number(item.subtotal);
      entry.transactionsSet.add(item.saleId);
      entry.itemsSold += item.quantity;
    });

    // Fetch refunds grouped by category items if needed, or associate refunds proportionally/directly
    const refundSaleItems = await prisma.saleItem.findMany({
      where: {
        businessId,
        sale: {
          ...shopFilter,
          createdAt: { gte: start, lte: end },
          status: "REFUNDED",
        },
      },
      include: {
        variant: {
          include: { product: { include: { category: true } } }
        }
      }
    });

    refundSaleItems.forEach(item => {
      const category = item.variant.product.category;
      const catKey = category ? category.id : "uncategorized";
      const entry = categoryMap.get(catKey);
      if (entry) {
        entry.refundsTotal += Number(item.subtotal);
      }
    });

    // 7. Aggregate Previous Period Sales by Category (for Growth % calculation)
    const prevCategorySalesMap = new Map<string, number>();
    previousSaleItems.forEach(item => {
      const category = item.variant.product.category;
      const catKey = category ? category.id : "uncategorized";
      const currentVal = prevCategorySalesMap.get(catKey) || 0;
      prevCategorySalesMap.set(catKey, currentVal + Number(item.subtotal));
    });

    // 8. Format Categories List with Percentage Share, AOV, and Growth
    const categoryPerformanceList = Array.from(categoryMap.values()).map(entry => {
      const txCount = entry.transactionsSet.size;
      const aov = txCount > 0 ? entry.totalSales / txCount : 0;
      const percentageShare = totalSales > 0 ? (entry.totalSales / totalSales) * 100 : 0;
      
      // Calculate growth against previous period
      const prevSales = prevCategorySalesMap.get(entry.categoryId) || 0;
      let salesGrowth = 0;
      if (prevSales > 0) {
        salesGrowth = ((entry.totalSales - prevSales) / prevSales) * 100;
      } else if (entry.totalSales > 0) {
        salesGrowth = 100; // Brand new sales growth if previous was 0
      }

      return {
        categoryId: entry.categoryId,
        categoryName: entry.categoryName,
        totalSales: entry.totalSales,
        transactions: txCount,
        averageOrderValue: aov,
        itemsSold: entry.itemsSold,
        refunds: entry.refundsTotal,
        percentageShare,
        salesGrowth,
      };
    });

    // Sort categories by total sales descending by default (matches UI donut chart legend & table order)
    categoryPerformanceList.sort((a, b) => b.totalSales - a.totalSales);

    // Filter out categories with zero sales if you want clean UI representation, or keep them. 
    // Usually, donut charts look best showing active categories. Let's provide all or filter active ones:
    const activeCategories = categoryPerformanceList.filter(c => c.totalSales > 0);

    // 9. Prepare "Top Categories by Growth" list (sorted by salesGrowth descending)
    const topCategoriesByGrowth = [...categoryPerformanceList]
      .filter(c => c.totalSales > 0)
      .sort((a, b) => b.salesGrowth - a.salesGrowth);

    return {
      dateRange: { start, end },
      summaryMetrics: {
        totalSales,
        totalTransactions,
        averageOrderValue,
        itemsSold,
        totalRefunds,
        salesGrowthPercentage,
      },
      // Data powering the Donut Chart and Center Text ("TOTAL SALES GH₵ 124,680.00")
      donutChartData: activeCategories.map(cat => ({
        categoryName: cat.categoryName,
        totalSales: cat.totalSales,
        percentageShare: Number(cat.percentageShare.toFixed(1)),
      })),
      // Data powering the "Top Categories by Growth" side widget card
      topCategoriesByGrowth: topCategoriesByGrowth.slice(0, 5).map(cat => ({
        categoryName: cat.categoryName,
        totalSales: cat.totalSales,
        salesGrowth: Number(cat.salesGrowth.toFixed(1)),
      })),
      // Data powering the main "Category Performance Details" data table at the bottom
      categoryTableDetails: categoryPerformanceList,
    };
  }
}