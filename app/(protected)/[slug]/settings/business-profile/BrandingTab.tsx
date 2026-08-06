// components/business-profile/BrandingTab.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { Button } from "@/components/ui/button";
import { FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";

export function BrandingTab() {
  const { register, watch, setValue } = useFormContext();

  const primaryColor = watch("branding.primaryColor") || "#2563eb";
  const secondaryColor = watch("branding.secondaryColor") || "#4f46e5";

  return (
    <CardContent className="p-6 space-y-6">
      {/* Color Palette Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700">Primary Brand Color</Label>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg border border-slate-200 shrink-0 relative overflow-hidden cursor-pointer shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <input 
                type="color" 
                {...register("branding.primaryColor")} 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <FormInput 
              name="branding.primaryColor" 
              placeholder="#2563eb"
              className="h-10 text-sm border-slate-200 font-mono uppercase"
            />
          </div>
          <p className="text-[10px] text-slate-400">Used for primary action buttons, headers, and client invoices.</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700">Secondary Accent Color</Label>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg border border-slate-200 shrink-0 relative overflow-hidden cursor-pointer shadow-sm"
              style={{ backgroundColor: secondaryColor }}
            >
              <input 
                type="color" 
                {...register("branding.secondaryColor")} 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <FormInput 
              name="branding.secondaryColor" 
              placeholder="#4f46e5"
              className="h-10 text-sm border-slate-200 font-mono uppercase"
            />
          </div>
          <p className="text-[10px] text-slate-400">Used for secondary highlights, links, badges, and tag systems.</p>
        </div>
      </div>

      {/* Transactional Customizations */}
      <div className="space-y-1.5 pt-2">
        <FormInput 
          name="branding.receiptHeader" 
          label="Receipt / Invoice Header Text" 
          textArea 
          placeholder="Thank you for shopping with us! Returns are accepted within 7 days with a valid receipt." 
          className="min-h-20 text-sm border-slate-200 resize-none focus-visible:ring-blue-500/20" 
        />
        <span className="text-[10px] text-slate-400 font-medium">Customizable note or return policy printed directly onto customer receipts.</span>
      </div>

      {/* Social Media Handlers */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-[#0f172a]">Social Media Integration</h4>
          <p className="text-[11px] text-slate-400">Link social handles to dynamically inject into footer invoice layouts.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <FaTwitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <FormInput name="branding.twitter" placeholder="bismark_v" className="h-10 pl-9 text-sm border-slate-200" />
          </div>
          <div className="relative">
            <FaInstagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <FormInput name="branding.instagram" placeholder="bismarkventures" className="h-10 pl-9 text-sm border-slate-200" />
          </div>
          <div className="relative">
            <FaFacebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <FormInput name="branding.facebook" placeholder="bismarkventures" className="h-10 pl-9 text-sm border-slate-200" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" className="h-9 px-4 text-xs font-medium border-slate-200 text-slate-700 bg-white hover:bg-slate-50">Cancel</Button>
        <Button type="submit" className="bg-[#2563eb] hover:bg-blue-700 text-white font-medium text-xs h-9 px-4 rounded-md shadow-sm">Save Branding</Button>
      </div>
    </CardContent>
  );
}