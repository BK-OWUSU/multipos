import { SaleStatus, SessionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/dbHelper";
import { parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";

export type DateFilterPreset = "daily" | "current_week" | "current_month" | "last_month" | "custom";

interface DashboardQueryParams {
  businessId: string;
  shopId: string;
  filter?: DateFilterPreset;
  customStartDate?: string | Date;
  customEndDate?: string | Date;
}

export class ShopDashboardService {

static async getStoreDashboardData({
  businessId,
  shopId,
  filter = "daily",
  customStartDate,
  customEndDate,
}: DashboardQueryParams) {
  const now = new Date();
  let start = startOfDay(now);
  let end = endOfDay(now);

  // ── 1. DATE RANGE RESOLUTION USING DATE-FNS ──
  switch (filter) {
    case "daily":
      start = startOfDay(now);
      end = endOfDay(now);
      break;

    case "current_week":
      // weekStartsOn: 1 (Monday)
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
      start = customStartDate 
        ? (typeof customStartDate === "string" ? startOfDay(parseISO(customStartDate)) : startOfDay(customStartDate))
        : startOfDay(now);
      
      end = customEndDate 
        ? (typeof customEndDate === "string" ? endOfDay(parseISO(customEndDate)) : endOfDay(customEndDate))
        : endOfDay(now);
      break;

    default:
      start = startOfDay(now);
      end = endOfDay(now);
      break;
  }

  try {
    const [
      salesData,
      topSellingItems,
      activeCashSession,
      inventorySummary,
      recentSales,
      shopDetails,
    ] = await Promise.all([
      prisma.sale.findMany({
        where: {
          businessId,
          shopId,
          status: SaleStatus.COMPLETED,
          createdAt: { gte: start, lte: end },
        },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true }
              }
            }
          }
        }
      }),

      prisma.saleItem.groupBy({
        by: ['productVariantId'],
        where: {
          businessId,
          sale: {
            shopId,
            status: SaleStatus.COMPLETED,
            createdAt: { gte: start, lte: end },
          }
        },
        _sum: {
          quantity: true,
          subtotal: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5,
      }),

      prisma.cashSession.findFirst({
        where: {
          businessId,
          shopId,
          status: SessionStatus.OPEN,
        },
        include: { openedBy: true },
        orderBy: { openedAt: 'desc' }
      }),

      prisma.shopInventory.findMany({
        where: { businessId, shopId },
        select: {
          stock: true,
          lowStockAlert: true,
          variant: { select: { price: true } }
        }
      }),

      prisma.sale.findMany({
        where: { businessId, shopId },
        include: { invoice: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          name: true,
          address: true,
          phone: true,
          openingTime: true,
          closingTime: true,
          business: { select: { email: true } }
        }
      })
    ]);

    let totalSalesAmount = 0;
    let totalGrossProfit = 0;
    let totalItemsSold = 0;
    const salesOverviewMap: Record<string, { sales: number; transactions: number }> = {};

    salesData.forEach((sale) => {
      const saleTotal = Number(sale.totalAmount);
      totalSalesAmount += saleTotal;

      const timeKey = new Date(sale.createdAt).toLocaleString('en-US', {
        hour: 'numeric',
        hour12: true,
      });
      
      if (!salesOverviewMap[timeKey]) {
        salesOverviewMap[timeKey] = { sales: 0, transactions: 0 };
      }
      salesOverviewMap[timeKey].sales += saleTotal;
      salesOverviewMap[timeKey].transactions += 1;

      sale.items.forEach((item) => {
        const qty = item.quantity;
        const sub = Number(item.subtotal);
        const cost = Number(item.costPrice) * qty;
        
        totalItemsSold += qty;
        totalGrossProfit += (sub - cost);
      });
    });

    const totalTransactions = salesData.length;
    const averageSaleValue = totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;

    const variantIds = topSellingItems.map((item) => item.productVariantId);
    const variantsDetails = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: true,
        images: { where: { isPrimary: true }, take: 1 }
      }
    });

    const topSellingProductsFormatted = topSellingItems.map((item) => {
      const variant = variantsDetails.find((v) => v.id === item.productVariantId);
      return {
        id: item.productVariantId,
        productName: variant ? `${variant.product.name} ${variant.sku}` : "Unknown Product",
        imageUrl: variant?.images[0]?.imageUrl || null,
        qtySold: item._sum.quantity || 0,
        salesAmount: Number(item._sum.subtotal || 0),
      };
    });

    const totalProductsCount = inventorySummary.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    inventorySummary.forEach((inv) => {
      totalStockValue += inv.stock * Number(inv.variant.price);
      if (inv.stock === 0) {
        outOfStockCount++;
      } else if (inv.stock <= inv.lowStockAlert) {
        lowStockCount++;
      }
    });

    return {
      metrics: {
        totalSales: totalSalesAmount,
        transactionsCount: totalTransactions,
        averageSale: averageSaleValue,
        itemsSold: totalItemsSold,
        grossProfit: totalGrossProfit,
      },
      salesOverview: salesOverviewMap,
      topSellingProducts: topSellingProductsFormatted,
      cashRegister: activeCashSession ? {
        openedBy: `${activeCashSession.openedBy.firstName} ${activeCashSession.openedBy.lastName}`,
        openedAt: activeCashSession.openedAt,
        openingFloat: Number(activeCashSession.startFloat),
        status: activeCashSession.status,
      } : null,
      inventory: {
        totalProducts: totalProductsCount,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
        stockValue: totalStockValue,
      },
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        invoiceNumber: sale.invoice?.customId || sale.customId,
        amount: Number(sale.totalAmount),
        createdAt: sale.createdAt,
      })),
      shopInfo: shopDetails ? {
        name: shopDetails.name,
        address: shopDetails.address,
        phone: shopDetails.phone,
        email: shopDetails.business.email,
        openingHours: `${shopDetails.openingTime || '8:00 AM'} - ${shopDetails.closingTime || '10:00 PM'}`,
      } : null,
    };

  } catch (error) {
    console.error("Error fetching store dashboard data:", error);
    throw new Error("Failed to load dashboard metrics");
  }
}
}
