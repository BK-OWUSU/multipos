import {create} from "zustand"
import apiClient from "@/lib/api-client"
import { AxiosError } from "axios";
import { AppResponse } from "@/types/auth/auth";
import { Brand } from "@/types/schema/inventory";
import { BrandFormValues } from "@/types/schema/inventory.schema";
import { toast } from "sonner";

type BrandStore = {
    brands: Brand[] | null;
    loading: boolean;
    fetchBrands: () => Promise<void>;
    createBrand: (data: BrandFormValues) => Promise<AppResponse>;
    updateBrand: (id: string, data: BrandFormValues) => Promise<AppResponse>;
    deleteBrand: (id: string) => Promise<void>;
}

export const useBrandStore = create<BrandStore>((set, get)=>({
    brands: null,
    loading: false,
    fetchBrands: async() => {
        try {
            set({loading: true})
            const response = await apiClient.get("/business/brands");
            set({
                brands: response.data.brands as Brand[],
                loading: false
            });
        } catch (error) {
            console.log("Error fetching brands: ", error);
            set({brands: null, loading: false})
        }
    },

    createBrand: async (data: BrandFormValues) => {
        set({ loading: true });
        try {
            const response = await apiClient.post("/business/brands", data);
            if (response.data.success) {
                await get().fetchBrands();
                toast.success(response.data.message);
                return {
                    success: true,
                    message: response.data.message,
                    status: response.status
                } as AppResponse;
            }
            set({loading: false})
            return { success: false, message: response.data.error } as AppResponse;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || "Error creating brand";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

    updateBrand: async (id: string, data: BrandFormValues) => {
        set({ loading: true });
        try {
            const response = await apiClient.patch(`/business/brands/${id}`, data);
            if (response.data.success) {
                await get().fetchBrands();
                toast.success(response.data.message);
                return {
                    success: true,
                    message: response.data.message,
                    status: response.status
                } as AppResponse;
            }
            set({loading: false})
            return { success: false, message: response.data.error } as AppResponse;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || "Error updating brand";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

    deleteBrand: async (id: string) => {
        try {
            const response = await apiClient.delete(`/business/brands/${id}`);

            if (response.data.success) {
                set((state) => ({
                    brands: state.brands
                        ? state.brands.filter((brand) => brand.id !== id)
                        : null,
                }));
                toast.success("Brand removed successfully");
            }
        } catch (error: unknown) {
             if (error instanceof AxiosError) {
                const message = error.response?.data?.error || "Cannot delete brand with associated products";
                toast.error(message);
            }
            const message = "Cannot delete brand with associated products";
            toast.error(message);
        }
    },
}));