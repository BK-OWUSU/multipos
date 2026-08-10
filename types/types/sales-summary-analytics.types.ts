import { SalesAnalyticsService } from "@/lib/services/analytics_dashboards/sales-summary-analytics";

export type SalesSummaryData = Awaited<ReturnType<typeof SalesAnalyticsService.getSalesSummaryReport>>;

// Define the nested item shape
export type SalesMetricItem = {
  current: number;
  previous?: number;
  percentageChange: number;
};

// Explicitly define SalesMetrics with the nested structure so the store accepts it
export type SalesMetrics = {
  totalSales: SalesMetricItem;
  totalTransactions: SalesMetricItem;
  averageOrderValue: SalesMetricItem;
  itemsSold: SalesMetricItem;
  totalRefunds: SalesMetricItem;
};

export type SalesByShopItem = SalesSummaryData["salesByShop"][number];
export type SalesDateRange = SalesSummaryData["dateRange"];
export type SalesOverTimeItem = SalesSummaryData["salesOverTimeChart"][number];
export type HistoricalPeriodItem = SalesSummaryData["historicalPeriods"][number];
export type SalesHighlights = SalesSummaryData["salesHighlights"];