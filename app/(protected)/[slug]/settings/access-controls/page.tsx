"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus, ShieldCheck, ArrowLeft } from "lucide-react";
import RolesList from "./RolesList";
import RoleDetails from "./RoleDetails";
import RolePermissions from "./RolePermissions";
import RoleAccess from "./RoleAccess";
import RoleUsers from "./RoleUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericModal } from "@/components/reusables/GenericModal";
import CreateRoleForm from "./CreateRoleForm"; 
import { useRoleStore } from "@/store/rolesStore";
import { RolesWithRelations } from "@/types/auth/role.type";
import { accessRoutesFilteredValues, getRolePermissionsForForm } from "@/lib/accessPermissionSecurity";
import { Badge } from "@/components/ui/badge";
import { getAllAccessKeys, getAllPermissions } from "@/lib/accessAndPermissionsDef";

export default function AccessControlsPage() {
  const { fetchRoles, roles } = useRoleStore();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || null;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return (
    <div className="h-screen flex flex-col p-4 sm:p-6 bg-slate-50/50">
      {/* Header Container */}
      <header className="mb-6 shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-950 tracking-tight">Roles Management</h1>
            <p className="text-xs sm:text-sm text-blue-800/80 mt-1">
              Create and manage user roles, permissions and access to system modules
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
            <Button variant="outline" size="sm" className="h-9 text-xs border-blue-800 text-blue-900 bg-white hover:bg-blue-50">
              <Download className="h-3.5 w-3.5 mr-2 text-blue-700" />
              Export Roles
            </Button>
            
            <GenericModal
              header="Create New Role"
              description="Define a new role with specific permissions and access controls"
              isOpen={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
              triggerBtn={
                <Button size="sm" className="h-9 text-xs bg-blue-900 hover:bg-blue-950 text-white shadow-xs">
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Create Role
                </Button>
              }
            >
              <CreateRoleForm onSuccess={() => setIsCreateModalOpen(false)} />
            </GenericModal>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <div className="flex-1 flex gap-4 sm:gap-6 overflow-hidden min-h-0">
        
        {/* Left Panel Sidebar - Roles List */}
        <div className={`w-full lg:w-80 shrink-0 ${selectedRole ? "hidden lg:block" : "block"}`}>
          <RolesList 
            roles={roles}
            selectedRole={selectedRole}
            onRoleSelect={(role) => setSelectedRoleId(role.id)}
          />
        </div>

        {/* Right Content View Pane */}
        <div className={`flex-1 bg-white rounded-xl border border-blue-700/10 shadow-xs overflow-hidden flex flex-col min-w-0 ${!selectedRole ? "hidden lg:flex" : "flex"}`}>
          {selectedRole ? (
            <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
              
              {/* Role Context Panel Header */}
              <div className="border-b border-slate-100 px-4 sm:px-6 py-4 shrink-0 bg-slate-50/40">
                <RoleHeader role={selectedRole} onBack={() => setSelectedRoleId(null)} />
              </div>

              {/* Horizontally Scrollable Responsive Tab Lists */}
              <div className="border-b border-slate-100 px-4 sm:px-6 bg-white overflow-x-auto scrollbar-none shrink-0">
                <TabsList className="bg-transparent h-auto p-0 justify-start gap-1 flex min-w-max">
                  <TabsTrigger 
                    value="details" 
                    className="data-[state=active]:text-blue-900 data-[state=active]:border-b-blue-900 rounded-none border-b-2 border-transparent bg-transparent py-3 px-3 text-xs font-bold text-slate-400 transition-all shadow-none!"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="access"
                    className="data-[state=active]:text-blue-900 data-[state=active]:border-b-blue-900 rounded-none border-b-2 border-transparent bg-transparent py-3 px-3 text-xs font-bold text-slate-400 transition-all shadow-none!"
                  >
                    Access ({getAllAccessKeys().length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="permissions"
                    className="data-[state=active]:text-blue-900 data-[state=active]:border-b-blue-900 rounded-none border-b-2 border-transparent bg-transparent py-3 px-3 text-xs font-bold text-slate-400 transition-all shadow-none!"
                  >
                    Permissions ({getAllPermissions.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users"
                    className="data-[state=active]:text-blue-900 data-[state=active]:border-b-blue-900 rounded-none border-b-2 border-transparent bg-transparent py-3 px-3 text-xs font-bold text-slate-400 transition-all shadow-none!"
                  >
                    Users (1)
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Display Modules Container viewport */}
              <div className="flex-1 overflow-hidden relative bg-white">
                <TabsContent value="details" className="m-0 p-4 sm:p-6 h-full overflow-y-auto">
                  <RoleDetails role={selectedRole} />
                </TabsContent>

                <TabsContent value="access" className="m-0 p-0 h-full overflow-y-auto">
                  <RoleAccess
                    role={selectedRole}
                    initialAccessRoutes={accessRoutesFilteredValues(selectedRole.access) || []}
                    onSuccess = {()=> {
                      fetchRoles()
                    }}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="m-0 p-4 sm:p-6 h-full overflow-y-auto">
                  <RolePermissions 
                   role={selectedRole}
                   onSuccess={()=> {
                    fetchRoles()
                  }}
                   initialPermissions={getRolePermissionsForForm(selectedRole.permissions) || []} 
                  />
                </TabsContent>

                <TabsContent value="users" className="m-0 p-4 sm:p-6 h-full overflow-y-auto">
                  <RoleUsers roleId={selectedRole.id} />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50/20">
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-700/10 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="h-6 w-6 text-blue-700/60" />
                </div>
                <p className="text-sm sm:text-base font-bold text-blue-950">No role selected</p>
                <p className="text-xs text-blue-800/60 mt-1 max-w-xs">Select a role template profile configuration framework from the sidebar workspace tree.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RoleHeaderProps {
  role: RolesWithRelations;
  onBack: () => void;
}

function RoleHeader({ role, onBack }: RoleHeaderProps) {
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
        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold border-blue-800 text-blue-900 hover:bg-blue-50 px-3">
          Edit
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-rose-700 border-rose-200 hover:text-rose-800 hover:bg-rose-50 px-3">
          Delete
        </Button>
      </div>
    </div>
  );
}