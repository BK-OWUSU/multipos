import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { FormattedInventoryRow, InventoryMeta } from "@/types/types/shopInventory.type";

type InventoryStore = {
  // States
  inventoryItems: FormattedInventoryRow[] | null;
  meta: InventoryMeta | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchInventory: (filters?: {
    shopId?: string;
    search?: string;
    categoryId?: string;
    status?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    page?: number;
    limit?: number;
  }) => Promise<void>;
};

export const useInventoryStore = create<InventoryStore>((set) => ({
  // Initial States
  inventoryItems: null,
  meta: null,
  isLoading: false,
  error: null,

  // Fetch Paginated / Filtered Inventory Matrix
  fetchInventory: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.shopId) {
        params.append("shopId", filters.shopId);
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }
      if (filters?.categoryId) {
        params.append("categoryId", filters.categoryId);
      }
      if (filters?.status) {
        params.append("status", filters.status);
      }
      if (filters?.page) {
        params.append("page", String(filters.page));
      }
      if (filters?.limit) {
        params.append("limit", String(filters.limit));
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/business/shop-inventory?${queryString}` : `/business/shop-inventory`;

      const response = await apiClient.get(endpoint);
      const itemsData = response.data.data as FormattedInventoryRow[];
      const metaData = response.data.meta?.pagination as InventoryMeta;

      set({
        inventoryItems: itemsData,
        meta: metaData || null,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Error fetching inventory items:", error);
      set({ 
        inventoryItems: null, 
        meta: null, 
        isLoading: false, 
        error: (error as Error).message || "Failed to fetch inventory records." 
      });
    }
  },
}));