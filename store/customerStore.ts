import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { AxiosError } from "axios";
import { AppResponse } from "@/types/auth/auth";
import { Customer } from "@/types/auth/auth";
// Assuming you'll create a CustomerFormValues schema similar to inventory
import { toast } from "sonner";
import { CreateCustomerSchema } from "@/types/schema/auth.schema";

type CustomerStore = {
  customers: Customer[] | null;
  loading: boolean;
  fetchCustomers: () => Promise<void>;
  createCustomer: (data: CreateCustomerSchema) => Promise<AppResponse>;
  updateCustomer: (id: string, data: CreateCustomerSchema) => Promise<AppResponse>;
  // Using soft delete as per your database schema requirements
  softDeleteCustomer: (id: string) => Promise<void>;
};

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: null,
  loading: false,

  fetchCustomers: async () => {
    try {
      set({ loading: true });
      const response = await apiClient.get("/business/customers");
      const customersData = response.data.customers as Customer[];
      set({
        customers: customersData,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching customers: ", error);
      set({ customers: null, loading: false });
    }
  },

  createCustomer: async (data: CreateCustomerSchema) => {
    set({ loading: true });
    try {
      const response = await apiClient.post("/business/customers", data);
      if (response.data.success) {
        await get().fetchCustomers();
        toast.success(response.data.message);
        return {
          success: true,
          message: response.data.message,
          status: response.status,
        } as AppResponse;
      }
      return { success: false, message: response.data.error } as AppResponse;
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.error : "Error creating customer";
      toast.error(message);
      return { success: false, error: message } as AppResponse;
    } finally {
      set({ loading: false });
    }
  },

  updateCustomer: async (id: string, data: CreateCustomerSchema) => {
    set({ loading: true });
    try {
      const response = await apiClient.patch(`/business/customers/${id}`, data);
      if (response.data.success) {
        await get().fetchCustomers();
        toast.success(response.data.message);
        return {
          success: true,
          message: response.data.message,
          status: response.status,
        } as AppResponse;
      }
      return { success: false, message: response.data.error } as AppResponse;
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.error : "Error updating customer";
      toast.error(message);
      return { success: false, error: message } as AppResponse;
    } finally {
      set({ loading: false });
    }
  },

  softDeleteCustomer: async (id: string) => {
    // This calls your backend patch route that sets isDeleted: true
    const deletePromise = apiClient.patch(`/business/customers/${id}/archive`);

    toast.promise(deletePromise, {
      loading: "Archiving customer...",
      success: (response) => {
        if (response.data.success) {
          // Optimistically remove from state so the table updates immediately
          set((state) => ({
            customers: state.customers
              ? state.customers.filter((cust) => cust.id !== id)
              : null,
          }));
          return "Customer moved to archives";
        } else {
          throw new Error(response.data.error || "Failed to archive");
        }
      },
      error: (error: unknown) => {
        if (error instanceof AxiosError) {
          return error.response?.data?.error || "Cannot archive customer at this time";
        }
        return "Failed to remove customer";
      },
    });
  },
}));