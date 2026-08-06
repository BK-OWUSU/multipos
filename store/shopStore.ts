import { create } from "zustand";
import apiClient from "@/lib/api-client";

// Assuming you have or will add a Shop type to your types directory
import { Shop } from "@/types/schema/shop.schema"; 

type ShopStore = {
  shops: Shop[];
  loading: boolean;
  fetchShops: () => Promise<void>;
};

export const useShopStore = create<ShopStore>((set) => ({
  shops: [],
  loading: false,

  fetchShops: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get("/business/shops");
      const shops = response.data.data as Shop[] || [];
      set({ 
        shops: shops, 
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching stores:", error);
      set({ shops: [], loading: false });
    }
  },
}));