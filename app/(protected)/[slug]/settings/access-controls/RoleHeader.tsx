import { GenericModal } from "@/components/reusables/GenericModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RolesWithRelations } from "@/types/auth/role.type";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";
import CreateRolesForm from "./CreateRolesForm";
import { useRoleStore } from "@/store/rolesStore";

interface RoleHeaderProps {
  role: RolesWithRelations  & { id?: string};
  onBack: () => void;
}

export default function RoleHeader({ role, onBack }: RoleHeaderProps) {
    const { fetchRoles } = useRoleStore();
     const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
     
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile View Toggle Left Arrow Arrow Button */}
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 shrink-0 lg:hidden border-blue-800 text-blue-900" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-700/10 border border-blue-700/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-blue-900" />
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-blue-950 truncate tracking-tight">{role?.name}</h2>
            <Badge 
              variant="outline" 
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 border-transparent ${
                role?.type === "SYSTEM" 
                  ? "bg-emerald-50 text-emerald-700"
                  : role?.type === "CUSTOM" 
                    ? "bg-amber-50 text-amber-700" 
                    : "bg-blue-50 text-blue-900"
              }`}
            >
              {role?.type}
            </Badge>
          </div>
          <p className="text-xs text-blue-800/70 truncate mt-0.5 font-medium">
            {role?.description || `${role?.name.toLowerCase()} configuration settings context`}
          </p>
        </div>
      </div>
      
      {/* Context Actions */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <GenericModal
              header="Create New Role"
              width="sm:max-w-max"
              description="Define a new role with specific permissions and access controls"
              isOpen={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
              triggerBtn={
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold border-blue-800 text-blue-900 hover:bg-blue-50 px-3">
                Edit
                </Button>
              }
            >
              <CreateRolesForm
                initialData={role ? {
                  ...role,
                  expiresAt: role.expiresAt ? new Date(role.expiresAt).toISOString() : null
                } : undefined}
                onSuccess={() => {
                  fetchRoles();
                  setIsCreateModalOpen(false);
                }} 
              />
            </GenericModal>
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-rose-700 border-rose-200 hover:text-rose-800 hover:bg-rose-50 px-3">
              Delete
            </Button>
      </div>
    </div>
  );
}