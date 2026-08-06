"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  CalendarIcon, Badge, ChevronRight, 
  ChevronLeft, ShieldCheck 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { CreateRoleFormValues, createRoleSchema } from "@/types/schema/auth.schema";
import { cn } from "@/lib/utils";
import { getAccessOnly } from "@/lib/accessAndPermissionsDef";

const AVAILABLE_PERMISSIONS = [
  { id: "create", label: "Create", description: "Add new records" },
  { id: "read", label: "Read", description: "View details" },
  { id: "update", label: "Update", description: "Modify existing data" },
  { id: "delete", label: "Delete", description: "Remove records" },
];

export default function CreateRoleForm({ onSuccess }: { onSuccess?: () => void }) {
  const navData = useMemo(()=> getAccessOnly(), []);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
      access: [],
      expiresAt: null,
    },
  });

  // useWatch isolates re-renders to these specific values
  const selectedPermissions = useWatch({ control, name: "permissions" }) || [];
  const selectedAccess = useWatch({ control, name: "access" }) || [];

  const togglePermission = (id: string) => {
    const updated = selectedPermissions.includes(id)
      ? selectedPermissions.filter((p) => p !== id)
      : [...selectedPermissions, id];
    setValue("permissions", updated, { shouldValidate: true });
  };

  const toggleAccess = (key: string) => {
    const updated = selectedAccess.includes(key)
      ? selectedAccess.filter((a) => a !== key)
      : [...selectedAccess, key];
    setValue("access", updated, { shouldValidate: true });
  };

  const toggleModuleAccess = (moduleKeys: string[]) => {
    const allSelected = moduleKeys.every((k) => selectedAccess.includes(k));
    const updated = allSelected
      ? selectedAccess.filter((a) => !moduleKeys.includes(a))
      : Array.from(new Set([...selectedAccess, ...moduleKeys]));
    setValue("access", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateRoleFormValues) => {
    try {
      console.log("Submitting to Database:", data);
      toast.success("Role created successfully.");
      reset();
      setStep(1);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to save role.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant={step === 1 ? "default" : "outline"}>1. General</Button>
          <div className="h-[1px] w-8 bg-slate-200" />
          <Button variant={step === 2 ? "default" : "outline"}>2. Permissions</Button>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input {...register("name")} placeholder="Admin, Editor, etc." />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register("description")} placeholder="Describe role responsibilities..." />
            </div>

            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Controller
                control={control}
                name="expiresAt"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : "No expiration"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar 
                        mode="single" 
                        selected={field.value || undefined} 
                        onSelect={field.onChange} 
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Action Permissions</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <div 
                  key={perm.id} 
                  onClick={() => togglePermission(perm.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                    selectedPermissions.includes(perm.id) ? "border-primary bg-primary/5" : "border-slate-200"
                  )}
                >
                  <Checkbox checked={selectedPermissions.includes(perm.id)} />
                  <span className="text-sm font-medium">{perm.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Button type="button" className="w-full" onClick={() => setStep(2)}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-300">
          <Accordion type="multiple" className="space-y-2">
            {navData.map((module) => {
              const subKeys = module.items?.map((i) => i.accessKey) || [module.accessKey];
              const allSelected = subKeys.every((k) => selectedAccess.includes(k));

              return (
                <AccordionItem key={module.accessKey} value={module.accessKey} className="border rounded-lg px-4 bg-white">
                  <div className="flex items-center justify-between w-full">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <module.icon className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold">{module.title}</span>
                      </div>
                    </AccordionTrigger>
                    
                    <div 
                      className="flex items-center gap-2 mr-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents accordion from toggling
                        toggleModuleAccess(subKeys);
                      }}
                    >
                      <Checkbox checked={allSelected} />
                      <span className="text-[10px] font-bold uppercase text-slate-400">All</span>
                    </div>
                  </div>

                  <AccordionContent className="grid grid-cols-2 gap-2 pt-2 pb-4 border-t">
                    {module.items?.map((item) => (
                      <div 
                        key={item.accessKey} 
                        onClick={() => toggleAccess(item.accessKey)}
                        className={cn(
                          "flex items-center gap-2 p-2 border rounded-md cursor-pointer",
                          selectedAccess.includes(item.accessKey) ? "border-primary bg-primary/5" : "border-slate-100"
                        )}
                      >
                        <Checkbox checked={selectedAccess.includes(item.accessKey)} />
                        <span className="text-xs">{item.title}</span>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Role"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}