import { CategorySalesAnalyticsService } from "@/lib/services/analytics_dashboards/sales-by-category-analytics";

export type CategorySalesSummaryData = Awaited<ReturnType<typeof CategorySalesAnalyticsService.getCategorySalesAnalyticsReport>>;

// Define the nested summary metric shape
export type CategorySummaryMetricItem = {
  current: number;
  previous?: number;
  percentageChange: number;
};

// Explicitly define CategorySummaryMetrics with the structured format
export type CategorySummaryMetrics = {
  totalSales: CategorySummaryMetricItem;
  totalTransactions: CategorySummaryMetricItem;
  averageOrderValue: CategorySummaryMetricItem;
  itemsSold: CategorySummaryMetricItem;
  totalRefunds: CategorySummaryMetricItem;
};

export type CategoryDateRange = CategorySalesSummaryData["dateRange"];
export type DonutChartItem = CategorySalesSummaryData["donutChartData"][number];
export type TopCategoryByGrowthItem = CategorySalesSummaryData["topCategoriesByGrowth"][number];
export type CategoryTableDetailItem = CategorySalesSummaryData["categoryTableDetails"][number];