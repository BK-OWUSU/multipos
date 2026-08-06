import { DashboardService } from "@/lib/services/analytics_dashboards/business-dashboard.service";

// Instantiate or reference the service type
export const dashboardService = new DashboardService();

// 1. Individual Method Return Types using native TypeScript Awaited & ReturnType
export type DashboardMetricsData = Awaited<ReturnType<typeof dashboardService.getDashboardMetrics>>;
export type SalesOverviewData = Awaited<ReturnType<typeof dashboardService.getSalesOverview>>;
export type SalesByCategoryData = Awaited<ReturnType<typeof dashboardService.getSalesByCategory>>;
export type DashboardWidgetsData = Awaited<ReturnType<typeof dashboardService.getDashboardWidgets>>;

// 2. Combined Comprehensive Dashboard Payload Type
export type DashboardPayload = {
  metrics: DashboardMetricsData;
  overview: SalesOverviewData;
  categorySales: SalesByCategoryData;
} & DashboardWidgetsData;