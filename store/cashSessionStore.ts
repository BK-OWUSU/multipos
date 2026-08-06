import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { AxiosError } from "axios";
import { AppResponse } from "@/types/auth/auth";

import { toast } from "sonner";
import { CloseSessionInput, OpenSessionInput } from "@/types/schema/sale.schema";
import { CashSession } from "@/types/sale.type";

type CashSessionStore = {
  currentSession: CashSession | null;
  loading: boolean;
  fetchCurrentSession: () => Promise<void>;
  openSession: (data: OpenSessionInput) => Promise<AppResponse>;
  closeSession: (data: CloseSessionInput) => Promise<AppResponse>;
};

export const useCashSessionStore = create<CashSessionStore>((set, get) => ({
  currentSession: null,
  loading: false,

  /**
   * 🔍 FETCHES THE CURRENT OPEN CASH DRAWER SESSION FOR THE SHOP
   */
  fetchCurrentSession: async () => {
    try {
      set({ loading: true });
      const response = await apiClient.get("/business/shops/cash-register");
      
      if (response.data.success) {
        set({ currentSession: response.data.data as CashSession, loading: false });
      } else {
        set({ currentSession: null, loading: false });
      }
    } catch (error) {
      // Don't show toast error for normal 404/no-session states
      console.log("Active cash session sweep check completed: None found.");
      set({ currentSession: null, loading: false });
    }
  },

  /**
   * 🟢 INITIALIZES AND OPENS A NEW CASH DRAWER SESSION
   */
  openSession: async (data: OpenSessionInput) => {
    set({ loading: true });
    try {
      const response = await apiClient.post("/business/shops/cash-register/open", data);
      
      if (response.data.success) {
        // Hydrate the store state immediately with the database session row
        set({ currentSession: response.data.data as CashSession });
        toast.success(response.data.message || "Cash register opened successfully.");
        
        return {
          success: true,
          message: response.data.message,
          status: response.status,
        } as AppResponse;
      }
      
      set({ loading: false });
      return { success: false, message: response.data.error } as AppResponse;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error || "Error initializing cash session";
        toast.error(errorMessage);
        return { success: false, error: errorMessage } as AppResponse;
      }
      return { success: false, error: "Internal Server Error" } as AppResponse;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * 🔴 CLOSES AND BALANCES THE ACTIVE REGISTER SHIFT
   */
  closeSession: async (data: CloseSessionInput) => {
    set({ loading: true });
    try {
      const response = await apiClient.patch("/business/shops/cash-register/close", data);
      
      if (response.data.success) {
        // Clear out the state immediately since the session is no longer open
        set({ currentSession: null });
        
        // Show the closure status message containing shortage/overage metrics
        toast.info(response.data.message || "Register session closed.");
        
        return {
          success: true,
          message: response.data.message,
          data: response.data.data, // Contains variance analysis data points
          status: response.status,
        } as AppResponse;
      }
      
      set({ loading: false });
      return { success: false, message: response.data.error } as AppResponse;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error || "Error securing cash drawer lines";
        toast.error(errorMessage);
        return { success: false, error: errorMessage } as AppResponse;
      }
      return { success: false, error: "Internal Server Error" } as AppResponse;
    } finally {
      set({ loading: false });
    }
  },
}));