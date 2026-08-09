import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { ShopDashboardData } from "@/types/types/shop-dashboard.type";

type ShopDashboardStore = {
  // States
  metrics: ShopDashboardData["metrics"] | null;
  salesOverview: ShopDashboardData["salesOverview"] | null;
  topSellingProducts: ShopDashboardData["topSellingProducts"] | null;
  cashRegister: ShopDashboardData["cashRegister"] | null;
  inventory: ShopDashboardData["inventory"] | null;
  recentSales: ShopDashboardData["recentSales"] | null;
  shopInfo: ShopDashboardData["shopInfo"] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboardData: (filters?: {
    shopId?: string;
    filter?: "" | "daily" | "current_week" | "current_month" | "last_month" | "custom";
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
};

export const useShopDashboardStore = create<ShopDashboardStore>((set) => ({
  // Initial States
  metrics: null,
  salesOverview: null,
  topSellingProducts: null,
  cashRegister: null,
  inventory: null,
  recentSales: null,
  shopInfo: null,
  isLoading: false,
  error: null,

  // Fetch Shop Dashboard Analytics
  fetchDashboardData: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.shopId) {
        params.append("shopId", filters.shopId);
      }
      if (filters?.filter) {
        params.append("filter", filters.filter);
      }
      if (filters?.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.append("endDate", filters.endDate);
      }

      const queryString = params.toString();
      // Adjust the endpoint path to point to your shop dashboard API route
      const endpoint = queryString ? `/business/shops/dashboard?${queryString}` : `/business/shops/dashboard`;

      const response = await apiClient.get(endpoint);
      const data = response.data.data as ShopDashboardData;

      set({
        metrics: data.metrics,
        salesOverview: data.salesOverview,
        topSellingProducts: data.topSellingProducts,
        cashRegister: data.cashRegister,
        inventory: data.inventory,
        recentSales: data.recentSales,
        shopInfo: data.shopInfo,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Error fetching shop dashboard analytics:", error);
      set({
        metrics: null,
        salesOverview: null,
        topSellingProducts: null,
        cashRegister: null,
        inventory: null,
        recentSales: null,
        shopInfo: null,
        isLoading: false,
        error: (error as Error).message || "Failed to fetch shop dashboard analytics records.",
      });
    }
  },
}));