import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { SalesSummaryData, SalesMetrics } from "@/types/types/sales-summary-analytics.types";

type SalesSummaryStore = {
  // States
  dateRange: SalesSummaryData["dateRange"] | null;
  metrics: SalesMetrics | null;
  salesByShop: SalesSummaryData["salesByShop"] | null;
  salesOverTimeChart: SalesSummaryData["salesOverTimeChart"] | null;
  historicalPeriods: SalesSummaryData["historicalPeriods"] | null;
  salesHighlights: SalesSummaryData["salesHighlights"] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSalesSummary: (filters?: {
    shopId?: string;
    filter?: "" | "daily" | "current_week" | "current_month" | "last_month" | "custom";
    startDate?: string;
    endDate?: string;
    compareWithPrevious?: boolean;
  }) => Promise<void>;
};

export const useSalesSummaryStore = create<SalesSummaryStore>((set) => ({
  // Initial States
  dateRange: null,
  metrics: null,
  salesByShop: null,
  salesOverTimeChart: null,
  historicalPeriods: null,
  salesHighlights: null,
  isLoading: false,
  error: null,

  // Fetch Sales Summary Analytics
  fetchSalesSummary: async (filters) => {
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
      const endpoint = queryString ? `/business/analytics/sales-summary?${queryString}` : `/business/analytics/sales-summary`;

      const response = await apiClient.get(endpoint);
      const data = response.data.data as SalesSummaryData;

      // Map raw flat backend numbers to the UI-expected nested structure
      const rawMetrics = data.metrics;
      const formattedMetrics: SalesMetrics | null = rawMetrics ? {
        totalSales: {
          current: rawMetrics.totalSales,
          percentageChange: rawMetrics.salesGrowthPercentage ?? 0,
        },
        totalTransactions: {
          current: rawMetrics.totalTransactions,
          percentageChange: 0, // Fallback if property doesn't exist on backend
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
        salesByShop: data.salesByShop,
        salesOverTimeChart: data.salesOverTimeChart,
        historicalPeriods: data.historicalPeriods,
        salesHighlights: data.salesHighlights,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Error fetching sales summary analytics:", error);
      set({
        dateRange: null,
        metrics: null,
        salesByShop: null,
        salesOverTimeChart: null,
        historicalPeriods: null,
        salesHighlights: null,
        isLoading: false,
        error: (error as Error).message || "Failed to fetch sales summary analytics records.",
      });
    }
  },
}));