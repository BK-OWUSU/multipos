// @/components/loyalty/reward-form.tsx
"use client";

import { useForm, useWatch, Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { Prisma } from "@/generated/prisma/client"
import { RewardFormValues, rewardSchema, RewardType } from "@/types/schema/loyalty.schema";
import { createLoyaltyRewardAction, updateLoyaltyRewardAction } from "@/lib/actions/business/loyalty-actions";
import { startTransition } from "react";
import { toast } from "sonner";


interface RewardFormProps {
  onSuccess: () => void;
  initialData?: {
    id: string;
    title: string;
    description?: string | null;
    pointsRequired: number;
    rewardType: RewardType;
    rewardValue?: number | string | Prisma.Decimal; 
    productVariant?: { sku: string } | null;
  };
}

export function RewardForm({ onSuccess, initialData }: RewardFormProps) {
  const isEditMode = !!initialData;

  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      pointsRequired: initialData?.pointsRequired ?? 100,
      rewardType: initialData?.rewardType ?? "PRODUCT",
      rewardValue: initialData?.rewardValue ? Number(initialData.rewardValue) : 0,
      applicableSku: initialData?.productVariant?.sku ?? "",
    },
  });

  const onSubmit = (data: RewardFormValues) => {
    const dbPayload = {
      title: data.title,
      description: data.description || undefined,
      pointsRequired: data.pointsRequired,
      rewardType: data.rewardType,
      rewardValue: ["FIXED_AMOUNT", "PERCENTAGE"].includes(data.rewardType) ? data.rewardValue : undefined,
      applicableSku: data.rewardType === "PRODUCT" ? data.applicableSku : undefined,
    };

    if (isEditMode) {
          startTransition(() => {      
            toast.promise(
                // 1. Wrap the action in an async function to explicitly handle the return object
                async () => {
                  const res = await updateLoyaltyRewardAction(initialData.id, dbPayload);
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
        startTransition(() => {      
            toast.promise(
                // 1. Wrap the action in an async function to explicitly handle the return object
                async () => {
                  const res = await createLoyaltyRewardAction(dbPayload);
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
      <form onSubmit={form.handleSubmit(onSubmit)} id="reward-catalog-form" className="space-y-5 px-2 overflow-y-auto pr-1 pb-6">
        
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-blue-950">Reward Name</label>
          <Input 
            placeholder="e.g. Free Pack of Biscuits, GH₵20 Gift Voucher" 
            className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
            {...form.register("title")}
          />
          {form.formState.errors.title && <p className="text-xs font-medium text-red-600">{form.formState.errors.title.message}</p>}
        </div>

        {/* Cost in Points */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-blue-950">Points Required to Claim</label>
          <Input 
            type="number"
            className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
            {...form.register("pointsRequired")}
          />
          {form.formState.errors.pointsRequired && <p className="text-xs font-medium text-red-600">{form.formState.errors.pointsRequired.message}</p>}
        </div>

        {/* Reward Type Selection Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-blue-950">Reward Action Type</label>
          <Select 
            defaultValue={form.getValues("rewardType")}
            onValueChange={(val: RewardType) => {
              form.setValue("rewardType", val);
              form.setValue("rewardValue", 0);
              form.setValue("applicableSku", "");
            }}
          >
            <SelectTrigger className="w-full border-slate-200 h-10 font-medium text-sm focus:ring-blue-800">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRODUCT">📦 Free Product/Item</SelectItem>
              <SelectItem value="FIXED_AMOUNT">💵 Fixed Cash Discount</SelectItem>
              <SelectItem value="PERCENTAGE">🏷️ Percentage Discount</SelectItem>
              <SelectItem value="FREE_SERVICE">🚚 Free Service / Perk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Isolated Contextual Fields Section */}
        <DynamicContextFields control={form.control} register={form.register} errors={form.formState.errors} />

        {/* Description Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-blue-950">Description</label>
          <Textarea 
            placeholder="Add internal details or customer notes regarding eligibility..." 
            className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium min-h-20 resize-none"
            {...form.register("description")}
          />
        </div>
      </form>

      <div className="pt-4 border-t border-slate-100 mt-auto bg-white">
        <Button 
          type="submit" 
          form="reward-catalog-form" 
          className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold py-5 rounded-xl transition-all shadow-sm"
        >
          {isEditMode ? "Update Catalog Changes" : "Create Reward Catalog Item"}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PERFORMANCE OPTIMIZED SUB-COMPONENT (STRICT TYPING)
// ─────────────────────────────────────────────────────────────
interface DynamicFieldsProps {
  control: Control<RewardFormValues>;
  register: UseFormRegister<RewardFormValues>;
  errors: FieldErrors<RewardFormValues>;
}

function DynamicContextFields({ control, register, errors }: DynamicFieldsProps) {
  const rewardType = useWatch({
    control,
    name: "rewardType",
  });

  if (rewardType === "PRODUCT") {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-blue-950">Associated Item Barcode / SKU</label>
        <Input 
          placeholder="Scan or type item SKU code" 
          className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
          {...register("applicableSku")}
        />
        <p className="text-[10px] text-slate-400">Allows your POS terminal to auto-apply a 100% discount when this item is scanned alongside a reward claim.</p>
        {errors.applicableSku && <p className="text-xs font-medium text-red-600">{errors.applicableSku.message}</p>}
      </div>
    );
  }

  if (rewardType === "FIXED_AMOUNT" || rewardType === "PERCENTAGE") {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-blue-950">
          Value Amount {rewardType === "FIXED_AMOUNT" ? <CurrencyFormatter.Currency /> : "(%)"}
        </label>
        <div className="relative">
          {rewardType === "FIXED_AMOUNT" && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              <CurrencyFormatter.Currency />
            </span>
          )}
          <Input 
            type="number" 
            step="0.01"
            className={`text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10 ${rewardType === "FIXED_AMOUNT" ? "pl-12" : "pr-10"}`}
            {...register("rewardValue")}
          />
          {rewardType === "PERCENTAGE" && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
          )}
        </div>
        {errors.rewardValue && <p className="text-xs font-medium text-red-600">{errors.rewardValue.message}</p>}
      </div>
    );
  }

  return null;
}