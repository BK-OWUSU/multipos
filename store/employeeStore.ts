import {create} from "zustand"
import apiClient from "@/lib/api-client"
import { AxiosError } from "axios";
import { AppResponse, Employee } from "@/types/auth/auth";
import { CreateEmployeeSchema } from "@/types/schema/auth.schema";
import { toast } from "sonner";

type AuthStore = {
    employees: Employee[] | null;
    loading: boolean;
    fetchEmployees: () => Promise<void>;
    addEmployee: (data: CreateEmployeeSchema) => Promise<AppResponse>;
    toggleEmployeeStatus: (employeeId: string, currentStatus: boolean) => Promise<void>;
    deleteEmployee: (employeeId: string) => Promise<void>;
}

export const useEmployeeStore = create<AuthStore>((set, get)=>({
    employees: null,
    loading: false,
    fetchEmployees: async() => {
        try {
            set({loading: true})
            const response = await apiClient.get("/business/employees");
            set({
                employees: response.data.employees as Employee[],
                loading: false
            });
        } catch (error) {
            console.log("Error fetching user: ", error);
            set({employees: null, loading: false})
        }
    },

    addEmployee: async (data: CreateEmployeeSchema) => {
        set({ loading: true });
        try {
            const response = await apiClient.post("/business/employees", data);
            if (response.data.success) {
                await get().fetchEmployees(); 
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
                const errorMessage = error.response?.data?.error || "Error creating employee";
                toast.error(errorMessage);
                return { success: false, error: errorMessage } as AppResponse;
            }
            return { success: false, error: "Internal Server Error" } as AppResponse;
        } finally {
            set({ loading: false });
        }
    },

   toggleEmployeeStatus: async (employeeId: string, currentStatus: boolean) => {
    // 1. Create the promise
        const actionPromise = apiClient.patch(`/business/employees/${employeeId}`, {
            isActive: !currentStatus
        });

        // 2. Wrap it in toast.promise
        toast.promise(actionPromise, {
            loading: `Updating employee status...`,
            success: (response) => {
            // Logic inside here runs only if the request succeeds
            if (response.data.success) {
                set((state) => ({
                employees: state.employees
                    ? state.employees.map((emp) =>
                        emp.id === employeeId ? { ...emp, isActive: !currentStatus } : emp
                    )
                    : null,
                }));
                return `Employee ${!currentStatus ? "activated" : "deactivated"} successfully!`;
            } else {
                // If the server returns 200 but success is false
                throw new Error(response.data.error || "Failed to update");
            }
            },
            error: (err) => {
            // Handles network errors or the thrown error above
            console.error(err);
            return err.message || "Failed to update employee status";
            },
        });
    },
    deleteEmployee: async (employeeId: string) => {
        // 1. Prepare the promise
        const deletePromise = apiClient.delete(`/business/employees/${employeeId}`);

        // 2. Wrap in toast.promise
        toast.promise(deletePromise, {
            loading: "Removing employee from system...",
            success: (response) => {
                if (response.data.success) {
                    // Update local state by filtering out the deleted employee
                    set((state) => ({
                        employees: state.employees 
                            ? state.employees.filter((emp) => emp.id !== employeeId)
                            : null,
                    }));
                    return "Employee removed successfully";
                } else {
                    // Handle cases where the server returns 200 but success: false
                    throw new Error(response.data.error || "Failed to remove employee");
                }
            },
            error: (error: unknown) => {
                // Check for the AxiosError or specific business logic errors
                // e.g., "Cannot delete employee with transaction history"
                if (error instanceof AxiosError) {
                    const serverError = error.response?.data?.error;
                    return serverError || "Cannot delete employee with transaction history";
                } 
                return "Failed to remove employee"
            },
        });
    },
}));