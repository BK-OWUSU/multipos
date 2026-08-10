import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { EmployeeSalesSummaryData, EmployeeSummaryMetrics } from "@/types/types/sale-by-employee-analytics.types";

type EmployeeSalesSummaryStore = {
  // States
  dateRange: EmployeeSalesSummaryData["dateRange"] | null;
  groupBy: EmployeeSalesSummaryData["groupBy"] | null;
  metrics: EmployeeSummaryMetrics | null;
  barChartData: EmployeeSalesSummaryData["barChartData"] | null;
  donutChartData: EmployeeSalesSummaryData["donutChartData"] | null;
  topListByGrowth: EmployeeSalesSummaryData["topListByGrowth"] | null;
  tableDetails: EmployeeSalesSummaryData["tableDetails"] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchEmployeeSalesSummary: (filters?: {
    shopId?: string;
    filter?: "" | "daily" | "current_week" | "last_week" | "current_month" | "last_month" | "custom";
    startDate?: string;
    endDate?: string;
    compareWithPrevious?: boolean;
    groupBy?: "Employee" | "Daily" | "Shop";
  }) => Promise<void>;
};

export const useEmployeeSalesSummaryStore = create<EmployeeSalesSummaryStore>((set) => ({
  // Initial States
  dateRange: null,
  groupBy: null,
  metrics: null,
  barChartData: null,
  donutChartData: null,
  topListByGrowth: null,
  tableDetails: null,
  isLoading: false,
  error: null,

  // Fetch Employee Sales Analytics Summary
  fetchEmployeeSalesSummary: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.shopId) params.append("shopId", filters.shopId);
      if (filters?.filter) params.append("filter", filters.filter);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.compareWithPrevious !== undefined) {
        params.append("compareWithPrevious", String(filters.compareWithPrevious));
      }
      if (filters?.groupBy) params.append("groupBy", filters.groupBy);

      const queryString = params.toString();
      const endpoint = queryString ? `/business/analytics/sales-employee?${queryString}` : `/business/analytics/sales-employee`;

      const response = await apiClient.get(endpoint);
      const data = response.data.data as EmployeeSalesSummaryData;

      // Map raw flat backend numbers to the UI-expected nested structure
      const rawMetrics = data.summaryMetrics;
      const formattedMetrics: EmployeeSummaryMetrics | null = rawMetrics ? {
        totalSales: {
          current: rawMetrics.totalSales,
          percentageChange: rawMetrics.salesGrowthPercentage ?? 0,
        },
        totalTransactions: {
          current: rawMetrics.totalTransactions,
          percentageChange: 0,
        },
        averageOrderValue: {
          current: rawMetrics.averageOrderValue,
          percentageChange: 0,
        },
        itemsSold: {
          current: rawMetrics.itemsSold,
          percentageChange: 0,
        },
        totalRefunds: {
          current: rawMetrics.totalRefunds,
          percentageChange: 0,
        },
        salesGrowthPercentage: rawMetrics.salesGrowthPercentage,
      } : null;

      set({
        dateRange: data.dateRange,
        groupBy: data.groupBy,
        metrics: formattedMetrics,
        barChartData: data.barChartData,
        donutChartData: data.donutChartData,
        topListByGrowth: data.topListByGrowth,
        tableDetails: data.tableDetails,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Error fetching employee sales summary analytics:", error);
      set({
        dateRange: null,
        groupBy: null,
        metrics: null,
        barChartData: null,
        donutChartData: null,
        topListByGrowth: null,
        tableDetails: null,
        isLoading: false,
        error: (error as Error).message || "Failed to fetch employee sales summary analytics records.",
      });
    }
  },
}));