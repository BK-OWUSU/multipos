import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { 
  LoyaltyConfigurationWithRelations, 
  LoyaltyHistoryLedgerResponse, 
  LoyaltyMembersListResponse, 
  LoyaltyRewardsCatalogResponse, 
  LoyaltyTiersConfigResponse,
  LoyaltySummaryMetricsResponse
} from "@/types/loyalty";

type LoyaltyStore = {
  // States
  loyaltyConfigs: LoyaltyConfigurationWithRelations | null;
  loyaltyRewards: LoyaltyRewardsCatalogResponse | null; 
  loyaltyTiers: LoyaltyTiersConfigResponse | null;
  loyaltyMembersList: LoyaltyMembersListResponse['customers'] | null;
  loyaltyHistory: LoyaltyHistoryLedgerResponse['transactions'] | null;
  loyaltyMetrics: LoyaltySummaryMetricsResponse | null; 
  loading: boolean;

  // Actions
  fetchLoyaltyConfigs: () => Promise<void>;
  fetchLoyaltyRewards: () => Promise<void>;
  fetchLoyaltyTiers: () => Promise<void>;
  fetchLoyaltyMetrics: () => Promise<void>;
  
  // Paginated/Filtered Actions
  fetchLoyaltyMembersList: (filters?: { search?: string; tierId?: string; status?: "ACTIVE" | "BLOCKED"; page?: number; limit?: number }) => Promise<void>;
  fetchLoyaltyHistory: (filters?: { search?: string; type?: string; page?: number; limit?: number }) => Promise<void>;
};

export const useLoyaltyStore = create<LoyaltyStore>((set) => ({
  // Initial States
  loyaltyConfigs: null,
  loyaltyRewards: null,
  loyaltyTiers: null,
  loyaltyMembersList: null,
  loyaltyHistory: null,
  loyaltyMetrics: null,
  loading: false,

  // 1. Fetch Global Loyalty Configurations
  fetchLoyaltyConfigs: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get("/business/settings/loyalty/configs");
      const loyaltySettings = response.data.data as LoyaltyConfigurationWithRelations;
      set({ loyaltyConfigs: loyaltySettings, loading: false });
    } catch (error) {
      console.error("Error fetching loyalty configs:", error);
      set({ loyaltyConfigs: null, loading: false });
    }
  },

  // 2. Fetch Rewards Catalog Array
  fetchLoyaltyRewards: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get("/business/settings/loyalty/rewards");
      set({ loyaltyRewards: response.data.data as LoyaltyRewardsCatalogResponse, loading: false });
    } catch (error) {
      console.error("Error fetching loyalty rewards:", error);
      set({ loyaltyRewards: null, loading: false });
    }
  },

  // 3. Fetch Tiers Configuration List
  fetchLoyaltyTiers: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get("/business/settings/loyalty/tiers");
      set({ loyaltyTiers: response.data.data as LoyaltyTiersConfigResponse, loading: false });
    } catch (error) {
      console.error("Error fetching loyalty tiers:", error);
      set({ loyaltyTiers: null, loading: false });
    }
  },

  // 4. Fetch Summary Dashboard KPI Aggregates
  fetchLoyaltyMetrics: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get("/business/settings/loyalty/metrics");
      set({ loyaltyMetrics: response.data.data as LoyaltySummaryMetricsResponse, loading: false });
    } catch (error) {
      console.error("Error fetching loyalty metrics:", error);
      set({ loyaltyMetrics: null, loading: false });
    }
  },

  // 5. Fetch Paginated / Filtered Loyalty Members List
  fetchLoyaltyMembersList: async (filters) => {
    set({ loading: true });
    try {
      // Build dynamic URL with query parameters matching your API requirements
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.tierId) params.append("tierId", filters.tierId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.limit) params.append("limit", String(filters.limit));

      const response = await apiClient.get(`/business/settings/loyalty/members?${params.toString()}`);
      const membersList = response.data.data as LoyaltyMembersListResponse['customers'][number][];
     
      
      // Note: If your API returns data inside response.data directly as { customers, meta }, pass it through
      set({ loyaltyMembersList: membersList, loading: false });
    } catch (error) {
      console.error("Error fetching loyalty members list:", error);
      set({ loyaltyMembersList: null, loading: false });
    }
  },

  // 6. Fetch Paginated / Filtered History Transaction Ledger
  fetchLoyaltyHistory: async (filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.type) params.append("type", filters.type);
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.limit) params.append("limit", String(filters.limit));

      const response = await apiClient.get(`/business/settings/loyalty/history?${params.toString()}`);
      const historyLedger = response.data.data as LoyaltyHistoryLedgerResponse['transactions'][number][];
      console.log("Fetched Loyalty History Ledger:", historyLedger);
      set({ loyaltyHistory: historyLedger, loading: false });
    } catch (error) {
      console.error("Error fetching loyalty history ledger:", error);
      set({ loyaltyHistory: null, loading: false });
    }
  },
}));