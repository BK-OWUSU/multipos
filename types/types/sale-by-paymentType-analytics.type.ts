import { PaymentSalesAnalyticsService } from "@/lib/services/analytics_dashboards/sale-by-pamentType-analytics.service";


export type PaymentSalesSummaryData = Awaited<ReturnType<typeof PaymentSalesAnalyticsService.getPaymentSalesAnalyticsReport>>;

// Define the nested summary metric shape
export type PaymentSummaryMetricItem = {
  current: number;
  previous?: number;
  percentageChange: number;
};

// Explicitly define PaymentSummaryMetrics with the structured format
export type PaymentSummaryMetrics = {
  totalSales: PaymentSummaryMetricItem;
  totalTransactions: PaymentSummaryMetricItem;
  averageOrderValue: PaymentSummaryMetricItem;
  itemsSold: PaymentSummaryMetricItem;
  totalRefunds: PaymentSummaryMetricItem;
  salesGrowthPercentage: number;
};

export type PaymentDateRange = PaymentSalesSummaryData["dateRange"];
export type PaymentBarChartItem = PaymentSalesSummaryData["barChartData"][number];
export type PaymentDonutChartItem = PaymentSalesSummaryData["donutChartData"][number];
export type TopPaymentByGrowthItem = PaymentSalesSummaryData["topListByGrowth"][number];
export type PaymentTableDetailItem = PaymentSalesSummaryData["tableDetails"][number];