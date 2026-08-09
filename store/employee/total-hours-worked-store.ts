import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { TimeCard, TimeCardListMeta, TimeCardQueryFilters } from "@/types/timecards.type";


type TotalHoursWorkedStore = {
  // States
  timeCards: TimeCard[] | null;
  meta: TimeCardListMeta | null;
  isLoading: boolean;

  // Actions
  fetchTimeCards: (filters?: TimeCardQueryFilters & { search?: string; page?: number; limit?: number }) => Promise<void>;
};

export const useTotalHoursWorkedStore = create<TotalHoursWorkedStore>((set) => ({
  // Initial States
  timeCards: null,
  meta: null,
  isLoading: false,

  // Fetch Paginated / Filtered Time Cards & Metrics using your defined types
  fetchTimeCards: async (filters) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      
      if (filters?.shopId) {
        params.append("shopId", filters.shopId);
      }
      if (filters?.employeeId) {
        params.append("employeeId", filters.employeeId);
      }
      if (filters?.status) {
        params.append("status", filters.status);
      }
      if (filters?.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters?.period) {
        params.append("period", filters.period);
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }
      if (filters?.page) {
        params.append("page", String(filters.page));
      }
      if (filters?.limit) {
        params.append("limit", String(filters.limit));
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/business/employees/total-hours?${queryString}` : `/business/employees/total-hours`;

      const response = await apiClient.get(endpoint);
      const timeCardsData = response.data.data as TimeCard[];
      const metaData = response.data.meta as TimeCardListMeta;
   
      set({
        timeCards: timeCardsData,
        meta: metaData,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching total hours worked:", error);
      set({ timeCards: null, meta: null, isLoading: false });
    }
  },
}));