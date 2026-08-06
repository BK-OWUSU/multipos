"use client";

import { useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Save, RefreshCw, Sliders, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { accessRouteCleaner } from "@/lib/accessPermissionSecurity";
import { toast } from "sonner";
import { updateRoleAction } from "@/lib/actions/business/role-actions";
import { UpdateRoleInput } from "@/types/role.schema";
import { RolesWithRelations } from "@/types/auth/role.type";
import { getAccessOnly, getAllAccessKeys } from "@/lib/accessAndPermissionsDef";
import { AccessControlNode } from "@/types/types";

interface RoleAccessProps {
  role: RolesWithRelations;
  initialAccessRoutes?: string[]; // Safely pass down current accessRoutes fetched from API
  onSuccess: () => void; // Callback to parent component to refresh or update state after successful save
}

interface RoleAccessFormValues {
  accessRoutes: string[];
}

export default function RoleAccess({ role, initialAccessRoutes = [], onSuccess }: RoleAccessProps) {
  const [isPending, startTransition] = useTransition();


  // ── 1. INITIALIZE LOCAL FORM CONFIGURATION ───────────────────────────
  const { setValue, control } = useForm<RoleAccessFormValues>({
    defaultValues: {
      accessRoutes: initialAccessRoutes,
    },
  });

  // ── 2. WATCH FORM STATE USING CONTROL PROP (NO ANY TYPE) ─────────────
  const accessRoutes = useWatch<RoleAccessFormValues, "accessRoutes">({
    control,
    name: "accessRoutes",
    defaultValue: [],
  }) || [];

  const visualNavModules = getAccessOnly(); 
  const allFlatSystemKeys = getAllAccessKeys();

  // Sync accessRoutes if async payload from parent updates later
useEffect(() => {
  setValue("accessRoutes", initialAccessRoutes, {
    shouldDirty: false,
    shouldValidate: true
  });
  
// Serialize the array using join() so React can easily compare value changes
}, [initialAccessRoutes, setValue]); 

// ── 3. ACCESS CHECKPOINT MATRIX HANDLERS ─────────────────────────────
const toggleModule = (keys: string[]): void => {
  const allSelected = keys.every((k: string) => accessRoutes.includes(k));
  
  let nextAccessRoutes: string[];

  if (allSelected) {
    // DESELECTION MODE: Strip the target keys
    nextAccessRoutes = accessRoutes.filter((k: string) => !keys.includes(k));
    
    // CASCADE REMOVAL: Automatically drop parent keys if they lose all active children
    visualNavModules.forEach((module) => {
      const getDeepKeys = (node: AccessControlNode): string[] => {
        return [node.accessKey, ...(node.items?.flatMap(getDeepKeys) || [])];
      };

      // 1. Process top-level module sections
      if (module.items && module.items.length > 0) {
        const childrenKeys = module.items.flatMap(getDeepKeys);
        const hasAnyRemainingChildren = childrenKeys.some((childKey) => 
          nextAccessRoutes.includes(childKey) && !keys.includes(childKey)
        );
        
        if (!hasAnyRemainingChildren) {
          nextAccessRoutes = nextAccessRoutes.filter((k) => k !== module.accessKey);
        }

        // 2. Process deep 2nd/3rd-tier intermediate parent nodes (e.g., 'manage-shops', 'shop-inventory')
        const checkNestedParents = (nodes: AccessControlNode[]): void => {
          nodes.forEach((node) => {
            if (node.items && node.items.length > 0) {
              const deeperKeys = node.items.flatMap(getDeepKeys);
              const hasActiveDeeperChildren = deeperKeys.some((dk) => 
                nextAccessRoutes.includes(dk) && !keys.includes(dk)
              );
              
              if (!hasActiveDeeperChildren) {
                nextAccessRoutes = nextAccessRoutes.filter((k) => k !== node.accessKey);
              }
              checkNestedParents(node.items);
            }
          });
        };
        checkNestedParents(module.items);
      }
    });
  } else {
    // SELECTION MODE: Standard insertion union
    nextAccessRoutes = [...new Set([...accessRoutes, ...keys])];
    
    // AUTO-PARENT ASSIGNMENT: If child is selected, ensure parent access keys exist
    visualNavModules.forEach((module) => {
      const findAndInjectParent = (node: AccessControlNode, targetKeys: string[]): boolean => {
        if (targetKeys.includes(node.accessKey)) return true;
        if (node.items) {
          const childMatched = node.items.some((child) => findAndInjectParent(child, targetKeys));
          if (childMatched && !nextAccessRoutes.includes(node.accessKey)) {
            nextAccessRoutes.push(node.accessKey);
          }
          return childMatched;
        }
        return false;
      };

      if (module.items) {
        const moduleMatched = module.items.some((child) => findAndInjectParent(child, keys));
        if (moduleMatched && !nextAccessRoutes.includes(module.accessKey)) {
          nextAccessRoutes.push(module.accessKey);
        }
      }
    });
  }
  setValue("accessRoutes", nextAccessRoutes, { shouldValidate: true, shouldDirty: true });
};

  const selectAllModules = (): void => {
    setValue("accessRoutes", allFlatSystemKeys, { shouldValidate: true, shouldDirty: true });
  };

  const clearAll = (): void => {
    setValue("accessRoutes", [], { shouldValidate: true, shouldDirty: true });
  };

  const handleSave = async (): Promise<void> => {
  const cleanedRoutes = accessRouteCleaner(accessRoutes);
  
  const payload: UpdateRoleInput = {
    name: role.name,
    access: cleanedRoutes,
  };

  startTransition(() => {      
    toast.promise(
      async () => {
        const res = await updateRoleAction(role.id, payload);
        if (!res.success) {
          throw new Error(res.error || "Error updating role");
        }
        return res;
      }, 
      {
        loading: "Updating role access permissions...",
        success: (res) => {
          // Trigger the parent callback immediately after a successful server response
          if (onSuccess) onSuccess(); 
          return res.message || "Role updated successfully";
        },
        error: (err) => {
          return err.message || "Error updating role";
        }
      }
    );
  });
};

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* ── HEADER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800 pb-5">
        <div>
          <h3 className="text-base font-bold text-blue-950 tracking-tight flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-700" /> Module Access Matrices
          </h3>
          <p className="text-xs text-blue-800 mt-1 max-w-xl">
            Choose which components, modules, and sub-pages this role profile can actively interact with or execute.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs font-semibold border-blue-800 text-blue-900 hover:bg-blue-50" 
            onClick={selectAllModules}
          >
            Select All
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs font-semibold text-rose-700 border-rose-200 hover:text-rose-800 hover:bg-rose-50" 
            onClick={clearAll}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* ── SELECTION SCORECARD ── */}
      <div className="flex items-center gap-3.5 p-4 bg-blue-50 border border-blue-700/20 rounded-xl">
        <div className="w-9 h-9 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0 border border-blue-700/10">
          <ShieldCheck className="h-5 w-5 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-bold text-blue-950">
            {accessRoutes.length} functional checkpoints selected
          </p>
          <p className="text-[11px] text-blue-800 font-medium">
            Out of {allFlatSystemKeys.length} total structural database system privileges mapped.
          </p>
        </div>
      </div>

      {/* ── INTERACTIVE FEEDS ACCORDION ── */}
      <Accordion type="multiple" className="space-y-3">
        {visualNavModules.map((module) => {
          const Icon = module.icon || Sliders; // Fallback icon if none provided
          // Recursively extracts all sub-keys across your nested NavItem tree structures
          const getDeepKeys = (node: AccessControlNode): string[] => {
            return [node.accessKey, ...(node.items?.flatMap(getDeepKeys) || [])];
          };

          const subKeys: string[] = module.items?.flatMap(getDeepKeys) || [module.accessKey];
          const allSelected = subKeys.every((k: string) => accessRoutes.includes(k));
          const someSelected = subKeys.some((k: string) => accessRoutes.includes(k)) && !allSelected;
          const itemCount = subKeys.length; // Shows total nested features accurately

          return (
            <AccordionItem 
              key={module.accessKey} 
              value={module.accessKey} 
              className="border border-blue-700/20 rounded-xl bg-white overflow-hidden shadow-none transition-all duration-200 data-[state=open]:border-blue-700/40 data-[state=open]:shadow-xs"
            >
              <div className="flex items-center justify-between w-full px-4 bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                <AccordionTrigger className="hover:no-underline py-3.5 flex-1 select-none">
                  <div className="flex items-center gap-3 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-blue-700/10 flex items-center justify-center shadow-xs shrink-0">
                      <Icon className="h-4 w-4 text-blue-900" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-blue-950 text-sm tracking-tight">{module.title}</span>
                        {itemCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] font-bold h-4 px-1.5 bg-blue-700/10 text-blue-900 hover:bg-blue-700/10">
                            {itemCount} features
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-blue-800 font-mono tracking-tight mt-0.5 truncate">
                        {module.accessKey}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <div 
                  className="flex items-center gap-2 pl-3 py-4 border-l border-blue-700/20 h-9 select-none cursor-pointer group" 
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.stopPropagation();
                    toggleModule(subKeys);
                  }}
                >
                  <Checkbox 
                    checked={allSelected}
                    onCheckedChange={(): void => toggleModule(subKeys)}
                    className={cn(
                      "h-4 w-4 rounded-md border-blue-800 data-[state=checked]:bg-blue-900 data-[state=checked]:border-blue-900",
                      someSelected && "data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-700"
                    )}
                  />
                  <span className="text-xs font-semibold text-blue-800 group-hover:text-blue-950 transition-colors hidden sm:inline">
                    Select Section
                  </span>
                </div>
              </div>

              {module.items && module.items.length > 0 && (
              <AccordionContent className="p-4 bg-white border-t border-blue-700/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Recursively flatten items safely using the explicit type contract */}
                  {(function flatten(items: AccessControlNode[]): AccessControlNode[] {
                    return items.flatMap((i) => (i.items ? [i, ...flatten(i.items)] : [i]));
                  })(module.items).map((item) => {
                    const SubIcon = item.icon || Sliders; // Fallback helper if icons are optional
                    const isSelected = accessRoutes.includes(item.accessKey);

                    return (
                      <div 
                        key={item.accessKey} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none gap-3 active:scale-[0.99]",
                          isSelected 
                            ? 'border-blue-700 bg-blue-50/30 shadow-xs' 
                            : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 hover:border-blue-700/20'
                        )}
                        onClick={(): void => toggleModule([item.accessKey])}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={(): void => toggleModule([item.accessKey])} 
                            className="h-4 w-4 rounded border-blue-800 data-[state=checked]:bg-blue-900 data-[state=checked]:border-blue-900 shrink-0"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()} 
                          />
                          <SubIcon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-blue-900" : "text-blue-800/60")} />
                          <span className="text-xs font-bold text-blue-900 truncate">{item.title}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono tracking-tight font-medium bg-white text-blue-800 border-blue-700/20 shrink-0 select-all">
                          {item.accessKey}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            )}
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* ── ACTIONS BAR FOOTER ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-blue-700/20">
        <div className="flex items-center gap-4 text-xs font-semibold text-blue-800 self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-blue-900 bg-blue-700/10 flex items-center justify-center text-[8px] text-blue-900 font-bold">✓</div>
            <span>Has Access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-blue-700/30 bg-slate-50"></div>
            <span>No Access</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="h-9 font-semibold text-xs text-blue-900 border-blue-800 px-4" 
            onClick={clearAll}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reset Matrix
          </Button>
          <Button 
            type="button" 
            size="sm" 
            className="h-9 font-semibold text-xs px-5 shadow-xs bg-blue-900 hover:bg-blue-950 text-white" 
            onClick={handleSave} 
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}