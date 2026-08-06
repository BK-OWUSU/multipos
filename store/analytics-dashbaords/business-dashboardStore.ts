import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { DashboardPayload } from "@/types/types/dashbaords.type";

type DashboardStore = {
  // States
  metrics: DashboardPayload["metrics"] | null;
  overview: DashboardPayload["overview"] | null;
  categorySales: DashboardPayload["categorySales"] | null;
  topProducts: DashboardPayload["topProducts"] | null;
  recentTransactions: DashboardPayload["recentTransactions"] | null;
  lowStockInventory: DashboardPayload["lowStockInventory"] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboardData: (filters?: {
    shopId?: string;
    preset?: ""|"daily" | "current_week" | "current_month" | "last_month" | "custom";
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  // Initial States
  metrics: null,
  overview: null,
  categorySales: null,
  topProducts: null,
  recentTransactions: null,
  lowStockInventory: null,
  isLoading: false,
  error: null,

  // Fetch Dashboard Analytics Matrix
  fetchDashboardData: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.shopId) {
        params.append("shopId", filters.shopId);
      }
      if (filters?.preset) {
        params.append("preset", filters.preset);
      }
      if (filters?.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.append("endDate", filters.endDate);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/business/business-dashboard?${queryString}` : `/business/business-dashboard`;

      const response = await apiClient.get(endpoint);
      const data = response.data.data as DashboardPayload;

      set({
        metrics: data.metrics,
        overview: data.overview,
        categorySales: data.categorySales,
        topProducts: data.topProducts,
        recentTransactions: data.recentTransactions,
        lowStockInventory: data.lowStockInventory,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Error fetching dashboard analytics:", error);
      set({
        metrics: null,
        overview: null,
        categorySales: null,
        topProducts: null,
        recentTransactions: null,
        lowStockInventory: null,
        isLoading: false,
        error: (error as Error).message || "Failed to fetch dashboard analytics records.",
      });
    }
  },
}));