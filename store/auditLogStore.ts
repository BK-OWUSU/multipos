import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { AuditLogQueryFilters, AuditLogDashboardData } from "@/types/auth/auditLogs";

type AuditLogState = {
  // Query Filters State (omitting businessId since server extracts it safely from session)
  filters: Omit<AuditLogQueryFilters, "businessId">;
  
  // Server Response Payload Cache & UI Indicators
  logData: AuditLogDashboardData | null;
  loading: boolean;
  error: string | null;

  // State Mutation Actions
  setTab: (tab: string) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setShopId: (shopId: string | null) => void;
  setUserId: (userId: string | null) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  
  // Data Aggregator Ingestion Lifecycle Method
  fetchLogs: () => Promise<void>;
};

export const useAuditLogStore = create<AuditLogState>((set, get) => ({
  // Defaults matching your validation schema constraints
  filters: {
    tab: "all",
    shopId: null,
    userId: null,
    search: "",
    page: 1,
    limit: -1, // CRITICAL: Changed from 15 to -1 to trigger unbounded mode for TanStack Table
  },
  logData: null,
  loading: false,
  error: null,

  setTab: (tab) => {
    // Shifting tabs forces viewport back to index 1 to prevent indexing drift crashes
    set((state) => ({
      filters: { ...state.filters, tab, page: 1 },
    }));
  },

  setSearch: (search) => {
    set((state) => ({
      filters: { ...state.filters, search, page: 1 },
    }));
  },

  setPage: (page) => {
    set((state) => ({
      filters: { ...state.filters, page },
    }));
  },

  setShopId: (shopId) => {
    set((state) => ({
      filters: { ...state.filters, shopId, page: 1 },
    }));
  },

  setUserId: (userId) => {
    set((state) => ({
      filters: { ...state.filters, userId, page: 1 },
    }));
  },

  setDateRange: (startDate, endDate) => {
    set((state) => ({
      filters: { ...state.filters, startDate, endDate, page: 1 },
    }));
  },

  fetchLogs: async () => {
    try {
      set({ loading: true, error: null });
      const { filters } = get();

      // Build search query parameters cleanly 
      const params = new URLSearchParams({
        tab: filters.tab,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        search: filters.search || "",
      });

      if (filters.shopId) params.append("shopId", filters.shopId);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      // Ingest payload using your standard backend client routing layer
      const response = await apiClient.get(`/auth/audit-trail?${params.toString()}`);
      const rawPayload = response.data as AuditLogDashboardData;
      

      set({
        logData: rawPayload,
        loading: false,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to load audit trail records.";

      if (error instanceof AxiosError) {
        // Strict evaluation of the response packet structure without using "any"
        const remoteFieldError = error.response?.data as { error?: string; message?: string } | undefined;
        errorMessage = remoteFieldError?.message || remoteFieldError?.error || error.message || errorMessage;
        
        if (error.response?.status === 401) {
          errorMessage = "Your validation session has expired. Please log back in.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error("Error pipeline caught during logging aggregation: ", error);
      toast.error(errorMessage);
      
      set({ 
        logData: null, 
        error: errorMessage, 
        loading: false 
      });
    }
  },
}));