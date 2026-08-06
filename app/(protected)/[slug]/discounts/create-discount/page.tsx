"use client";

import React from "react";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  Tag, 
  Calendar, 
  ShieldCheck, 
  Eye, 
  HelpCircle, 
  CheckCircle2 
} from "lucide-react";

// Types & Schemas
import { createDiscountSchema, CreateDiscountSchema } from "@/types/schema/inventory.schema";

// Custom Form Input Component
import { FormInput } from "@/components/reusables/inputs/FormInput"; //

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { useAuthStore } from "@/store/useAuthStore";
import { useDiscountStore } from "@/store/discountStore";

export default function CreateDiscountPage() {
  //Stores
  const {createDiscount} = useDiscountStore()
  const user = useAuthStore((state)=> state.user)
  const businessSlug = user?.business.slug;
  const viewDiscountPath = `/${businessSlug}/discounts/view-discount`

  // 1. Initialize react-hook-form with Zod validation rules
  const methods = useForm<CreateDiscountSchema>({
    resolver: zodResolver(createDiscountSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      type: "PERCENTAGE",
      value: undefined,
      isActive: true,
      startDate: "",
      endDate: "",
    },
  });

  const { handleSubmit, watch, setValue, reset, formState:{isValid},} = methods;

  // 2. Watch fields in real-time to synchronize with the right-hand ticket preview panel
  const watchedName = watch("name");
  const watchedDescription = watch("description");
  const watchedType = watch("type");
  const watchedValue = watch("value");
  const watchedIsActive = watch("isActive");
  const watchedStartDate = watch("startDate");
  const watchedEndDate = watch("endDate");

  // Local state helper for controlling date disabled constraints
  const [noExpiry, setNoExpiry] = React.useState(false);

  // 3. Form Submission handler logic
  const onSubmit = (data: CreateDiscountSchema) => {
    console.log("Submitting structured discount payload:", data);
    createDiscount(data)
    reset()
  };

  const todayString = new Date().toISOString().split("T")[0];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-6">
        
        {/* ── HEADER ACTION ROADWAY ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-950">Create New Discount</h1>
            <p className="text-sm text-muted-foreground mt-1">Add a new discount that can be applied to sales.</p>
          </div>
          <Link href={viewDiscountPath}>
            <Button type="button" variant="outline" className="border-slate-200 text-slate-700 gap-2 text-xs font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Discounts
            </Button>
          </Link>
        </div>

        {/* ── MAIN TWO-COLUMN RESPONSIVE LAYOUT MATRIX ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT COLUMN: FORM CONTROLS */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-100 bg-white">
              <CardContent className="p-6 space-y-6">
                
                {/* SECTION: DISCOUNT INFORMATION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm tracking-wide uppercase">
                    <Tag className="w-4 h-4 text-blue-800" />
                    <h2>Discount Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <FormInput
                        name="name"
                        label="Discount Name"
                        labelClassName="text-xs font-bold text-blue-950"
                        placeholder="e.g. Weekend Special"
                        className="pr-12 text-sm border-slate-200 h-10! focus-visible:ring-blue-800"
                      />
                      <span className="absolute right-3 top-9.5 text-[10px] font-medium text-slate-400">
                        {(watchedName || "").length}/100
                      </span>
                    </div>

                    <div className="relative">
                      <FormInput
                        name="description"
                        label="Description (Optional)"
                        labelClassName="text-xs font-bold text-blue-950"
                        placeholder="Short description about this discount..."
                        textArea={true}
                        minLength={4}
                        className="min-h-10 pr-12 text-sm border-slate-200 focus-visible:ring-blue-800 resize-none py-2"
                      />
                      <span className="absolute right-3 bottom-4 text-[10px] font-medium text-slate-400">
                        {(watchedDescription || "").length}/150
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex rounded-md mt-5">
                    <FormInput
                      name="type"
                      label="Type"
                      labelClassName="text-xs font-bold text-blue-950"
                      className="rounded-r rounded-md h-10! text-sm border-slate-200 focus-visible:ring-blue-800"
                      select={true}
                      options={[
                        { id: "PERCENTAGE", name: "Percentage (%)" },
                        { id: "FIXED", name: "Fixed Amount" }
                      ]}
                    />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex rounded-md mt-5">
                        <FormInput
                          name="value"
                          label="Value"
                          labelClassName="text-xs font-bold text-blue-950"
                          type="number"
                          className="rounded-r-none h-10 text-sm border-slate-200 focus-visible:ring-blue-800 w-full"
                        />
                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold h-10 self-end">
                          {watchedType === "PERCENTAGE" ? "%" : <CurrencyFormatter.Currency />}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION: VALIDITY PERIOD */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm tracking-wide uppercase">
                    <Calendar className="w-4 h-4 text-blue-800" />
                    <h2>Validity Period</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <FormInput 
                      name="startDate"
                      label="Start Date (Optional)"
                      labelClassName="text-xs font-bold text-blue-950"
                      type="date"
                      min={todayString}
                      disabled={noExpiry}
                      className="border-slate-200 text-sm w-full"
                    />

                    <FormInput 
                      name="endDate"
                      label="End Date (Optional)"
                      labelClassName="text-xs font-bold text-blue-950"
                      type="date"
                      min={watchedStartDate || todayString}
                      disabled={noExpiry}
                      className="border-slate-200 text-sm w-full"
                    />

                    <div className="flex items-center space-x-2 pb-2.5 h-10">
                      <Checkbox 
                        id="noExpiry" 
                        checked={noExpiry} 
                        onCheckedChange={(val) => {
                          setNoExpiry(!!val);
                          if (val) {
                            setValue("startDate", "");
                            setValue("endDate", "");
                          }
                        }} 
                      />
                      <label htmlFor="noExpiry" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                        No expiry date
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </label>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 text-blue-800 border border-blue-100 rounded-lg text-xs font-medium">
                    Leave start date empty to make it available immediately.
                  </div>
                </div>

                {/* SECTION: STATUS */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm tracking-wide uppercase">
                    <ShieldCheck className="w-4 h-4 text-blue-800" />
                    <h2>Status</h2>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-blue-950">Active</span>
                      <p className="text-xs text-slate-400">Active discounts can be used immediately in sales checkout channels.</p>
                    </div>
                    <Switch 
                      checked={watchedIsActive} 
                      onCheckedChange={(val) => setValue("isActive", val)} 
                      className="data-[state=checked]:bg-blue-800" 
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* LOWER ACTION BUTTONS FOOTER */}
            <div className="flex items-center justify-between gap-4">
              {/* <Link href="/discounts"> */}
                <Button onClick={()=> reset()} 
                  type="button" 
                  variant="outline"
                  disabled = {isValid} 
                  className="border-slate-200 text-slate-700 px-6 font-semibold"
                  >
                  Cancel
                </Button>
              {/* </Link> */}
              <div className="flex items-center gap-3">
                <Button type="submit" className="bg-blue-800 hover:bg-blue-900 text-white font-bold px-6 shadow-sm">
                  Create Discount
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: REAL-TIME TICKET PREVIEW PANEL */}
          <div className="space-y-4 lg:sticky lg:top-8">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs tracking-wider uppercase pl-1">
              <Eye className="w-4 h-4" />
              <h3>Discount Preview</h3>
            </div>

            <Card className="shadow-sm border-slate-100 bg-white overflow-hidden">
              <CardContent className="p-6 space-y-6">
                
                {/* THE GRAPHIC DOTTED TICKET COMPONENT */}
                <div className="relative w-full bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center space-y-3 overflow-hidden">
                  <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 bg-white border-r-2 border-dashed border-blue-200 rounded-full" />
                  <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-white border-l-2 border-dashed border-blue-200 rounded-full" />

                  <div className="text-4xl font-extrabold text-blue-900 tracking-tight">
                    {watchedType === "PERCENTAGE" ? (
                      `${watchedValue || 0}%`
                    ) : (
                      <CurrencyFormatter amount={Number(watchedValue) || 0.00} />
                    )}
                  </div>
                  
                  <div className="font-bold text-blue-950 text-base max-w-[85%] mx-auto truncate">
                    {watchedName || "Untitled Discount"}
                  </div>

                  <div className="inline-flex">
                    <span className="bg-blue-100/80 border border-blue-200 text-blue-800 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                      {watchedType?.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* DATA PROPERTIES METADATA LIST */}
                <div className="space-y-3.5 text-xs font-medium text-slate-600 pt-2">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Type</span>
                    <span className="text-blue-950 font-semibold capitalize">{watchedType?.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Value</span>
                    <span className="text-blue-950 font-bold">
                      {watchedType === "PERCENTAGE" ? (
                        `${watchedValue || 0}%`
                      ) : (
                        <CurrencyFormatter amount={Number(watchedValue) || 0.00} />
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2 items-center">
                    <span className="text-slate-400">Status</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${watchedIsActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                      {watchedIsActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Valid From</span>
                    <span className="text-slate-700">{watchedStartDate || "Immediate"}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400">Valid Until</span>
                    <span className="text-slate-700">{noExpiry ? "Never Expires" : (watchedEndDate || "—")}</span>
                  </div>
                </div>

                {/* INFORMATION BOUNDARY BADGE */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5 text-xs text-slate-500 font-medium leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                  <p>This discount will be available for all sales within the selected validity period.</p>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </form>
    </FormProvider>
  );
}