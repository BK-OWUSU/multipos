import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { AxiosError } from "axios";
import { AppResponse } from "@/types/auth/auth";
import { Category } from "@/types/schema/inventory";
import { CategoryFormValues } from "@/types/schema/inventory.schema";
import { toast } from "sonner";

type CategoryStore = {
  categories: Category[] | null;
  loading: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (data: CategoryFormValues) => Promise<AppResponse>;
  updateCategory: (id: string, data: CategoryFormValues) => Promise<AppResponse>;
  toggleCategoryStatus: (id: string, currentStatus: boolean) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
};

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: null,
  loading: false,

  fetchCategories: async () => {
    try {
      set({ loading: true });
      const response = await apiClient.get("/business/categories");
      set({
        categories: response.data.categories as Category[],
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching categories: ", error);
      set({ categories: null, loading: false });
    }
  },

  createCategory: async (data: CategoryFormValues) => {
    set({ loading: true });
    try {
      const response = await apiClient.post("/business/categories", data);
      if (response.data.success) {
        await get().fetchCategories();
        toast.success(response.data.message);
        return {
          success: true,
          message: response.data.message,
          status: response.status,
        } as AppResponse;
      }
      return { success: false, message: response.data.error } as AppResponse;
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.error : "Error creating category";
      toast.error(message);
      return { success: false, error: message } as AppResponse;
    } finally {
      set({ loading: false });
    }
  },

  updateCategory: async (id: string, data: CategoryFormValues) => {
    set({ loading: true });
    try {
      const response = await apiClient.patch(`/business/categories/${id}`, data);
      if (response.data.success) {
        await get().fetchCategories();
        toast.success(response.data.message);
        return {
          success: true,
          message: response.data.message,
          status: response.status,
        } as AppResponse;
      }
      return { success: false, message: response.data.error } as AppResponse;
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.error : "Error updating category";
      toast.error(message);
      return { success: false, error: message } as AppResponse;
    } finally {
      set({ loading: false });
    }
  },

  toggleCategoryStatus: async (id: string, currentStatus: boolean) => {
    const actionPromise = apiClient.patch(`/business/categories/${id}`, {
      isActive: !currentStatus,
    });

    toast.promise(actionPromise, {
      loading: "Updating category status...",
      success: (response) => {
        if (response.data.success) {
          set((state) => ({
            categories: state.categories
              ? state.categories.map((cat) =>
                  cat.id === id ? { ...cat, isActive: !currentStatus } : cat
                )
              : null,
          }));
          return `Category ${!currentStatus ? "activated" : "deactivated"} successfully!`;
        } else {
          throw new Error(response.data.error || "Failed to update");
        }
      },
      error: (err) => err.message || "Failed to update category status",
    });
  },

  deleteCategory: async (id: string) => {
    const deletePromise = apiClient.delete(`/business/categories/${id}`);

    toast.promise(deletePromise, {
      loading: "Removing category...",
      success: (response) => {
        if (response.data.success) {
          set((state) => ({
            categories: state.categories
              ? state.categories.filter((cat) => cat.id !== id)
              : null,
          }));
          return "Category removed successfully";
        } else {
          throw new Error(response.data.error || "Failed to remove category");
        }
      },
      error: (error: unknown) => {
        if (error instanceof AxiosError) {
          return error.response?.data?.error || "Cannot delete category with associated products";
        }
        return "Failed to remove category";
      },
    });
  },
}));