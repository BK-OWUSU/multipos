import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { toast } from "sonner"; 
import { AppResponse } from "@/types/auth/auth";
import { TimeCard, TimeCardQueryFilters } from "@/types/timecards.type";

interface TimeCardState {
  activeTimeCards: TimeCard[];
  historicalLogs: TimeCard[];
  loading: boolean;
  error: string | null;

  fetchActiveTimeCards: (businessId: string, shopId?: string) => Promise<void>;
  fetchTimeCards: (filters: TimeCardQueryFilters) => Promise<void>;
  clockIn: (employeeId: string, notes?: string) => Promise<AppResponse>;
  clockOut: (timeCardId: string, notes?: string) => Promise<AppResponse>;
  isUserClockedIn: () => boolean;
}

export const useTimeCardStore = create<TimeCardState>((set, get) => ({
  activeTimeCards: [],
  historicalLogs: [],
  loading: false,
  error: null,

  fetchTimeCards: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get(`/business/shops/time-card?${params.toString()}`);
      set({ 
        historicalLogs: response.data?.data || [], 
        loading: false 
      });
    } catch (err: unknown) {
      const errMsg = (err as Error).message || "Failed to retrieve historical timecard logs.";
      set({ loading: false, error: errMsg });
      toast.error(errMsg);
    }
  },

  fetchActiveTimeCards: async (businessId, shopId) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams({ businessId });
      if (shopId) params.append("shopId", shopId);

      const response = await apiClient.get(`/business/shops/time-card/active?${params.toString()}`);
      set({ activeTimeCards: response.data?.data || [], loading: false });
    } catch (err: unknown) {
      console.log(err);
      set({ loading: false });
    }
  },

  /**
   * 🟢 Cleaned Selector logic targeting the individual worker's log scope safely
   */
  isUserClockedIn: () => {
    const { historicalLogs } = get();
    // Safely validates against the specific employee profile array context
  
    return historicalLogs.some((log) => log.status === "ACTIVE");
  },

  clockIn: async (employeeId, notes) => {
    set({ loading: true });
    try {
      const response = await apiClient.post("/business/shops/time-card/clock-in", {
        employeeId,
        notes,
      });

      if (response.data.success) {
        const newTimeCard = response.data.data as TimeCard;
        
        // 🟢 Update BOTH arrays so the UI state syncs instantly
        set((state) => ({
          activeTimeCards: [newTimeCard, ...state.activeTimeCards],
          historicalLogs: [newTimeCard, ...state.historicalLogs], 
          loading: false,
        }));

        toast.success(`Clocked In: ${newTimeCard.customId}`);

        return {
          success: true,
          message: response.data.message,
          status: response.status,
        } as AppResponse;
      }

      set({ loading: false });
      toast.error(response.data.error || "Failed to process clock in.");
      return { success: false, message: response.data.error } as AppResponse;

    } catch (error: unknown) {
      set({ loading: false });
      const errMsg = (error as Error).message || "An unexpected error occurred during clock in.";
      toast.error(errMsg);
      return { success: false, message: errMsg } as AppResponse;
    }
  },

  clockOut: async (timeCardId, notes) => {
  set({ loading: true });
  try {
    const response = await apiClient.post("/business/shops/time-card/clock-out", {
      timeCardId,
      notes,
    });

    if (response.data.success) {
      const updatedTimeCard = response.data.data as TimeCard;

      // 🟢 Fix: Spreading updatedTimeCard safely updates the status without double-specifying keys
      set((state) => ({
        activeTimeCards: state.activeTimeCards.filter((tc) => tc.id !== timeCardId),
        historicalLogs: state.historicalLogs.map((log) => 
          log.id === timeCardId ? { ...log, ...updatedTimeCard } : log
        ),
        loading: false,
      }));

      toast.success("Shift ended successfully. Hours logged to profile.");

      return {
        success: true,
        message: response.data.message,
        status: response.status,
      } as AppResponse;
    }

    set({ loading: false });
    toast.error(response.data.error || "Failed to process clock out.");
    return { success: false, message: response.data.error } as AppResponse;

  } catch (error: unknown) {
    set({ loading: false });
    const errMsg = (error as Error).message || "An unexpected error occurred during clock out.";
    toast.error(errMsg);
    return { success: false, message: errMsg } as AppResponse;
  }
},
}));