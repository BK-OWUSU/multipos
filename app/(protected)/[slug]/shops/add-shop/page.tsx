"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Building2, MapPin, Clock, ArrowLeft, Eye, Info } from "lucide-react";
import { DynamicMapWrapper } from "@/components/reusables/map/DynamicMapWrapper";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Custom Reusable Components & Utilities
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { createShopSchema, type CreateShopInput } from "@/types/schema/shop.schema";
// import { createShopAction } from "@/actions/shop.actions";
import { toast } from "sonner";
import { CustomPhoneField } from "@/components/reusables/inputs/CustomPhoneField";
import { createShopAction } from "@/lib/actions/business/shop-actions";

export default function AddNewShopPage() {
  const params = useParams();
  const router = useRouter();
  const businessSlug = params?.slug as string;
  const [computedSlug, setComputedSlug] = useState("");

  const methods = useForm<CreateShopInput>({
    resolver: zodResolver(createShopSchema),
    defaultValues: {
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

  const { formState: {isSubmitting}} = methods;

  const watchName = methods.watch("name");
  const watchAddress = methods.watch("address");
  const watchPhone = methods.watch("phone");
  const watchOpeningTime = methods.watch("openingTime");
  const watchClosingTime = methods.watch("closingTime");

  // Auto-generate slug from name input
  useEffect(() => {
    const slug = (watchName || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
    setComputedSlug(slug);
  }, [watchName]);

  const onSubmit = async (data: CreateShopInput) => {
    console.log(data);
     //The promise now cleanly depends entirely on the store execution block
      toast.promise(createShopAction(data), {
        loading: "Creating new shop branch...",
        success: (res) => {
          if (res.success) {
            router.push(`/${businessSlug}/shops`)
            return res.message || "Shop creation successful";
          } else {
            throw new Error(res.error || "Shop creation failed");
          }
        },
        error: (err) => err.message
      });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* HEADER ACTION BAR */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-950">Add New Shop</h1>
          <p className="text-sm text-slate-500 mt-1">Shops &gt; Add New Shop</p>
        </div>
        <Button variant="outline" asChild className="text-blue-900 border-slate-200 self-start sm:self-auto bg-white hover:bg-slate-50">
          <Link href={`/${businessSlug}/shops`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shops
          </Link>
        </Button>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT AREA: FORM INPUT CARDS (60% Desktop Layout) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* GENERAL INFO CARD */}
            <Card className="border-slate-100 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-blue-950">General Information</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Enter the basic details of the shop.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
                <FormInput 
                  name="name" 
                  label="Shop Name *" 
                  placeholder="Enter shop name" 
                  className="h-10"
                />

                <div className="space-y-2">
                  {/* <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Shop Slug *</Label> */}
                  <FormInput
                    name = "shopSlug"
                    label="Shop Slug *"
                    type="text" 
                    readOnly 
                    value={computedSlug}
                    placeholder="Enter shop slug"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">This will be used in URLs. Use lowercase and hyphens.</p>
                </div>
                {/* Phone Field  */}
                <CustomPhoneField/>
                <FormInput 
                  name="email" 
                  label="Email Address" 
                  placeholder="Enter email address (optional)"
                  className="h-10"
                />
              </CardContent>
            </Card>

            {/* LOCATION DETAILS CARD */}
            <Card className="border-slate-100 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-blue-950">Location Details</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Tell us where the shop is located.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <FormInput 
                  name="address" 
                  label="Address *" 
                  textArea 
                  placeholder="Enter shop address" 
                  hintText="House/Building number, street name, area, etc."
                  className="h-10"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput name="city" label="City *" placeholder="Enter city" />
                  <FormInput name="region" label="Region *" placeholder="Enter region" />
                </div>

                {/* COORDINATES INTEGRATED SECTION */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wider">GPS Coordinates (Optional)</Label>
                    <p className="text-[11px] text-slate-400 mt-0.5">Add the exact location of the shop on the map or enter coordinates manually.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput name="latitude" label="Latitude" placeholder="e.g. 6.6889" type="text" className="font-mono" />
                    <FormInput name="longitude" label="Longitude" placeholder="e.g. -1.6244" type="text" className="font-mono" />
                    <FormInput name="gpsAddress" label="GPS Address" placeholder="e.g. GA-184-8164" type="text" className="font-mono" />
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-blue-50/50 rounded-md border border-blue-100/60 text-blue-800">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-medium">Tip: You can also adjust coordinates by moving the marker pin layout on the preview map directly.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OPERATING HOURS CARD */}
            <Card className="border-slate-100 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-blue-950">Operating Hours</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Set the opening and closing time for this shop.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput name="openingTime" label="Opening Time" type="time" />
                  <FormInput name="closingTime" label="Closing Time" type="time" />
                </div>
                <p className="text-[11px] text-slate-400">These times will be used for POS and reports.</p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT AREA: MAP VIEWER & SUMMARIES (40% Desktop Layout) */}
          <div className="space-y-6">
            
            {/* LOCATION MAP LIVE PANEL */}
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-blue-950">Location Preview</CardTitle>
                <CardDescription className="text-xs text-slate-400">Drag the pin to adjust the location.</CardDescription>
              </CardHeader>
              <CardContent>
                <DynamicMapWrapper />
              </CardContent>
            </Card>

            {/* LIVE PREVIEW SUMMARY CARD */}
            <Card className="border-slate-100 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-slate-100 space-y-0">
                <Eye className="w-4 h-4 text-blue-800" />
                <CardTitle className="text-sm font-bold text-blue-950">Shop Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 pt-4">
                <div className="flex items-center justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Shop Name</span>
                  <span className="font-bold text-slate-700 truncate max-w-40">{watchName || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Shop Slug</span>
                  <span className="font-mono text-slate-500 truncate max-w-40">{computedSlug || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Address</span>
                  <span className="font-bold text-slate-700 truncate max-w-40">{watchAddress || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-bold text-slate-700">{watchPhone ? `+233 ${watchPhone}` : "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Opening Time</span>
                  <span className="font-bold text-slate-700">{watchOpeningTime || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Closing Time</span>
                  <span className="font-bold text-slate-700">{watchClosingTime || "—"}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    <span className="w-1 h-1 rounded-full bg-emerald-600" />
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* ACTION FOOTER BUTTONS BAR */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push(`/${businessSlug}/shops`)}
                className="px-5 border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-5 bg-blue-700 text-white hover:bg-blue-800"
              >
                {isSubmitting ? "Saving..." : "Create Shop"}
              </Button>
            </div>

          </div>
        </form>
      </FormProvider>
    </div>
  );
}