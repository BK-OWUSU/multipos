import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
// import { Role } from "@/types/auth/auth"; // Using your existing response type
import { AxiosError } from "axios";
import { RolesWithRelations } from "@/types/auth/role.type";



type RoleStore = {
  roles: RolesWithRelations[];
  loading: boolean;
  fetchRoles: () => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  updateRoleState: (roleId: string, updatedFields: Partial<RolesWithRelations>) => void; // Add this
};

export const useRoleStore = create<RoleStore>((set, get) => ({
  roles: [],
  loading: false,

  fetchRoles: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get("/business/roles");
      const rolesData = response.data.data as RolesWithRelations[];
      set({ 
        roles: rolesData, 
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      set({ roles: [], loading: false });
    }
  },

  deleteRole: async (roleId: string) => {
    // 1. Guard check: Don't allow deleting system roles
    const roleToDelete = get().roles.find(r => r.id === roleId);
    if (roleToDelete?.isSystem) {
      toast.error("System roles cannot be deleted");
      return;
    }

    try {
      const response = await apiClient.delete(`/business/roles/${roleId}`);
      if (response.data.success) {
        set((state) => ({
          roles: state.roles.filter((r) => r.id !== roleId),
        }));
        toast.success("Role removed successfully");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
          const message = error.response?.data?.error || "Cannot delete role while users are assigned to it";
          toast.error(message);  
        }else {
          const message = "Cannot delete role while users are assigned to it";
          toast.error(message);
      }  
    }
  },

  updateRoleState: (roleId, updatedFields) => {
    set((state) => ({
      roles: state.roles.map((role) => 
        role.id === roleId 
          ? { ...role, ...updatedFields }
          : role
      )
    }));
  }

}));