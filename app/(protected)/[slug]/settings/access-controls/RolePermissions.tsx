"use client";

import { useState, useMemo, useTransition } from "react";
import { RolesWithRelations } from "@/types/auth/role.type";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, 
  Search, 
  Users, 
  Settings, 
  Database, 
  FileText, 
  Save, 
  RefreshCw,
  LayoutDashboard,
  Store,
  PackageSearch,
  Receipt,
  Trophy
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { getAllPermissions } from "@/lib/accessAndPermissionsDef";
import { toast } from "sonner";
import { updateRoleAction } from "@/lib/actions/business/role-actions";
import { UpdateRoleInput } from "@/types/role.schema";
import { permissionRouteCleaner } from "@/lib/accessPermissionSecurity";

interface RolePermissionsProps {
  role: RolesWithRelations | null;
  initialPermissions?: string[]; 
  onSuccess?: () => void;
}

interface ParsedPermissionItem {
  id: string;          
  name: string;        
  description: string; 
}

interface DynamicPermissionGroup {
  category: string;
  icon: LucideIcon;
  items: ParsedPermissionItem[];
}

const CATEGORY_UI_MAP: Record<string, { label: string; icon: LucideIcon }> = {
  dashboard: { label: "Control Dashboard", icon: LayoutDashboard },
  business: { label: "Business Management", icon: Settings },
  shop: { label: "Branch & Shop Operations", icon: Store },
  product: { label: "Product Catalog System", icon: PackageSearch },
  sale: { label: "Point of Sale & Orders", icon: Users },
  invoice: { label: "Billing & Invoices", icon: Receipt },
  report: { label: "Analytics & Ledgers", icon: FileText },
  loyalty: { label: "Loyalty Program Settings", icon: Trophy },
};

export default function RolePermissions({ role, initialPermissions = [], onSuccess }: RolePermissionsProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialPermissions);
const [isPending, startTransition] = useTransition();

  const dynamicPermissionGroups = useMemo<DynamicPermissionGroup[]>(() => {
    const systemSourceKeys: string[] = getAllPermissions;
    const groupMap: Record<string, ParsedPermissionItem[]> = {};

    systemSourceKeys.forEach((rawKey) => {
      const [prefix, action] = rawKey.split(":");
      if (!prefix || !action) return;

      const formatAction = action.charAt(0).toUpperCase() + action.slice(1);
      const humanName = `Can ${formatAction} ${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Data`;
      const humanDescription = `Grants precise authorization to execute structural ${action} operations inside the ${prefix} module layers.`;

      if (!groupMap[prefix]) {
        groupMap[prefix] = [];
      }

      groupMap[prefix].push({
        id: rawKey,
        name: humanName,
        description: humanDescription,
      });
    });

    return Object.keys(groupMap).map((prefix): DynamicPermissionGroup => {
      const uiConfig = CATEGORY_UI_MAP[prefix] || { label: `${prefix.toUpperCase()} Operations`, icon: Database };
      return {
        category: uiConfig.label,
        icon: uiConfig.icon,
        items: groupMap[prefix],
      };
    });
  }, []);

  const togglePermission = (id: string): void => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // ── NEW MATRIX CONTROLS ───────────────────────────────────────────
  const selectAllPermissions = (): void => {
    setSelectedPermissions(getAllPermissions);
  };

  const clearAllPermissions = (): void => {
    setSelectedPermissions([]);
  };


  const handleSavePermissions = async (): Promise<void> => {
  if (!role) return;
  const cleanedRoutes = permissionRouteCleaner(selectedPermissions);
  
  // Clean payload matching your UpdateRoleInput type definitions
  const payload: UpdateRoleInput = {
    name: role.name,
    permissions: cleanedRoutes,
  };

  startTransition(() => {      
    toast.promise(
      async () => {
        // Execute your Server Action
        const res = await updateRoleAction(role.id, payload);
        if (!res.success) {
          throw new Error(res.error || "Error updating role");
        }
        return res;
      }, 
      {
        loading: "Updating role permissions...", // Corrected placeholder text
        success: (res) => {
          // Trigger the parent component callback to refresh the state or re-fetch
          if (onSuccess) onSuccess();
          return res.message || "Role permissions updated successfully";
        },
        error: (err) => {
          return err.message || "Error updating role permissions";
        }
      }
    );
  });
};

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* ── HEADER FILTERS & CONTROL TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800 pb-5">
        <div>
          <h3 className="text-base font-bold text-blue-950 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-blue-700" /> Granular System Capabilities
          </h3>
          <p className="text-xs text-blue-800 mt-1 max-w-xl">
            Assign precise operational parameters attached to actions or execution layers across this workspace context boundary.
          </p>
        </div>

        {/* Dynamic Global Matrix Utility Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold border-blue-800 text-blue-900 hover:bg-blue-50"
            onClick={selectAllPermissions}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold text-rose-700 border-rose-200 hover:text-rose-800 hover:bg-rose-50"
            onClick={clearAllPermissions}
          >
            Clear All
          </Button>
          
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-blue-800/50" />
            <input
              type="text"
              placeholder="Search capability keys..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-blue-700/20 rounded-lg text-blue-950 placeholder-blue-800/40 focus:outline-hidden focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>
        </div>
      </div>

      {/* ── SYSTEM GRID PERMISSIONS MATRIX ── */}
      <div className="space-y-6">
        {dynamicPermissionGroups.map((group) => {
          const GroupIcon = group.icon;
          
          const filteredItems = group.items.filter(
            item => item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={group.category} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <GroupIcon className="h-4 w-4 text-blue-900/60" />
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">{group.category}</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredItems.map((permission) => {
                  const isChecked = selectedPermissions.includes(permission.id);

                  return (
                    <div
                      key={permission.id}
                      onClick={() => togglePermission(permission.id)}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                        isChecked
                          ? "border-blue-700 bg-blue-50/30 shadow-xs"
                          : "border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 hover:border-blue-700/20"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => togglePermission(permission.id)}
                        className="h-4 w-4 mt-0.5 rounded border-blue-800 data-[state=checked]:bg-blue-900 data-[state=checked]:border-blue-900 shrink-0"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                      />
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-blue-950 tracking-tight">{permission.name}</span>
                          <Badge variant="outline" className="text-[9px] font-mono font-medium bg-white text-blue-800 border-blue-700/10">
                            {permission.id}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-blue-800/80 mt-1 leading-normal font-medium">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTER ACTIONS BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-blue-700/20">
        <div className="text-xs font-semibold text-blue-800 self-start sm:self-auto">
          Currently tracking <span className="text-blue-950 font-bold">{selectedPermissions.length} rules selected</span> for this runtime matrix.
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="h-9 font-semibold text-xs text-blue-900 border-blue-800 px-4"
            onClick={() => setSelectedPermissions(initialPermissions)}
            disabled={isPending}
          >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Revert Changes
          </Button>
          <Button 
            type="button" 
            size="sm" 
            className="h-9 font-semibold text-xs px-5 shadow-xs bg-blue-900 hover:bg-blue-950 text-white"
            onClick={handleSavePermissions}
            disabled={isPending || !role}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> {isPending ? "Applying..." : "Apply Permissions"}
          </Button>
        </div>
      </div>

    </div>
  );
}