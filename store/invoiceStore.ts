import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { CompleteInvoicePayload, PaymentType } from "@/types/invoice.type"; // Adjust path to your types bundle

interface InvoicePagination {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}


export interface InvoiceSummaryRow {
  customId: string;
  paymentType: PaymentType;
  totalAmount: number;
  byEmployee: string;
  toCustomer: string;       // Fallback to "Walk-in Customer" if null
  date: string;             // YYYY-MM-DD format
  time: string;             // HH:MM AM/PM format
}

// ── STORE STATE & ACTIONS TYPE DEFINITIONS ──
type InvoiceStore = {
  // Core States
  invoices: CompleteInvoicePayload[] | null;
  pagination: InvoicePagination | null;
  isLoading: boolean;

  // Active Global Filter Presets matching your API parameters
  filters: {
    period: string;
    startDate?: string;
    endDate?: string;
    status?: "COMPLETED" | "PENDING" | "CANCELLED" | "REFUNDED" | "";
    paymentType?: "CASH" | "MOMO" | "CARD" | "SPLIT" | "";
    shopId: string; // Defaults to "all", "current-shop", or specific GUIDs
    page: number;
    limit: number;
  };

  // State Modifiers
  fetchInvoices: (explicitFilters?: Record<string, unknown>) => Promise<void>;
  updateFiltersLocal: (newFilters: Partial<InvoiceStore["filters"]>) => void;
  resetFiltersLocal: () => void;

  getInvoiceSummaryList: () => InvoiceSummaryRow[];
};

const DEFAULT_FILTERS = {
  period: "current-week",
  startDate: "",
  endDate: "",
  status: "" as const,
  paymentType: "" as const,
  shopId: "all",
  page: 1,
  limit: 10,
};

// ── ZUSTAND IMPLEMENTATION CORE ──
export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: null,
  pagination: null,
  isLoading: false,
  filters: { ...DEFAULT_FILTERS },

  /**
   * Adjusts local state parameters before triggering a background dataset fetch query
   */
  updateFiltersLocal: (newFilters) => {
    set((state) => {
      const updatedFilters = { ...state.filters, ...newFilters };
      
      // Reset page back to 1 if any core filter parameters are changing to avoid empty views
      if (!newFilters.page && (newFilters.status !== undefined || newFilters.paymentType !== undefined || newFilters.period !== undefined || newFilters.shopId !== undefined)) {
        updatedFilters.page = 1;
      }
      
      return { filters: updatedFilters };
    });
  },

  /**
   * Drops filter states back to the original systemic defaults cleanly
   */
  resetFiltersLocal: () => set({ filters: { ...DEFAULT_FILTERS } }),

  /**
   * Pulls structural invoice documents tracking back matching dynamic data parameters
   */
  fetchInvoices: async (explicitFilters) => {
    try {
      set({ isLoading: true });
      
      // Select explicit functional overrides if passed or fall back to store memory
      const currentFilters = explicitFilters || get().filters;
      
      // Clean blank parameter strings completely so backend defaults execute fallback processing safely
      const cleanParams: Record<string, unknown> = {};
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          cleanParams[key] = value;
        }
      });

      const response = await apiClient.get("/business/invoice", {
        params: cleanParams,
      });

      if (response.data.success) {

        set({
          invoices: response.data.invoices as CompleteInvoicePayload[],
          pagination: response.data.pagination,
          isLoading: false,
        });
      } else {
        set({ invoices: null, pagination: null, isLoading: false });
      }
    } catch (error) {
      console.error("Operational crash pulling structural invoice audit logs:", error);
      set({ invoices: null, pagination: null, isLoading: false });
    }
  },


  /**
   * ── COMPUTED SELECTOR ──
   * Transforms raw payload models down into the exact flat list view required by your UI table
   */
  getInvoiceSummaryList: () => {
    const invoices = get().invoices;
    if (!invoices) return [];

    return invoices.map((inv) => {
      const sale = inv.sale;
      const rawDate = new Date(inv.issuedAt);

      // Prevent scientific notation/floating point errors shown in your card snapshot
      const numericAmount = Number(sale.totalAmount);
      

      // Isolate Date string (e.g., "2026-06-20")
      const dateString = rawDate.toISOString().split("T")[0];

      // Isolate Time string formatted cleanly (e.g., "3:20 PM")
      const timeString = rawDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return {
        customId: inv.customId,
        paymentType: sale.paymentType,
        totalAmount: numericAmount,
        byEmployee: sale.employee?.name || "System Process",
        toCustomer: sale.customer?.name || "Walk-in Customer",
        date: dateString,
        time: timeString,
      };
    });
  },

}));