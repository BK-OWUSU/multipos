import { prisma } from "@/lib/dbHelper";
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  differenceInDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subMonths 
} from "date-fns";

// 1. Define preset options
export type DatePreset = "daily" | "current_week" | "current_month" | "last_month" | "custom";

interface DashboardQueryParams {
  businessId: string;
  shopId?: string;
  preset?: DatePreset; // Optional preset selector
  startDate?: Date;    // Required if preset is "custom"
  endDate?: Date;      // Required if preset is "custom"
}

export class DashboardService {
  /**
   * Resolves preset ranges or custom dates into concrete boundaries,
   * and computes the matching previous period for growth calculations.
   */
  private resolveDateRange(params: DashboardQueryParams) {
    const now = new Date();
    let start: Date;
    let end: Date;

    const preset = params.preset || "custom";

    switch (preset) {
      case "daily":
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case "current_week":
        // Adjust week start as needed (e.g., weekStartsOn: 1 for Monday)
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
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
      default:
        if (!params.startDate || !params.endDate) {
          throw new Error("startDate and endDate are required when using 'custom' date range.");
        }
        start = startOfDay(params.startDate);
        end = endOfDay(params.endDate);
        break;
    }

    // Calculate equivalent previous period for growth comparison
    const periodDays = differenceInDays(end, start) + 1;
    const prevStartDate = startOfDay(subDays(start, periodDays));
    const prevEndDate = endOfDay(subDays(end, periodDays));

    return { start, end, prevStartDate, prevEndDate };
  }

  /**
   * Helper to normalize date boundaries (backward compatible with internal calls)
   */
  private normalizeDates(startDate: Date, endDate: Date) {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    const periodDays = differenceInDays(end, start) + 1;
    const prevStartDate = startOfDay(subDays(start, periodDays));
    const prevEndDate = endOfDay(subDays(end, periodDays));

    return { start, end, prevStartDate, prevEndDate };
  }

  /**
   * Calculates current metrics and percentage growth compared to the equivalent previous period.
   */
  async getDashboardMetrics(params: DashboardQueryParams) {
    const shopFilter = params.shopId ? { shopId: params.shopId } : {};
    const { start, end, prevStartDate, prevEndDate } = this.resolveDateRange(params);

    // 1. Current Period Aggregates
    const currentSalesAgg = await prisma.sale.aggregate({
      where: { businessId: params.businessId, ...shopFilter, status: "COMPLETED", createdAt: { gte: start, lte: end } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const currentNewCustomers = await prisma.customer.count({
      where: { businessId: params.businessId, createdAt: { gte: start, lte: end } },
    });

    const currentSaleItems = await prisma.saleItem.findMany({
      where: {
        businessId: params.businessId,
        sale: { ...shopFilter, status: "COMPLETED", createdAt: { gte: start, lte: end } },
      },
      select: { quantity: true, unitPrice: true, costPrice: true },
    });

    const currentProfit = currentSaleItems.reduce(
      (acc, item) => acc + Number(item.quantity) * (Number(item.unitPrice) - Number(item.costPrice)),
      0
    );

    // 2. Previous Period Aggregates (for growth comparison)
    const prevSalesAgg = await prisma.sale.aggregate({
      where: { businessId: params.businessId, ...shopFilter, status: "COMPLETED", createdAt: { gte: prevStartDate, lte: prevEndDate } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const prevNewCustomers = await prisma.customer.count({
      where: { businessId: params.businessId, createdAt: { gte: prevStartDate, lte: prevEndDate } },
    });

    const prevSaleItems = await prisma.saleItem.findMany({
      where: {
        businessId: params.businessId,
        sale: { ...shopFilter, status: "COMPLETED", createdAt: { gte: prevStartDate, lte: prevEndDate } },
      },
      select: { quantity: true, unitPrice: true, costPrice: true },
    });

    const prevProfit = prevSaleItems.reduce(
      (acc, item) => acc + Number(item.quantity) * (Number(item.unitPrice) - Number(item.costPrice)),
      0
    );

    const calcGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    return {
      totalSales: {
        amount: currentSalesAgg._sum.totalAmount || 0,
        growth: calcGrowth(Number(currentSalesAgg._sum.totalAmount || 0), Number(prevSalesAgg._sum.totalAmount || 0)),
      },
      totalOrders: {
        count: currentSalesAgg._count.id,
        growth: calcGrowth(currentSalesAgg._count.id, prevSalesAgg._count.id),
      },
      newCustomers: {
        count: currentNewCustomers,
        growth: calcGrowth(currentNewCustomers, prevNewCustomers),
      },
      totalProfit: {
        amount: currentProfit,
        growth: calcGrowth(currentProfit, prevProfit),
      },
    };
  }

  async getSalesOverview(params: DashboardQueryParams) {
    const shopFilter = params.shopId ? { shopId: params.shopId } : {};
    const { start, end } = this.resolveDateRange(params);

    const sales = await prisma.sale.findMany({
      where: { businessId: params.businessId, ...shopFilter, status: "COMPLETED", createdAt: { gte: start, lte: end } },
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: "asc" },
    });

    const groupedData: Record<string, number> = {};
    sales.forEach((sale) => {
      const dateKey = sale.createdAt.toISOString().split("T")[0];
      groupedData[dateKey] = (groupedData[dateKey] || 0) + Number(sale.totalAmount);
    });

    return Object.entries(groupedData).map(([date, total]) => ({ date, total }));
  }

  async getSalesByCategory(params: DashboardQueryParams) {
    const shopFilter = params.shopId ? { shopId: params.shopId } : {};
    const { start, end } = this.resolveDateRange(params);

    const saleItems = await prisma.saleItem.findMany({
      where: {
        businessId: params.businessId,
        sale: { ...shopFilter, status: "COMPLETED", createdAt: { gte: start, lte: end } },
      },
      include: {
        variant: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
    });

    const categoryMap: Record<string, { name: string; total: number }> = {};
    saleItems.forEach((item) => {
      const categoryName = item.variant.product.category?.name || "Others";
      const subtotal = Number(item.quantity) * Number(item.unitPrice);
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = { name: categoryName, total: 0 };
      }
      categoryMap[categoryName].total += subtotal;
    });

    return Object.values(categoryMap);
  }

  async getDashboardWidgets(params: DashboardQueryParams) {
    const shopFilter = params.shopId ? { shopId: params.shopId } : {};
    const { start, end } = this.resolveDateRange(params);

    const saleItems = await prisma.saleItem.findMany({
      where: {
        businessId: params.businessId,
        sale: { ...shopFilter, status: "COMPLETED", createdAt: { gte: start, lte: end } },
      },
      include: { variant: { include: { product: true } } },
    });

    const productMap: Record<string, { name: string; soldQty: number; revenue: number }> = {};
    saleItems.forEach((item) => {
      const prodName = item.variant.product.name;
      if (!productMap[prodName]) {
        productMap[prodName] = { name: prodName, soldQty: 0, revenue: 0 };
      }
      productMap[prodName].soldQty += item.quantity;
      productMap[prodName].revenue += Number(item.subtotal);
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.soldQty - a.soldQty)
      .slice(0, 5);

    const recentTransactions = await prisma.sale.findMany({
      where: { businessId: params.businessId, ...shopFilter },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true, invoice: true },
    });

    const lowStockInventory = await prisma.shopInventory.findMany({
      where: { businessId: params.businessId, ...(params.shopId ? { shopId: params.shopId } : {}), stock: { lte: prisma.shopInventory.fields.lowStockAlert } },
      include: { variant: { include: { product: true } }, shop: true },
      take: 5,
    });

    return { topProducts, recentTransactions, lowStockInventory };
  }
}