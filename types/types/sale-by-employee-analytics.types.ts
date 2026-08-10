import { EmployeeSalesAnalyticsService } from "@/lib/services/analytics_dashboards/sale-by-Employee-analytics.service";


export type EmployeeSalesSummaryData = Awaited<ReturnType<typeof EmployeeSalesAnalyticsService.getEmployeeSalesAnalyticsReport>>;

// Define the nested summary metric shape
export type EmployeeSummaryMetricItem = {
  current: number;
  previous?: number;
  percentageChange: number;
};

// Explicitly define EmployeeSummaryMetrics with the structured format
export type EmployeeSummaryMetrics = {
  totalSales: EmployeeSummaryMetricItem;
  totalTransactions: EmployeeSummaryMetricItem;
  averageOrderValue: EmployeeSummaryMetricItem;
  itemsSold: EmployeeSummaryMetricItem;
  totalRefunds: EmployeeSummaryMetricItem;
  salesGrowthPercentage: number;
};

export type EmployeeDateRange = EmployeeSalesSummaryData["dateRange"];
export type EmployeeBarChartItem = EmployeeSalesSummaryData["barChartData"][number];
export type EmployeeDonutChartItem = EmployeeSalesSummaryData["donutChartData"][number];
export type TopEmployeeByGrowthItem = EmployeeSalesSummaryData["topListByGrowth"][number];
export type EmployeeTableDetailItem = EmployeeSalesSummaryData["tableDetails"][number];