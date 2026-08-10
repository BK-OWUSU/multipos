import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { CategorySalesSummaryData, CategorySummaryMetrics } from "@/types/types/sale-by-category-analytics.type";

type CategorySalesSummaryStore = {
  // States
  dateRange: CategorySalesSummaryData["dateRange"] | null;
  metrics: CategorySummaryMetrics | null;
  donutChartData: CategorySalesSummaryData["donutChartData"] | null;
  topCategoriesByGrowth: CategorySalesSummaryData["topCategoriesByGrowth"] | null;
  categoryTableDetails: CategorySalesSummaryData["categoryTableDetails"] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCategorySalesSummary: (filters?: {
    shopId?: string;
    filter?: "" | "daily" | "current_week" | "last_week" | "current_month" | "last_month" | "custom";
    startDate?: string;
    endDate?: string;
    compareWithPrevious?: boolean;
  }) => Promise<void>;
};

export const useCategorySalesSummaryStore = create<CategorySalesSummaryStore>((set) => ({
  // Initial States
  dateRange: null,
  metrics: null,
  donutChartData: null,
  topCategoriesByGrowth: null,
  categoryTableDetails: null,
  isLoading: false,
  error: null,

  // Fetch Category Sales Analytics Summary
  fetchCategorySalesSummary: async (filters) => {
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

      const queryString = params.toString();
      const endpoint = queryString ? `/business/analytics/sales-category?${queryString}` : `/business/analytics/sales-category`;

      const response = await apiClient.get(endpoint);
      const data = response.data.data as CategorySalesSummaryData;

      // Map raw flat backend numbers to the UI-expected nested structure
      const rawMetrics = data.summaryMetrics;
      const formattedMetrics: CategorySummaryMetrics | null = rawMetrics ? {
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
      } : null;

      set({
        dateRange: data.dateRange,
        metrics: formattedMetrics,
        donutChartData: data.donutChartData,
        topCategoriesByGrowth: data.topCategoriesByGrowth,
        categoryTableDetails: data.categoryTableDetails,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Error fetching category sales summary analytics:", error);
      set({
        dateRange: null,
        metrics: null,
        donutChartData: null,
        topCategoriesByGrowth: null,
        categoryTableDetails: null,
        isLoading: false,
        error: (error as Error).message || "Failed to fetch category sales summary analytics records.",
      });
    }
  },
}));