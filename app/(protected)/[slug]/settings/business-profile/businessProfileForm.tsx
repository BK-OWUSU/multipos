"use client";

import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Clock, 
  Coins, 
  Calendar, 
  Save, 
  Store,
  Users,
  Package,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { BusinessProfileInput, businessProfileSchema } from "@/types/schema/business-profile.schema";
import { getAllISOCodes, getAllInfoByISO } from "iso-country-currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessProfileResponse } from "@/types/types/business-profile.type";
import { toast } from "sonner";
import { updateBusinessProfileAction } from "@/lib/actions/business/business-profile-action";
import { UploadButton } from "@/utils/uploadthing";
import Image from "next/image";
import { deleteUTFile } from "@/lib/actions/uploadthing";


interface BusinessProfileFormProps {
  initialData?: BusinessProfileResponse | null;
  onSuccess?: (data?: BusinessProfileInput) => void;
  loading?: boolean;
}

export function BusinessProfileForm({ initialData, onSuccess, loading = false }: BusinessProfileFormProps) {
  const [isPending, startTransition] = React.useTransition();  
  const countries = getAllISOCodes()
    .map((c) => ({ name: c.countryName, code: c.iso }))
    .sort((a, b) => a.name.localeCompare(b.name));

 const form = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: initialData?.name || "",
      businessSlug: initialData?.businessSlug || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      country: initialData?.country || "",
      logoUrl: initialData?.logoUrl || "",
      fileKey: initialData?.fileKey || "",
      countryCode: initialData?.countryCode || "GH",
      currencyCode: initialData?.currencyCode || "GHS",
      currencySymbol: initialData?.currencySymbol || "₵",
      locale: initialData?.locale || "en-GH",
      dateFormat: initialData?.dateFormat || "DD/MM/YYYY",
      timeFormat: initialData?.timeFormat || "24h",
      numberFormat: initialData?.numberFormat || "en-US",
      timezone: initialData?.timezone || "Africa/Accra",
      workStartTime: initialData?.workStartTime || "08:00",
      workCloseTime: initialData?.workCloseTime || "22:00",
    },
  });
 
 const { register,control, handleSubmit, setValue,reset, getValues, formState: { errors } } = form;
  const watchedLogo = useWatch({control, name: "logoUrl"});

 // Sync form values if initialData updates or loads asynchronously from the store/API
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        businessSlug: initialData.businessSlug || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        country: initialData.country || "",
        countryCode: initialData.countryCode || "GH",
        currencyCode: initialData.currencyCode || "GHS",
        currencySymbol: initialData.currencySymbol || "₵",
        locale: initialData.locale || "en-GH",
        dateFormat: initialData.dateFormat || "DD/MM/YYYY",
        timeFormat: initialData.timeFormat || "24h",
        numberFormat: initialData.numberFormat || "en-US",
        timezone: initialData.timezone || "Africa/Accra",
        workStartTime: initialData.workStartTime || "08:00",
        workCloseTime: initialData.workCloseTime || "22:00",
      });
    }
  }, [initialData, reset]);

const handleCountryChange = (val: string) => {
    setValue("countryCode", val, { shouldValidate: true });
    
    const info = getAllInfoByISO(val);
    if (info) {
      setValue("country", info.countryName, { shouldValidate: true });
      setValue("currencyCode", info.currency, { shouldValidate: true });
      setValue("currencySymbol", info.symbol, { shouldValidate: true });
      setValue("dateFormat", info.dateFormat || "DD/MM/YYYY", { shouldValidate: true });
      setValue("locale", val === "GH" ? "en-GH" : `en-${val}`, { shouldValidate: true });
    }
  };

//   function onSubmit(data: BusinessProfileInput) {
//     console.log("Saving business profile:", data);
//   }

const onSubmit = async (data: BusinessProfileInput) => {
    startTransition(() => {
      toast.promise(
        async () => {
          const res = await updateBusinessProfileAction(data);
          if (!res.success) {
            throw new Error(res.error || res.message || "Failed to update business profile");
          }
          return res;
        },
        {
          loading: "Updating business profile...",
          success: (res) => {
            onSuccess?.(data);
            return res.message || "Business profile updated successfully";
          },
          error: (err) => err.message || "Error updating business profile",
        }
      );
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-8">
      
      {/* Page Section Heading & Actions Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Business Profile Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage enterprise information, operational windows, and regional formatting standards.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" type="button" className="h-9 px-4 text-xs font-medium rounded-xl">
            Cancel
          </Button>
          <Button
            disabled={isPending || loading} 
            type="submit" 
            className="h-9 px-4 text-xs font-medium bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-sm">
            <Save className="w-3.5 h-3.5 mr-2" />
             {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

        {/* ── SECTION: BUSINESS OVERVIEW (KPI CARDS) ── */}
        <div className="grid grid-cols-4 gap-5">
        {/* Total Shops */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Shops</p>
            {loading || !initialData ? (
                <div className="flex items-center mt-2 h-8">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
            ) : (
                <h4 className="text-2xl font-bold text-slate-900 mt-1">{initialData.counts.shops}</h4>
            )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
            </div>
        </div>

        {/* Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Employees</p>
            {loading || !initialData ? (
                <div className="flex items-center mt-2 h-8">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                </div>
            ) : (
                <h4 className="text-2xl font-bold text-slate-900 mt-1">{initialData.counts.employees}</h4>
            )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
            </div>
        </div>

        {/* Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Products</p>
            {loading || !initialData ? (
                <div className="flex items-center mt-2 h-8">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                </div>
            ) : (
                <h4 className="text-2xl font-bold text-slate-900 mt-1">{initialData.counts.products}</h4>
            )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
            </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customers</p>
            {loading || !initialData ? (
                <div className="flex items-center mt-2 h-8">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                </div>
            ) : (
                <h4 className="text-2xl font-bold text-slate-900 mt-1">{initialData.counts.customers}</h4>
            )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
            </div>
        </div>
        </div>

      {/* ── SECTION: BUSINESS INFORMATION ── */}
      <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Business Information</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">Manage your core enterprise identity, branding, and contact details.</CardDescription>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-md border border-blue-100">Tenant Identity</span>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
            {/* Business Logo Row */}
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div className="relative w-20 h-20 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-xl shadow-md overflow-hidden group">
              {watchedLogo ? (
                <>
                  <Image
                    src={watchedLogo} 
                    alt="Business Logo" 
                    className="w-full h-full object-cover"
                    width={80}
                    height={80}
                  />
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const currentKey = getValues("fileKey");
                      
                      if (currentKey) {
                        // Optional: Call your delete uploadthing file function if available
                        await deleteUTFile(currentKey); 
                      }
                      setValue("logoUrl", "", { shouldDirty: true });
                      setValue("fileKey", "", { shouldDirty: true });
                      toast.success("Logo removed");
                    }}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-700">
                   <Image
                    src={initialData?.logoUrl || "/imgs/default-logo.png"} 
                    alt="Business Logo" 
                    className="w-full h-full object-cover"
                    width={80}
                    height={80}
                  />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Business Logo</h3>
              <p className="text-xs text-slate-500 mt-0.5">Recommended 400x400px PNG or SVG with transparent background.</p>
              
              <div className="mt-3">
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) {
                      setValue("logoUrl", res[0].ufsUrl || res[0].url, { shouldDirty: true });
                      setValue("fileKey", res[0].key, { shouldDirty: true });
                      toast.success("Business logo uploaded successfully!");
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`Upload Failed: ${error.message}`);
                  }}
                  appearance={{
                    button: "bg-blue-900 hover:bg-blue-800 font-medium text-xs h-8 px-4 rounded-xl transition-all shadow-sm text-white",
                    container: "flex items-center justify-start m-0 p-0",
                    allowedContent: "hidden"
                  }}
                  content={{
                    button({ ready }) {
                      if (ready) return watchedLogo ? "Change Logo" : "Upload Logo";
                      return "Loading...";
                    }
                  }}
                />
              </div>
            </div>
          </div>
       

          {/* Form Grid inputs */}
          <div className="grid grid-cols-2 gap-5">
            <FieldGroup>
              <Field>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input 
                    {...register("name")} 
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all h-10"
                  />
                </div>
                {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name.message}</p>}
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Slug</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">/</span>
                  <Input 
                    {...register("businessSlug")} 
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-600 focus-visible:outline-none h-10"
                    readOnly
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Slug is uniquely tied to your system routing.</p>
                {errors.businessSlug && <p className="text-[10px] text-rose-500 mt-1">{errors.businessSlug.message}</p>}
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input 
                    {...register("email")} 
                    type="email" 
                    disabled
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all h-10"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-rose-500 mt-1">{errors.email.message}</p>}
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input 
                    {...register("phone")} 
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all h-10"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-500 mt-1">{errors.phone.message}</p>}
              </Field>
            </FieldGroup>

            <div className="col-span-2">
              <FieldGroup>
                <Field>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Physical Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <Input 
                      {...register("address")} 
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all h-10"
                    />
                  </div>
                  {errors.address && <p className="text-[10px] text-rose-500 mt-1">{errors.address.message}</p>}
                </Field>
              </FieldGroup>
            </div>
          </div>
        </CardContent>
      </Card>

     {/* ── SECTION: OPERATIONAL SETTINGS & LOCALIZATION ── */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* Operational Settings */}
        <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
            <CardTitle className="text-sm font-bold text-slate-900">Operational Settings</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">Default operating hours for your retail outlets.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
            <FieldGroup>
              <Field>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Opening Time</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input 
                    {...register("workStartTime")} 
                    type="time" 
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all h-10"
                  />
                </div>
                {errors.workStartTime && <p className="text-[10px] text-rose-500 mt-1">{errors.workStartTime.message}</p>}
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Closing Time</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input 
                    {...register("workCloseTime")} 
                    type="time" 
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all h-10"
                  />
                </div>
                {errors.workCloseTime && <p className="text-[10px] text-rose-500 mt-1">{errors.workCloseTime.message}</p>}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Localization Settings */}
        <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
            <CardTitle className="text-sm font-bold text-slate-900">Localization</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">Define currency rules, regional codes, and formatting.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            
            {/* Country Dropdown selection */}
            <FieldGroup>
              <Field>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country Location</label>
                <Select 
                  onValueChange={handleCountryChange} 
                  defaultValue={getValues("countryCode")}
                >
                  <SelectTrigger className="h-10 w-full bg-white border-slate-200 text-xs rounded-xl transition-shadow focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue placeholder="Select operational country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.countryCode && <p className="text-[10px] text-rose-500 mt-1">{errors.countryCode.message}</p>}
              </Field>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup>
                <Field>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country Code</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <Input 
                      {...register("countryCode")} 
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus-visible:outline-none uppercase h-10"
                      readOnly
                    />
                  </div>
                  {errors.countryCode && <p className="text-[10px] text-rose-500 mt-1">{errors.countryCode.message}</p>}
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Currency Code</label>
                  <Input 
                    {...register("currencyCode")} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus-visible:outline-none uppercase h-10"
                    readOnly
                  />
                  {errors.currencyCode && <p className="text-[10px] text-rose-500 mt-1">{errors.currencyCode.message}</p>}
                </Field>
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup>
                <Field>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Currency Symbol</label>
                  <div className="relative">
                    <Coins className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <Input 
                      {...register("currencySymbol")} 
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus-visible:outline-none h-10"
                      readOnly
                    />
                  </div>
                  {errors.currencySymbol && <p className="text-[10px] text-rose-500 mt-1">{errors.currencySymbol.message}</p>}
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Locale</label>
                  <Input 
                    {...register("locale")} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus-visible:outline-none font-mono h-10"
                    readOnly
                  />
                  {errors.locale && <p className="text-[10px] text-rose-500 mt-1">{errors.locale.message}</p>}
                </Field>
              </FieldGroup>
            </div>

            <FieldGroup>
              <Field>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date Format</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input 
                    {...register("dateFormat")} 
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus-visible:outline-none font-mono h-10"
                    readOnly
                  />
                </div>
                {errors.dateFormat && <p className="text-[10px] text-rose-500 mt-1">{errors.dateFormat.message}</p>}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

      </div>

      {/* ── SECTION: BUSINESS STATUS & VERIFICATION ── */}
      <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
          <CardTitle className="text-sm font-bold text-slate-900">Business Status & Compliance</CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">Verification states, progression markers, and legal agreements.</CardDescription>
        </CardHeader>

        <CardContent className="p-6 grid grid-cols-4 gap-6">
          
          {/* Item 1: Email Verification */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Email Verification</span>
                {initialData?.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                    <XCircle className="w-3 h-3" /> Not Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Tenant administrative email address authenticated.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Status Flag</span>
              {initialData?.isEmailVerified ? (
             <div className="w-8 h-4 bg-emerald-600 rounded-full relative p-0.5 shadow-inner">
                <div className="w-3 h-3 bg-white rounded-full ml-auto shadow-sm"></div>
              </div>
              ): (
               <div className="w-8 h-4 bg-gray-500 rounded-full relative p-0.5 shadow-inner">
                <div className="w-3 h-3 bg-white rounded-full mr-auto shadow-sm"></div>
              </div>
              )}
             
            </div>
          </div>

          {/* Item 2: Onboarding Progress */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Onboarding Step</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  <Sparkles className="w-3 h-3" /> {initialData?.onboardingStep} / 2
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Full workspace configuration completed successfully.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Onboarded</span>
              {initialData?.isOnboarded ? (
                <div className="w-8 h-4 bg-emerald-600 rounded-full relative p-0.5 shadow-inner">
                  <div className="w-3 h-3 bg-white rounded-full ml-auto shadow-sm"></div>
                </div>
              ) : (
                <div className="w-8 h-4 bg-gray-500 rounded-full relative p-0.5 shadow-inner">
                  <div className="w-3 h-3 bg-white rounded-full mr-auto shadow-sm"></div>
                </div>
              )}
            </div>
          </div>

          {/* Item 3: Terms Agreement */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Terms Agreement</span>
                {initialData?.termsAgreement ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3" /> Accepted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                    <XCircle className="w-3 h-3" /> Not Accepted
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Merchant agreement and merchant policies accepted.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Legal Status</span>
              <div className="w-8 h-4 bg-blue-600 rounded-full relative p-0.5 shadow-inner">
                <div className="w-3 h-3 bg-white rounded-full ml-auto shadow-sm"></div>
              </div>
            </div>
          </div>

          {/* Item 4: Account Status */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Account Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Operational
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Multi-tenant nodes running with normal performance.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Tier Node</span>
              <span className="font-bold text-slate-800 text-[11px]">Enterprise</span>
            </div>
          </div>

        </CardContent>
      </Card>

    </form>
  );
}