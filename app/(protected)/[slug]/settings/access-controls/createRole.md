"use client";

import React, { useState, useMemo, useEffect } from "react"; // Added useEffect
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Sliders, 
  ShieldCheck,  
  Search, 
  Save, 
  Loader2,
  Database
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// import { CreateRoleFormValues, createRoleSchema } from "@/types/schema/auth.schema";
import { cn } from "@/lib/utils";
import { getAccessOnly, getAllAccessKeys, getAllPermissions } from "@/lib/accessAndPermissionsDef";
import { AccessControlNode } from "@/types/types";
import { CATEGORY_UI_MAP } from "./RolePermissions";
import { RoleType } from "@/generated/prisma/browser";
import { CreateRoleFormValues, CreateRoleSchema } from "@/types/role.schema";


interface RoleFormProps {
  initialData?: CreateRoleFormValues & { id?: string, type?: RoleType };
  onSuccess?: () => void;
}

export default function RoleForm({ initialData, onSuccess }: RoleFormProps) {
  const isEditing = !!initialData?.id;

  console.log(initialData)

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [permissionSearchQuery, setPermissionSearchQuery] = useState<string>("");

  const visualNavModules = useMemo(() => getAccessOnly(), []);
  const allFlatSystemKeys = useMemo(() => getAllAccessKeys(), []);
  const allSystemPermissions = useMemo(() => getAllPermissions, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(CreateRoleSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      permissions: [],
      access: [],
      expiresAt: null,
    },
  });

  // FIX: Expand wildcard "*" into full system keys if present
  useEffect(() => {
    if (initialData) {
      const rawPermissions = initialData.permissions || [];
      const rawAccess = initialData.access || [];

      const resolvedPermissions = rawPermissions.includes("*") 
        ? allSystemPermissions 
        : rawPermissions;

      const resolvedAccess = rawAccess.includes("*") 
        ? allFlatSystemKeys 
        : rawAccess;

      reset({
        name: initialData.name || "",
        description: initialData.description || "",
        permissions: resolvedPermissions,
        access: resolvedAccess,
        expiresAt: initialData.expiresAt || null,
      });
    }
  }, [initialData, reset, allSystemPermissions, allFlatSystemKeys]);

  const selectedPermissions = useWatch({ control, name: "permissions" }) || [];
  const selectedAccess = useWatch({ control, name: "access" }) || [];

  // ── ACCESS MATRIX LOGIC (Mirrors AccessControl) ───────────────────
  const toggleModuleAccess = (keys: string[]): void => {
    const allSelected = keys.every((k: string) => selectedAccess.includes(k));
    let nextAccessRoutes: string[];

    if (allSelected) {
      nextAccessRoutes = selectedAccess.filter((k: string) => !keys.includes(k));
      
      visualNavModules.forEach((module) => {
        const getDeepKeys = (node: AccessControlNode): string[] => {
          return [node.accessKey, ...(node.items?.flatMap(getDeepKeys) || [])];
        };

        if (module.items && module.items.length > 0) {
          const childrenKeys = module.items.flatMap(getDeepKeys);
          const hasAnyRemainingChildren = childrenKeys.some((childKey) => 
            nextAccessRoutes.includes(childKey) && !keys.includes(childKey)
          );
          
          if (!hasAnyRemainingChildren) {
            nextAccessRoutes = nextAccessRoutes.filter((k) => k !== module.accessKey);
          }

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
      nextAccessRoutes = [...new Set([...selectedAccess, ...keys])];
      
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
    setValue("access", nextAccessRoutes, { shouldValidate: true, shouldDirty: true });
  };

  const selectAllAccess = () => setValue("access", allFlatSystemKeys, { shouldValidate: true });
  const clearAllAccess = () => setValue("access", [], { shouldValidate: true });

  // ── PERMISSIONS MATRIX LOGIC (Mirrors RolePermissions) ────────────
  const togglePermission = (id: string): void => {
    const updated = selectedPermissions.includes(id)
      ? selectedPermissions.filter((p) => p !== id)
      : [...selectedPermissions, id];
    setValue("permissions", updated, { shouldValidate: true });
  };

  const selectAllPermissions = () => setValue("permissions", allSystemPermissions, { shouldValidate: true });
  const clearAllPermissions = () => setValue("permissions", [], { shouldValidate: true });

  // Group permissions dynamically matching RolePermission architecture
  const dynamicPermissionGroups = useMemo(() => {
    const groupMap: Record<string, { id: string; name: string; description: string }[]> = {};

    allSystemPermissions.forEach((rawKey) => {
      const [prefix, action] = rawKey.split(":");
      if (!prefix || !action) return;

      const formatAction = action.charAt(0).toUpperCase() + action.slice(1);
      const humanName = `Can ${formatAction} ${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Data`;
      const humanDescription = `Grants precise authorization to execute structural ${action} operations inside the ${prefix} module layers.`;

      if (!groupMap[prefix]) groupMap[prefix] = [];
      groupMap[prefix].push({ id: rawKey, name: humanName, description: humanDescription });
    });

    return Object.keys(groupMap).map((prefix) => {
      const uiConfig = CATEGORY_UI_MAP[prefix] || { label: `${prefix.toUpperCase()} Operations`, icon: Database };
      return {
        category: uiConfig.label,
        icon: uiConfig.icon,
        items: groupMap[prefix],
      };
    });
  }, [allSystemPermissions]);

const onSubmit = async (data: CreateRoleFormValues) => {
  try {
    // Automatically determine the role type based on the expiration date
    const determinedType = data.expiresAt && data.expiresAt.trim() !== ""
      ? RoleType.TEMPORARY
      : (data.type || RoleType.CUSTOM);

    const payload = {
      ...data,
      type: determinedType,
    };

    if (isEditing) {
      console.log(`Updating Role (ID: ${initialData?.id}):`, payload);
      // TODO: Call your update server action here using payload
      toast.success("Role updated successfully.");
    } else {
      console.log("Creating New Role:", payload);
      // TODO: Call your create server action here using payload
      toast.success("Role created successfully.");
      reset();
    }
    
    setStep(1);
    if (onSuccess) onSuccess();
  } catch (error) {
    toast.error(isEditing ? "Failed to update role." : "Failed to create role.");
  }
};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      
      {/* ── STEP PROGRESS HEADER ── */}
      <div className="flex items-center flex-col gap-4 border-b border-blue-800 pb-5">
        <div>
          <h3 className="text-base font-bold text-blue-950 tracking-tight flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-700" /> 
            {isEditing ? `Edit Role: ${initialData?.name}` : "Create New Role"}
          </h3>
          <p className="text-xs text-blue-800 mt-3">
            Step {step} of 3: {step === 1 ? "General Information" : step === 2 ? "Module Access Matrices" : "Granular System Capabilities"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            type="button"
            size="sm"
            variant={step === 1 ? "default" : "outline"} 
            className={cn("h-8 text-xs font-semibold", step === 1 ? "bg-blue-900 text-white" : "border-blue-800 text-blue-900")}
            onClick={() => setStep(1)}
          >
            1. General
          </Button>
          <div className="h-px w-6 bg-blue-800/20" />
          <Button 
            type="button"
            size="sm"
            variant={step === 2 ? "default" : "outline"} 
            className={cn("h-8 text-xs font-semibold", step === 2 ? "bg-blue-900 text-white" : "border-blue-800 text-blue-900")}
            onClick={() => setStep(2)}
          >
            2. Access
          </Button>
          <div className="h-px w-6 bg-blue-800/20" />
          <Button 
            type="button"
            size="sm"
            variant={step === 3 ? "default" : "outline"} 
            className={cn("h-8 text-xs font-semibold", step === 3 ? "bg-blue-900 text-white" : "border-blue-800 text-blue-900")}
            onClick={() => setStep(3)}
          >
            3. Permissions
          </Button>
        </div>
      </div>

      {/* ── STEP 1: GENERAL INFO ── */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-blue-950">Role Name</Label>
              <Input {...register("name")} placeholder="e.g., Senior Branch Manager, Cashier" className="border-blue-700/20 text-xs" />
              {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-blue-950">Description</Label>
              <Textarea {...register("description")} placeholder="Describe role responsibilities and boundary parameters..." className="border-blue-700/20 text-xs" />
            </div>

            {initialData?.type !== "SYSTEM" && initialData?.type !== "CUSTOM" && ( 
            <div className="space-y-2">
              <Label className="text-xs font-bold text-blue-950">Expiration Date</Label>
              <Controller
                control={control}
                name="expiresAt"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-xs font-normal border-blue-700/20 text-blue-950">
                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-700" />
                        {field.value ? format(new Date(field.value), "PPP") : "No expiration boundary"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar 
                        mode="single" 
                        selected={field.value ? new Date(field.value) : undefined}  
                        onSelect={field.onChange} 
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-blue-700/20">
            <Button type="button" className="h-9 text-xs font-semibold bg-blue-900 hover:bg-blue-950 text-white px-5" onClick={() => setStep(2)}>
              Next: Access Matrices <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: MODULE ACCESS MATRICES ── */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5 p-3.5 bg-blue-50 border border-blue-700/20 rounded-xl flex-1 mr-4">
              <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0" />
              <div className="text-xs font-bold text-blue-950">
                {selectedAccess.length} structural checkpoints selected out of {allFlatSystemKeys.length} available.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-blue-800 text-blue-900" onClick={selectAllAccess}>Select All</Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs text-rose-700 border-rose-200 hover:bg-rose-50" onClick={clearAllAccess}>Clear All</Button>
            </div>
          </div>

          <Accordion type="multiple" className="space-y-3">
            {visualNavModules.map((module) => {
              const Icon = module.icon || Sliders;
              const getDeepKeys = (node: AccessControlNode): string[] => [node.accessKey, ...(node.items?.flatMap(getDeepKeys) || [])];
              const subKeys = module.items?.flatMap(getDeepKeys) || [module.accessKey];
              const allSelected = subKeys.every((k) => selectedAccess.includes(k));
              const someSelected = subKeys.some((k) => selectedAccess.includes(k)) && !allSelected;

              return (
                <AccordionItem key={module.accessKey} value={module.accessKey} className="border border-blue-700/20 rounded-xl bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-4 bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                    <AccordionTrigger className="hover:no-underline py-3.5 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-blue-700/10 flex items-center justify-center shadow-xs">
                          <Icon className="h-4 w-4 text-blue-900" />
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-blue-950 text-sm">{module.title}</span>
                          <p className="text-[10px] font-mono text-blue-800">{module.accessKey}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <div className="flex items-center gap-2 pl-3 py-4 border-l border-blue-700/20">
                      <Checkbox 
                        checked={allSelected}
                        onCheckedChange={() => toggleModuleAccess(subKeys)}
                        className={cn("h-4 w-4 rounded-md border-blue-800 data-[state=checked]:bg-blue-900", someSelected && "data-[state=checked]:bg-blue-700")}
                      />
                      <span className="text-xs font-semibold text-blue-800 hidden sm:inline">Select Section</span>
                    </div>
                  </div>

                  {module.items && module.items.length > 0 && (
                    <AccordionContent className="p-4 bg-white border-t border-blue-700/10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {module.items.flatMap((i) => (i.items ? [i, ...i.items] : [i])).map((item) => {
                          const SubIcon = item.icon || Sliders;
                          const isSelected = selectedAccess.includes(item.accessKey);

                          return (
                            <div 
                              key={item.accessKey} 
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border transition-all select-none",
                                isSelected ? "border-blue-700 bg-blue-50/30" : "border-slate-100 bg-slate-50/40 hover:bg-slate-50/80"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Checkbox 
                                  checked={isSelected} 
                                  onCheckedChange={() => toggleModuleAccess([item.accessKey])}
                                  className="h-4 w-4 rounded border-blue-800 data-[state=checked]:bg-blue-900" 
                                />
                                <SubIcon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-blue-900" : "text-blue-800/60")} />
                                <span className="text-xs font-bold text-blue-900 truncate">{item.title}</span>
                              </div>
                              <Badge variant="outline" className="text-[9px] font-mono bg-white text-blue-800 border-blue-700/20">{item.accessKey}</Badge>
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

          <div className="flex items-center justify-between pt-4 border-t border-blue-700/20">
            <Button type="button" variant="outline" className="h-9 text-xs border-blue-800 text-blue-900" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            <Button type="button" className="h-9 text-xs font-semibold bg-blue-900 hover:bg-blue-950 text-white px-5" onClick={() => setStep(3)}>
              Next: Granular Permissions <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: GRANULAR PERMISSIONS ── */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-700/20 pb-4">
            <div className="text-xs font-semibold text-blue-800">
              Selected <span className="text-blue-950 font-bold">{selectedPermissions.length} operational rules</span> for this role runtime.
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-blue-800 text-blue-900" onClick={selectAllPermissions}>Select All</Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs text-rose-700 border-rose-200 hover:bg-rose-50" onClick={clearAllPermissions}>Clear All</Button>
              
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-blue-800/50" />
                <input
                  type="text"
                  placeholder="Filter capability keys..."
                  value={permissionSearchQuery}
                  onChange={(e) => setPermissionSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-blue-700/20 rounded-lg text-blue-950 placeholder-blue-800/40 focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 pr-2">
            {dynamicPermissionGroups.map((group) => {
              const GroupIcon = group.icon;
              const filteredItems = group.items.filter(
                (item) => item.id.toLowerCase().includes(permissionSearchQuery.toLowerCase()) || 
                          item.name.toLowerCase().includes(permissionSearchQuery.toLowerCase())
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
                          className={cn(
                            "flex items-start gap-3.5 p-3.5 rounded-xl border transition-all select-none",
                            isChecked ? "border-blue-700 bg-blue-50/30 shadow-xs" : "border-slate-100 bg-slate-50/40 hover:bg-slate-50/80"
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(permission.id)}
                            className="h-4 w-4 mt-0.5 rounded border-blue-800 data-[state=checked]:bg-blue-900"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-blue-950">{permission.name}</span>
                              <Badge variant="outline" className="text-[9px] font-mono bg-white text-blue-800 border-blue-700/10">{permission.id}</Badge>
                            </div>
                            <p className="text-[11px] text-blue-800/80 mt-1 leading-normal font-medium">{permission.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-blue-700/20">
            <Button type="button" variant="outline" className="h-9 text-xs border-blue-800 text-blue-900" onClick={() => setStep(2)}>
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back to Access
            </Button>
            <Button type="submit" className="h-9 text-xs font-semibold bg-blue-900 hover:bg-blue-950 text-white px-6 shadow-xs" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> {isEditing ? "Saving Changes..." : "Creating Role..."}</>
              ) : (
                <><Save className="mr-1.5 h-3.5 w-3.5" /> {isEditing ? "Save Changes" : "Save New Role"}</>
              )}
            </Button>
          </div>
        </div>
      )}

    </form>
  );
}