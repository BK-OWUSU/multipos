import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { BusinessProfileResponse } from "@/types/types/business-profile.type";

type BusinessProfileStore = {
  profile: BusinessProfileResponse | null;
  loading: boolean;
  fetchBusinessProfile: () => Promise<void>;
  updateBusinessProfileState: (updatedData: Partial<BusinessProfileResponse>) => void;
};

export const useBusinessProfileStore = create<BusinessProfileStore>((set) => ({
  profile: null,
  loading: false,

  fetchBusinessProfile: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get("/business/business-profile");
      const profile = response.data.data as BusinessProfileResponse || null;
      set({ 
        profile: profile, 
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching business profile:", error);
      set({ profile: null, loading: false });
    }
  },

  updateBusinessProfileState: (updatedData) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updatedData } : null,
    }));
  },
}));