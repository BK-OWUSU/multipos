// components/business-profile/PreferenceTab.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function PreferenceTab() {
  const { register, watch, setValue } = useFormContext();
  
  const isInventoryShared = watch("preferences.multiStoreInventory") ?? false;

  return (
    <CardContent className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Tax Configuration */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700">Tax Configuration Model *</Label>
          <select 
            {...register("preferences.taxConfig")}
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="NO_TAX">No Tax Applied</option>
            <option value="TAX_INCLUSIVE">Tax Inclusive (Prices include taxes)</option>
            <option value="TAX_EXCLUSIVE">Tax Exclusive (Taxes added at checkout)</option>
          </select>
          <p className="text-[10px] text-slate-400">Determines how retail registers evaluate system checkout values.</p>
        </div>

        {/* Default Customer Segment */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700">Default Customer Segment *</Label>
          <select 
            {...register("preferences.defaultSegment")}
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="WALK_IN">Walk-in Customer</option>
            <option value="RETAIL">Standard Retail Buyer</option>
            <option value="WHOLESALE">Wholesale Merchant Account</option>
          </select>
          <p className="text-[10px] text-slate-400">Base configuration applied automatically to unknown/new checkouts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        {/* Low Stock Alert Value */}
        <div className="space-y-1">
          <FormInput 
            name="preferences.lowStockThreshold" 
            label="Low Stock Alert Threshold *" 
            type="number"
            placeholder="10" 
            className="h-10 text-sm border-slate-200 focus-visible:ring-blue-500/20" 
          />
          <span className="text-[10px] text-slate-400 font-medium">Triggers automated system notification alerts when item stock drops beneath this quantity.</span>
        </div>

        {/* Multi-Store Inventory Sharing */}
        <div className="flex items-start justify-between p-4 bg-slate-50/60 border border-slate-100 rounded-xl mt-5">
          <div className="space-y-0.5 max-w-[80%]">
            <Label className="text-xs font-semibold text-slate-700">Multi-Store Inventory Sharing</Label>
            <p className="text-[10px] text-slate-400 leading-normal">Allows child branches and storage locations to query and share live inventory counts.</p>
          </div>
          <Switch 
            checked={isInventoryShared}
            onCheckedChange={(checked) => setValue("preferences.multiStoreInventory", checked, { shouldValidate: true })}
            className="data-[state=checked]:bg-[#2563eb]"
          />
        </div>
      </div>

      {/* Action Footer Context */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" className="h-9 px-4 text-xs font-medium border-slate-200 text-slate-700 bg-white hover:bg-slate-50">Cancel</Button>
        <Button type="submit" className="bg-[#2563eb] hover:bg-blue-700 text-white font-medium text-xs h-9 px-4 rounded-md shadow-sm">Save Preferences</Button>
      </div>
    </CardContent>
  );
}