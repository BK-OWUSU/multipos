import { CashSessionSummary } from './../types/sale.type';
import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { AxiosError } from "axios";
import { AppResponse } from "@/types/auth/auth";
import { POSCheckoutInput,CloseSessionInput ,OpenSessionInput} from "@/types/schema/sale.schema";
import { toast } from "sonner";
import { CashSession, Sale } from "@/types/sale.type";


// ── STORE STATE & ACTIONS TYPE DEFINITION ──
type SaleStore = {
  // States
  sales: Sale[] | null;
  activeSession: CashSession | null;
  cashSessionSummary: CashSessionSummary [] | null;
  loading: boolean;
  
  // Active Data table Filter Presets
  filters: {
    status?: string;
    paymentType?: string;
    shopId?: string;
  };

  // Actions: Sales Records
  fetchSales: (queryFilters?: Record<string, unknown>) => Promise<void>;
  updateFiltersLocal: (newFilters: Partial<SaleStore["filters"]>) => void;
  updateSaleStatusLocal: (saleId: string, status: Sale["status"]) => void;
  verifyOnlinePayment: (reference: string)=> Promise<AppResponse>;

  // Actions: Checkout Pipeline
  executeCheckout: (payload: POSCheckoutInput) => Promise<unknown>;
  // Actions: Cash Registers Shift Accountability (Shift-Drawer Handlers)
  fetchActiveCashSession: () => Promise<void>;
  openCashSession: (dada: OpenSessionInput) => Promise<AppResponse>;
  closeCashSession: (data: CloseSessionInput) => Promise<AppResponse>;
  fetchSummaryCashSessions: () => Promise<void>;
};

// ── ZUSTAND IMPLEMENTATION CORE ──
export const useSaleStore = create<SaleStore>((set, get) => ({
  sales: null,
  activeSession: null,
  cashSessionSummary: null,
  loading: false,
  filters: {},

  // Simply adjust state keys cleanly on the client side for sudden filters
  updateFiltersLocal: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  // Useful for real-time adjustments or webhook status syncs before a full re-fetch
  updateSaleStatusLocal: (saleId, status) => set((state) => ({
    sales: state.sales?.map((sale) => 
      sale.id === saleId ? { ...sale, status } : sale
    ) || null
  })),

  /**
   * Fetches the complete list of sales records for management tables
   */
  fetchSales: async (queryFilters) => {
    try {
      set({ loading: true });
      const activeFilters = queryFilters || get().filters;
      
      const response = await apiClient.get("/business/sales", {
        params: activeFilters
      });
      
      set({
        sales: response.data.sales as Sale[],
        loading: false,
      });
    } catch (error) {
      console.error("Error pulling history ledger metrics: ", error);
      set({ sales: null, loading: false });
    }
  },

  /**
   * Submits the raw structured cart info right down into the backend billing router
   */
  executeCheckout: async (payload: POSCheckoutInput) => {
    set({ loading: true });
    try {
      const response = await apiClient.post("/business/sales/checkout", payload);
      
      // If payment strategy was simple CASH, let's refresh list immediately
      if (response.data.success && payload.paymentMethod === "CASH") {
        await get().fetchSales();
      }
      
      return response.data; // Return full body so CheckoutButton can read the access_code cleanly
    } catch (error) {
      console.error("Pipeline failure running order execution execution: ", error);
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || "Error compiling order creation.");
      }
      throw error;
    } finally {
      set({ loading: false });
    }
  },  
  
  verifyOnlinePayment: async (reference: string) => {
    set({ loading: true });
    try {
      const response = await apiClient.post("/business/shops/transaction/verify-online-payment", {reference});
      
      // If payment strategy was simple CASH, let's refresh list immediately
      if (response.data.success) {
        toast.success(response.data.message)
        await get().fetchSales();
      }  
      return response.data;
    } catch (error) {
      console.error("Pipeline failure running order execution execution: ", error);
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.error || "Error compiling order creation.");
      }
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Identifies if the performing cashier has an open float drawer active right now
   */
  fetchActiveCashSession: async () => {
    try {
      set({ loading: true });
      const response = await apiClient.get("/business/shops/cash-register/active");
  
      const session = response.data.data as CashSession || null
      set({
        activeSession: session ,
        loading: false
      });
    } catch (error) {
      console.error("Error checking register logs:", error);
      set({ activeSession: null, loading: false });
    }
  },

 fetchSummaryCashSessions: async () => {
    try {
      set({ loading: true });
      const response = await apiClient.get("/business/shops/cash-register/summary");
  
      const session = response.data.data ;
      set({
        cashSessionSummary: session ,
        loading: false
      });
    } catch (error) {
      console.error("Error checking register logs:", error);
      set({ 
        cashSessionSummary: null, 
        loading: false });
    }
  },

  /**
   * Initializes a new opening balance/float drawer state to record transactional tracking shifts
   */
  openCashSession: async (data: OpenSessionInput) => {
    set({ loading: true });
    try {
      const response = await apiClient.post("/business/shops/cash-register/open", data);
      if (response.data.success) {
        set({ activeSession: response.data.data as CashSession });
        toast.success("Cash drawer session initialized successfully.");
        return {
          success: true,
          message: response.data.message,
          status: response.status
        } as AppResponse;
      }
      return { success: false, message: response.data.error } as AppResponse;
    } catch (error) {
      const msg = error instanceof AxiosError ? error.response?.data?.error : "Error opening shift logs";
      toast.error(msg || "Error updating ledger state.");
      return { success: false, error: msg } as AppResponse;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Performs real-time accounting calculations, comparisons, and locks down current shift
   */
  closeCashSession: async (data: CloseSessionInput) => {
    set({ loading: true });
    try {
      const response = await apiClient.patch("/business/shops/cash-register/close", data);
      if (response.data.success) {
        set({ activeSession: null }); // Shift closed cleanly
        toast.success("Drawer closed and shift reports compiled.");
        return {
          success: true,
          message: response.data.message,
          status: response.status
        } as AppResponse;
      }
      return { success: false, message: response.data.error } as AppResponse;
    } catch (error) {
      const msg = error instanceof AxiosError ? error.response?.data?.error : "Error closing current drawer shift logs";
      toast.error(msg || "Accountant submission failed.");
      return { success: false, error: msg } as AppResponse;
    } finally {
      set({ loading: false });
    }
  }
}));