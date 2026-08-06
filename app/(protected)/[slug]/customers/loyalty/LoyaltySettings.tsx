"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpCircle, Store, Check } from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { ConfigFormValues, configSchema } from "@/types/schema/loyalty.schema";
import { toast } from "sonner";
import { saveLoyaltyConfigurationAction } from "@/lib/actions/business/loyalty-actions";
import { useTransition } from "react";

interface ShopItem {
  id: string;
  name: string;
}

interface LoyaltySettingsFormProps {
  onSuccess: () => void;
  shops: ShopItem[]; 
  initialData?: {
    isEnabled: boolean;
    applyToAllShops: boolean;
    targetShops?: { shopId: string }[]; 
    amountRequiredPerPoint: number;
    pointValue: number;
    minimumPointsToRedeem: number;
    maxRedeemPercentage: number;
    pointsExpiryMonths: number;
    earnOnPromotions: boolean;
  };
}

export function LoyaltySettingsForm({ onSuccess, shops, initialData }: LoyaltySettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const initialShopIds = initialData?.targetShops?.map((ts) => ts.shopId) ?? [];

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      isEnabled: initialData?.isEnabled ?? true,
      applyToAllShops: initialData?.applyToAllShops ?? true,
      shopIds: initialShopIds,
      amountRequiredPerPoint: initialData ? Number(initialData.amountRequiredPerPoint) : 10.00,
      pointValue: initialData ? Number(initialData.pointValue) : 0.10,
      minimumPointsToRedeem: initialData?.minimumPointsToRedeem ?? 50,
      maxRedeemPercentage: initialData?.maxRedeemPercentage ?? 30, 
      pointsExpiryMonths: initialData?.pointsExpiryMonths ?? 12,  
      earnOnPromotions: initialData ? !initialData.earnOnPromotions : true, 
    },
  });

  const { control, setValue } = form;

  const watchIsEnabled = useWatch({ control, name: "isEnabled" });
  const watchApplyToAllShops = useWatch({ control, name: "applyToAllShops" });
  const watchShopIds = useWatch({ control, name: "shopIds" }) || [];
  const watchEarnOnPromotions = useWatch({ control, name: "earnOnPromotions" });

  const toggleShop = (shopId: string) => {
    const current = [...watchShopIds];
    if (current.includes(shopId)) {
      setValue("shopIds", current.filter((id) => id !== shopId), { shouldValidate: true });
    } else {
      setValue("shopIds", [...current, shopId], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: ConfigFormValues) => {
    const dbPayload = {
      isEnabled: data.isEnabled,
      applyToAllShops: data.applyToAllShops,
      shopIds: data.applyToAllShops ? [] : data.shopIds, 
      amountRequiredPerPoint: data.amountRequiredPerPoint,
      pointValue: data.pointValue,
      minimumPointsToRedeem: data.minimumPointsToRedeem,
      maxRedeemPercentage: data.maxRedeemPercentage,
      pointsExpiryMonths: data.pointsExpiryMonths,
      earnOnPromotions: !data.earnOnPromotions, 
    };

    startTransition(() => {      
      toast.promise(
        async () => {
          const res = await saveLoyaltyConfigurationAction(dbPayload);
          if (!res.success) {
            throw new Error(res.error || "Failed to save loyalty configuration");
          }
          return res;
        }, 
        {
          loading: "Saving loyalty configuration...",
          success: (res) => {
            onSuccess();
            return res.message || "Saved loyalty configuration successfully";
          },
          error: (err) => err.message || "Error saving configuration"
        }
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100%-4rem)] justify-between">
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        id="loyalty-config-form" 
        className="space-y-6 overflow-y-auto px-2 pb-6"
      >
        {/* Toggle Program Status */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-blue-950">Enable Loyalty Program</label>
            <p className="text-[11px] text-slate-500 font-medium">Activate points accumulation at checkout.</p>
          </div>
          <Switch 
            checked={watchIsEnabled} 
            onCheckedChange={(val) => setValue("isEnabled", val, { shouldValidate: true })}
            className="data-[state=checked]:bg-blue-800"
          />
        </div>

        {/* --- SECTION 1: CORE RATIOS --- */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Core Ratios</h4>

          {/* Earning Matrix Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-blue-950">Earning Multiplier</label>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                <CurrencyFormatter.Currency/>
              </span>
              <Input 
                type="number" 
                step="0.01"
                className="pl-12 text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
                {...form.register("amountRequiredPerPoint")}
              />
            </div>
            {form.formState.errors.amountRequiredPerPoint && (
              <p className="text-xs font-medium text-red-600">{form.formState.errors.amountRequiredPerPoint.message}</p>
            )}
          </div>

          {/* Point Redemption Valuation Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-blue-950">Point Cash Valuation</label>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                <CurrencyFormatter.Currency/>
              </span>
              <Input 
                type="number" 
                step="0.01"
                className="pl-12 text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
                {...form.register("pointValue")}
              />
            </div>
            {form.formState.errors.pointValue && (
              <p className="text-xs font-medium text-red-600">{form.formState.errors.pointValue.message}</p>
            )}
          </div>
        </div>

        {/* --- SECTION 2: MERCHANT PROTECTION GUARDRAILS --- */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Protection Guardrails</h4>

          {/* Minimum Threshold Guardrail Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-950 block">Minimum Redemption Threshold</label>
            <Input 
              type="number" 
              className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
              {...form.register("minimumPointsToRedeem")}
            />
            {form.formState.errors.minimumPointsToRedeem && (
              <p className="text-xs font-medium text-red-600">{form.formState.errors.minimumPointsToRedeem.message}</p>
            )}
          </div>

          {/* Max Invoice Percentage Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-blue-950">Max Invoice Discount Limit (%)</label>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="relative">
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              <Input 
                type="number" 
                className="pr-10 text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
                {...form.register("maxRedeemPercentage")}
              />
            </div>
            {form.formState.errors.maxRedeemPercentage && (
              <p className="text-xs font-medium text-red-600">{form.formState.errors.maxRedeemPercentage.message}</p>
            )}
          </div>

          {/* Points Expiry Policy Timeline */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-950 block">Points Expiry Window (Months)</label>
            <Input 
              type="number"
              step="1"
              min="0" 
              className="text-sm border-slate-200 focus-visible:ring-blue-800 focus-visible:border-blue-800 font-medium h-10"
              {...form.register("pointsExpiryMonths")}
            />
            {form.formState.errors.pointsExpiryMonths && (
              <p className="text-xs font-medium text-red-600">{form.formState.errors.pointsExpiryMonths.message}</p>
            )}
          </div>

          {/* Promotion Exclusion Flag Checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <Checkbox 
              id="excludePromotions" 
              checked={watchEarnOnPromotions}
              onCheckedChange={(val) => setValue("earnOnPromotions", !!val, { shouldValidate: true })}
              className="mt-0.5 border-slate-300 data-[state=checked]:bg-blue-800 data-[state=checked]:border-blue-800"
            />
            <div className="space-y-0.5">
              <label htmlFor="excludePromotions" className="text-xs font-bold text-blue-950 cursor-pointer select-none">
                Exclude Promotional Items
              </label>
              <p className="text-[10px] text-slate-500 font-medium">Do not award points on items with active campaigns or retail discounts.</p>
            </div>
          </div>
        </div>

        {/* --- DYNAMIC TARGET SHOP ASSIGNMENTS --- */}
        {watchIsEnabled && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Shop Application scope</h4>
            
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-blue-950">Apply to all Shops</label>
                <p className="text-[10px] text-slate-400 font-medium">Automatically includes current and future business branches.</p>
              </div>
              <Switch 
                checked={watchApplyToAllShops} 
                onCheckedChange={(val) => {
                  setValue("applyToAllShops", val, { shouldValidate: true });
                  if (val) setValue("shopIds", []); 
                }}
                className="data-[state=checked]:bg-blue-800"
              />
            </div>

            {/* Granular Scope Selection Block */}
            {!watchApplyToAllShops && (
              <div className="space-y-2 pl-1 animation-fadeIn">
                <label className="text-xs font-bold text-slate-600 block">Select Target Branches</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {shops.map((shop) => {
                    const isChecked = watchShopIds.includes(shop.id);
                    return (
                      <div
                        key={shop.id}
                        onClick={() => toggleShop(shop.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left w-full transition-all cursor-pointer select-none ${
                          isChecked 
                            ? "border-blue-200 bg-blue-50/20" 
                            : "border-slate-100 hover:border-slate-200 bg-slate-50/30"
                        }`}
                      >
                        {/* Pure CSS Visual Custom Indicator box to bypass nested Radix elements */}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked 
                            ? "bg-blue-800 border-blue-800 text-white" 
                            : "border-slate-300 bg-white"
                        }`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-3" />}
                        </div>

                        <div className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-semibold text-blue-950">{shop.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {form.formState.errors.shopIds && (
                  <p className="text-xs font-medium text-red-600 mt-1">{form.formState.errors.shopIds.message}</p>
                )}
              </div>
            )}
          </div>
        )}  
      </form>

      <div className="pt-4 border-t border-slate-100 mt-auto bg-white px-2">
        <Button 
          type="submit" 
          form="loyalty-config-form"
          disabled={isPending}
          className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold py-5 rounded-xl transition-all shadow-sm"
        >
          {isPending ? "Saving..." : "Save Configuration Changes"}
        </Button>
      </div>
    </div>
  );
}