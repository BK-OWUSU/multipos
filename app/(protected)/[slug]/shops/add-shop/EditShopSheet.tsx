"use client";

import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, MapPin, Clock, Info } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

// Shadcn UI Sheet Components
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Custom Reusable Elements & Actions
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { CustomPhoneField } from "@/components/reusables/inputs/CustomPhoneField";
import { updateShopSchema, type UpdateShopInput } from "@/types/schema/shop.schema";
import { updateShopAction } from "@/lib/actions/business/shop-actions";
import { Shop } from "@/generated/prisma/client";
import { useAuthStore } from "@/store/useAuthStore";

interface EditShopSheetProps {
  shop: Shop | null; // Pass your currently active or selected shop object
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: ()=> void;
}

export default function EditShopSheet({ shop, isOpen, onClose, onSuccess }: EditShopSheetProps) {
  const params = useParams();
  const businessSlug = params?.slug as string;
  const router = useRouter();

  const methods = useForm<UpdateShopInput>({
    resolver: zodResolver(updateShopSchema),
    defaultValues: {
      id: "",
      name: "",
      shopSlug: "",
      address: "",
      phone: "",
      city: "",
      region: "",
      gpsAddress: "",
      latitude: "6.6889",
      longitude: "-1.6244",
      openingTime: "08:30",
      closingTime: "19:00",
    },
  });

  const { formState: { isSubmitting }, reset } = methods;

  // Hydrate fields immediately when sheet opens or the active shop selection changes
  useEffect(() => {
    if (shop) {
      reset({
        id: shop.id,
        name: shop.name || "",
        shopSlug: shop.slug || "",
        address: shop.address || "",
        phone: shop.phone || "",
        city: shop.city || "",
        region: shop.region || "",
        gpsAddress: shop.gpsAddress || "",
        latitude: shop.latitude?.toString() || "6.6889",
        longitude: shop.longitude?.toString() || "-1.6244",
        openingTime: shop.openingTime || "08:30",
        closingTime: shop.closingTime || "19:00",
      });
    }
  }, [shop, reset]);

  const onSubmit = async (data: UpdateShopInput) => {
    toast.promise(updateShopAction(data), {
      loading: "Saving shop alterations...",
      success: (res) => {
        if (res.success) {
          onClose(); // Slide out drawer on success execution
          if(onSuccess) onSuccess();
          if (res.data) {
            useAuthStore.getState().fetchUser();
            router.push(`/${businessSlug}/shops`);
            router.refresh();
          }
          return res.message || "Shop metrics updated successfully.";
        } else {
          throw new Error(res.error || "Failed to alter shop attributes.");
        }
      },
      error: (err) => err.message,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full  sm:max-w-xl! overflow-y-auto bg-white p-6 rounded-l-2xl border-l border-slate-100 font-sans">
        
        {/* SHEET HEADER DESIGN */}
        <SheetHeader className="flex flex-row items-start gap-4 space-y-0 pb-4 border-b border-slate-100">
          <div className="p-2 bg-blue-50 text-blue-800 rounded-lg shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <SheetTitle className="text-base font-bold text-blue-950">Edit Shop Profile</SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              Modify branch parameters, contact configurations, or working operational schedules.
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* INPUT LAYOUT CONTEXT WRAPPER */}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 pt-5">
            
            {/* SECTION 1: GENERAL INFO */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">General Information</h3>
              
              <FormInput 
                name="name" 
                label="Shop Name *" 
                placeholder="Enter shop name" 
                className="h-10"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomPhoneField />
                
                <div className="space-y-2">
                  <FormInput
                    name="shopSlug"
                    label="Shop Slug (Read-only)"
                    type="text" 
                    readOnly 
                    placeholder="shop-url-slug"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: LOCATION INFORMATION */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">Location Details</h3>
              
              <FormInput 
                name="address" 
                label="Address *" 
                textArea 
                placeholder="Enter shop address" 
                hintText="House/Building number, street name, area, etc."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput name="city" label="City *" placeholder="Enter city" />
                <FormInput name="region" label="Region *" placeholder="Enter region" />
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wider">GPS Coordinates</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormInput name="latitude" label="Latitude" placeholder="e.g. 6.6889" className="font-mono" />
                  <FormInput name="longitude" label="Longitude" placeholder="e.g. -1.6244" className="font-mono" />
                  <FormInput name="gpsAddress" label="GPS Address" placeholder="e.g. GA-184-8164" className="font-mono" />
                </div>
              </div>
            </div>

            {/* SECTION 3: OPERATING TIMES */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">Operating Hours</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput name="openingTime" label="Opening Time" type="time" />
                <FormInput name="closingTime" label="Closing Time" type="time" />
              </div>
            </div>

            {/* ACTION TRIGGERS FOOTER BAR */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-5 border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold h-10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-5 bg-blue-700 text-white hover:bg-blue-800 rounded-xl text-xs font-bold h-10 shadow-sm transition-all duration-150"
              >
                {isSubmitting ? "Saving..." : "Save Modifications"}
              </Button>
            </div>

          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}