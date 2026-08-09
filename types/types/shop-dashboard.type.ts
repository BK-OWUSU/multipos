import { ShopDashboardService } from "@/lib/services/analytics_dashboards/shop-dashbaord.service";

// 1. Extract the return type of your dashboard service method
export type ShopDashboardData = Awaited<ReturnType<typeof ShopDashboardService.getStoreDashboardData>>;

// 2. Extract specific nested subsections if you need them individually for components
export type DashboardMetrics = ShopDashboardData["metrics"];
export type TopSellingProduct = ShopDashboardData["topSellingProducts"][number];
export type CashRegisterInfo = ShopDashboardData["cashRegister"];
export type InventorySummary = ShopDashboardData["inventory"];
export type RecentSaleItem = ShopDashboardData["recentSales"][number];
export type ShopInfo = ShopDashboardData["shopInfo"];