import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { AxiosError } from "axios";
import { AppResponse } from "@/types/auth/auth";
import { Discount } from "@/types/schema/inventory";
import { CreateDiscountSchema } from "@/types/schema/inventory.schema";
import { toast } from "sonner";

type DiscountStore = {
    discounts: Discount[] | null; 
    activeDiscounts: Discount[] | null; 
    loading: boolean;
    fetchDiscounts: () => Promise<void>;
    createDiscount: (data: CreateDiscountSchema) => Promise<AppResponse>;
    updateDiscount: (id: string, data: CreateDiscountSchema) => Promise<AppResponse>;
    deleteDiscount: (id: string) => Promise<void>;
}

export const useDiscountStore = create<DiscountStore>((set, get) => ({
    discounts: null,
    activeDiscounts: null,
    loading: false,
    
    fetchDiscounts: async () => {
        try {
            set({ loading: true });
            const response = await apiClient.get("/business/discounts");
            const rawDiscounts = response.data.data as Discount[]; 
            const activeDiscountData = rawDiscounts.filter((discount)=> discount.status === "ACTIVE" && discount.isActive)
            set({
                discounts: rawDiscounts,
                activeDiscounts: activeDiscountData,
                loading: false
            });
        } catch (error) {
            console.error("Error fetching discounts: ", error);
            set({ discounts: null, loading: false });
        }
    },

    createDiscount: async (data: CreateDiscountSchema) => {
        set({ loading: true });
        try {
            const response = await apiClient.post("/business/discounts", data);
            if (response.data.success) {
                await get().fetchDiscounts();
                toast.success(response.data.message);
                return {
                    success: true,
                    message: response.data.message,
                    status: response.status
                } as AppResponse;
            }
            set({ loading: false });
            return { success: false, message: response.data.error } as AppResponse;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || "Error creating discount";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

    updateDiscount: async (id: string, data: CreateDiscountSchema) => {
        set({ loading: true });
        try {
            const response = await apiClient.patch(`/business/discounts/${id}`, data);
            if (response.data.success) {
                await get().fetchDiscounts();
                toast.success(response.data.message);
                return {
                    success: true,
                    message: response.data.message,
                    status: response.status
                } as AppResponse;
            }
            set({ loading: false });
            return { success: false, message: response.data.error } as AppResponse;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || "Error updating discount";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

    deleteDiscount: async (id: string) => {
        try {
            const response = await apiClient.delete(`/business/discounts/${id}`);

            if (response.data.success) {
                set((state) => ({
                    discounts: state.discounts
                        ? state.discounts.filter((discount) => discount.id !== id)
                        : null,
                }));
                toast.success("Discount removed successfully");
            }
        } catch (error: unknown) {
             if (error instanceof AxiosError) {
                const message = error.response?.data?.error || "Cannot delete discount with associated products or sales";
                toast.error(message);
                return;
            }
            toast.error("Cannot delete discount with associated products or sales");
        }
    },
}));