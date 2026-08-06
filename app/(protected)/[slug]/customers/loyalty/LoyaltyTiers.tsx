// @/components/loyalty/tier-form.tsx
"use client";

import { useForm, useWatch, Control, UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Prisma } from "@/generated/prisma/client";
import { TierFormValues, tierSchema } from "@/types/schema/loyalty.schema";
import { startTransition } from "react";
import { createLoyaltyTierAction, updateLoyaltyTierAction } from "@/lib/actions/business/loyalty-actions";
import { toast } from "sonner";
import { ColorPicker } from "@/components/ui/color-picker";


interface TierFormProps {
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    description?: string | undefined;
    color?: string | null;
    icon?: string | null;
    minimumLifetimePoints: number;
    earnMultiplier: number | string | Prisma.Decimal;
    redemptionMultiplier: number | string | Prisma.Decimal;
    priority: number;
    isDefault: boolean;
    isActive: boolean;
  };
}

export function LoyaltyTierForm({ onSuccess, initialData }: TierFormProps) {
  const isEditMode = !!initialData;

  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      color: initialData?.color ?? "#cd7f32",
      icon: initialData?.icon ?? "star",
      minimumLifetimePoints: initialData?.minimumLifetimePoints ?? 0,
      earnMultiplier: initialData?.earnMultiplier ? Number(initialData.earnMultiplier) : 1.00,
      redemptionMultiplier: initialData?.redemptionMultiplier ? Number(initialData.redemptionMultiplier) : 1.00,
      priority: initialData?.priority ?? 1,
      isDefault: initialData?.isDefault ?? false,
      isActive: initialData?.isActive ?? true,
    },
  });

  const watchColor = useWatch({ control: form.control, name: "color" });

  const onSubmit = (data: TierFormValues) => {
    const dbPayload = {
      name: data.name,
      description: data.description || undefined,
      color: data.color,
      icon: data.icon || undefined,
      minimumLifetimePoints: data.minimumLifetimePoints,
      earnMultiplier: data.earnMultiplier,             // Maps directly to Decimal(5,2)
      redemptionMultiplier: data.redemptionMultiplier, // Maps directly to Decimal(5,2)
      priority: data.priority,
      isDefault: data.isDefault,
      isActive: data.isActive,
    };

    if (isEditMode) {
      startTransition(() => {      
                  toast.promise(
                      // 1. Wrap the action in an async function to explicitly handle the return object
                      async () => {
                        const res = await updateLoyaltyTierAction(initialData.id, dbPayload);
                          if (!res.success) {
                            throw new Error(res.error || "Error creating reward");
                          }
                          return res;
                      }, 
                      {
                        loading: "Updating loyalty reward...",
                        success: (res) => {
                          onSuccess(); // Safely close your Drawer / Dialog
                          return res.message || "Reward created successfully";
                        },
                        error: (err) => {
                          return err.message || "Error creating reward";
                        }
                      }
                    );
              })
    } else {
      console.log("Creating brand new loyalty tier:", dbPayload);
      startTransition(() => {      
          toast.promise(
              // 1. Wrap the action in an async function to explicitly handle the return object
              async () => {
                const res = await createLoyaltyTierAction(dbPayload);
                  if (!res.success) {
                    throw new Error(res.error || "Error creating reward");
                  }
                  return res;
              }, 
              {
                loading: "Saving loyalty configuration...",
                success: (res) => {
                  onSuccess(); // Safely close your Drawer / Dialog
                  return res.message || "Reward created successfully";
                },
                error: (err) => {
                  return err.message || "Error creating reward";
                }
              }
            );
      })
    }

  };

  return (
    <div className="flex flex-col h-[calc(100%-4rem)] justify-between">
      <form onSubmit={form.handleSubmit(onSubmit)} id="tier-management-form" className="space-y-5 overflow-y-auto px-2 pr-1 pb-6">
        
        {/* Tier Identity Core Group */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <label className="text-xs font-bold text-blue-950">Tier Name</label>
            <Input 
              placeholder="e.g. Bronze, Silver VIP, Gold VIP" 
              className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
              {...form.register("name")}
            />
            {form.formState.errors.name && <p className="text-xs font-medium text-red-600">{form.formState.errors.name.message}</p>}
          </div>

          {/* Color theme preset picker selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-950">Branding Theme Color</label>
            <ColorPicker
              value={watchColor}
              onChange={(val) => form.setValue("color", val, { shouldValidate: true })}
              // disabled={!watchIsEnabled || isPending}
            />
            {form.formState.errors.color && (
              <p className="text-xs font-medium text-red-600">
                {form.formState.errors.color.message}
              </p>
            )}
          </div>
          
          {/* Priority Weighting Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-950">Priority Tier Ranking Weight</label>
            <Input 
              type="number"
              className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
              {...form.register("priority")}
            />
            {form.formState.errors.priority && <p className="text-xs font-medium text-red-600">{form.formState.errors.priority.message}</p>}
          </div>
        </div>

        {/* Milestone Requirement Matrix */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-blue-950">Minimum Entry Points Needed</label>
          <Input 
            type="number"
            className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
            {...form.register("minimumLifetimePoints")}
          />
          <p className="text-[10px] text-slate-400">The total target points a consumer must earn over their lifetime cycle trajectory to hit this tier level ranking status automatic progression sequence.</p>
          {form.formState.errors.minimumLifetimePoints && <p className="text-xs font-medium text-red-600">{form.formState.errors.minimumLifetimePoints.message}</p>}
        </div>

        {/* Financial Multiplier Scale Fields */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-950">Earning Accelerator Multiplier</label>
            <Input 
              type="number"
              step="0.01"
              className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
              {...form.register("earnMultiplier")}
            />
            {form.formState.errors.earnMultiplier && <p className="text-xs font-medium text-red-600">{form.formState.errors.earnMultiplier.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-950">Burn Multiplier Rate Factor</label>
            <Input 
              type="number"
              step="0.01"
              className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
              {...form.register("redemptionMultiplier")}
            />
            {form.formState.errors.redemptionMultiplier && <p className="text-xs font-medium text-red-600">{form.formState.errors.redemptionMultiplier.message}</p>}
          </div>
        </div>

        {/* Status System Flags Component Section */}
       <DynamicTierSwitches control={form.control} setValue={form.setValue} />

        {/* Description Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-blue-950">Internal Description notes</label>
          <Textarea 
            placeholder="Write tier description parameters or special perks rules..." 
            className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium min-h-16 resize-none"
            {...form.register("description")}
          />
        </div>
      </form>

      <div className="pt-4 border-t border-slate-100 mt-auto bg-white">
        <Button 
          type="submit" 
          form="tier-management-form" 
          className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold py-5 rounded-xl transition-all shadow-sm"
        >
          {isEditMode ? "Save Tier Configuration Changes" : "Create Loyalty Tier Level"}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PERFORMANT SEGREGATED COMPONENT FOR TOGGLES
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// PERFORMANT SEGREGATED COMPONENT FOR TOGGLES (STRICTLY TYPED)
// ─────────────────────────────────────────────────────────────
interface ToggleComponentProps {
  control: Control<TierFormValues>;
  setValue: UseFormSetValue<TierFormValues>; // Fully typed by the library, no "any"
}

function DynamicTierSwitches({ control, setValue }: ToggleComponentProps) {
  const isDefaultValue = useWatch({ control, name: "isDefault" });
  const isActiveValue = useWatch({ control, name: "isActive" });

  return (
    <div className="space-y-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 mt-2">
      {/* Default Tier Level Matrix Flag Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-blue-950">Set System Entry Fallback Default</label>
          <p className="text-[10px] text-slate-500 font-medium">New accounts assign automatically to this fallback baseline structure tier state sequence path.</p>
        </div>
        <Switch 
          checked={isDefaultValue} 
          onCheckedChange={(val) => {
            setValue("isDefault", val);
            if (val) {
              setValue("minimumLifetimePoints", 0);
              setValue("isActive", true);
            }
          }}
          className="data-[state=checked]:bg-blue-800"
        />
      </div>

      {/* Active State System Layer Switch */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100/60">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-blue-950">Operational Activation Status</label>
          <p className="text-[10px] text-slate-500 font-medium">Control whether point balance checking routines evaluate progression mechanics inside checkout.</p>
        </div>
        <Switch 
          checked={isActiveValue} 
          disabled={isDefaultValue}
          onCheckedChange={(val) => setValue("isActive", val)}
          className="data-[state=checked]:bg-blue-800"
        />
      </div>
    </div>
  );
}