// app/[slug]/settings/business-profile/page.tsx
"use client";

import React, { useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { 
  Building2, Globe, Clock, Sliders, Palette, CreditCard, 
  Cpu, UploadCloud, HelpCircle, Mail, ShieldCheck, CheckCircle2 
} from "lucide-react";

// Native ISO Package Import matching your Sign-Up pattern
import { getAllInfoByISO } from "iso-country-currency";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Custom Reusable Form Components
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { CustomPhoneField } from "@/components/reusables/inputs/CustomPhoneField";
import { businessProfileSchema, type BusinessProfileInput } from "@/types/schema/business-profile.schema";
import { BrandingTab } from "./BrandingTab";
import { PreferenceTab } from "./PreferenceTab";
import { BillingTab } from "./BillingTab";
import { IntegrationsTab } from "./IntegrationsTab";

export default function BusinessProfilePage() {
  const params = useParams();
  const businessSlug = params?.slug as string;

  const methods = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: "Bismark Ventures",
      businessSlug: businessSlug || "bismark-ventures",
      email: "hello@bismarkventures.com",
      phone: "+233241234567",
      address: "Accra, Greater Accra Region, Ghana",
      country: "GH", // Default country initializer hook
      countryCode: "GH",
      currencyCode: "GHS",
      currencySymbol: "₵",
      locale: "en-GH",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12 Hours (AM/PM)",
      numberFormat: "1,234.56",
      timezone: "Africa/Accra",
      workStartTime: "08:00",
      workCloseTime: "18:00",
      // Default initial states matching tab configurations
      branding: {
        primaryColor: "#2563eb",
        secondaryColor: "#4f46e5",
        receiptHeader: "",
      },
      preferences: {
        taxConfig: "NO_TAX",
        defaultSegment: "WALK_IN",
        lowStockThreshold: 10,
        multiStoreInventory: false,
      },
      integrations: {
        paystack: true,
        stripe: false,
        quickbooks: false,
        hardwareTerminal: true,
      },
      billing: {
        isAnnualSharing: false,
      }
    },
  });

  const { formState: { isSubmitting }, control, setValue } = methods;

  // React Hook Form Watch expressions
  const watchSlug = useWatch({ control, name: "businessSlug" });
  const watchCountry = useWatch({ control, name: "country" });

  // AUTOMATION ENGINE: Sync country mutations matching backend fallback rules completely
  useEffect(() => {
    if (watchCountry) {
      try {
        const countryData = getAllInfoByISO(watchCountry);

        if (countryData) {
          // Enforce exact backend parity mapping safely
          const derivedLocale = watchCountry === "GH" ? "en-GH" : "en-US";

          setValue("countryCode", watchCountry, { shouldValidate: true });
          setValue("currencyCode", countryData.currency || "GHS", { shouldValidate: true });
          setValue("currencySymbol", countryData.symbol || "₵", { shouldValidate: true });
          setValue("locale", derivedLocale, { shouldValidate: true });

          if (countryData.dateFormat) {
            setValue("dateFormat", countryData.dateFormat, { shouldValidate: true });
          }
        }
      } catch (error) {
        console.error("Failed to parse localized fields context:", error);
      }
    }
  }, [watchCountry, setValue]);

  const onSubmit = async (data: BusinessProfileInput) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: "Saving changes...",
      success: "Business profile updated successfully",
      error: "Failed to update profile",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 md:p-8 font-sans antialiased text-slate-600">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-7xl mx-auto space-y-6">
          
          {/* TOP ACTION HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span>Settings</span>
                <span>&gt;</span>
                <span className="text-slate-600">Business Profile</span>
              </div>
              <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Business Profile</h1>
              <p className="text-xs text-slate-400">Manage your business settings and preferences.</p>
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-[#2563eb] hover:bg-blue-700 text-white font-medium text-xs h-9 px-4 rounded-md shadow-sm transition-all duration-200">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* MAIN TABS LAYER ROUTER */}
          <Tabs defaultValue="business-information" className="w-full space-y-6">
            
            {/* SYSTEM SUB-NAVIGATION TABS */}
            <TabsList className="flex items-center justify-start gap-1 w-full bg-transparent border-b border-slate-200/60 rounded-none h-auto p-0 overflow-x-auto scrollbar-none">
              <TabsTrigger value="business-information" className="flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent rounded-none data-[state=active]:border-[#2563eb] data-[state=active]:text-[#2563eb] data-[state=active]:font-semibold text-slate-400 hover:text-slate-600 bg-transparent data-[state=active]:bg-transparent shadow-none">
                <Building2 className="w-3.5 h-3.5" />
                Business Information
              </TabsTrigger>
              <TabsTrigger value="localization" className="flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent rounded-none data-[state=active]:border-[#2563eb] data-[state=active]:text-[#2563eb] data-[state=active]:font-semibold text-slate-400 hover:text-slate-600 bg-transparent data-[state=active]:bg-transparent shadow-none">
                <Globe className="w-3.5 h-3.5" />
                Localization
              </TabsTrigger>
              <TabsTrigger value="working-hours" className="flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent rounded-none data-[state=active]:border-[#2563eb] data-[state=active]:text-[#2563eb] data-[state=active]:font-semibold text-slate-400 hover:text-slate-600 bg-transparent data-[state=active]:bg-transparent shadow-none">
                <Clock className="w-3.5 h-3.5" />
                Working Hours
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent rounded-none data-[state=active]:border-[#2563eb] data-[state=active]:text-[#2563eb] data-[state=active]:font-semibold text-slate-400 hover:text-slate-600 bg-transparent data-[state=active]:bg-transparent shadow-none">
                <Palette className="w-3.5 h-3.5" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent rounded-none data-[state=active]:border-[#2563eb] data-[state=active]:text-[#2563eb] data-[state=active]:font-semibold text-slate-400 hover:text-slate-600 bg-transparent data-[state=active]:bg-transparent shadow-none">
                <Sliders className="w-3.5 h-3.5" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent rounded-none data-[state=active]:border-[#2563eb] data-[state=active]:text-[#2563eb] data-[state=active]:font-semibold text-slate-400 hover:text-slate-600 bg-transparent data-[state=active]:bg-transparent shadow-none">
                <CreditCard className="w-3.5 h-3.5" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent rounded-none data-[state=active]:border-[#2563eb] data-[state=active]:text-[#2563eb] data-[state=active]:font-semibold text-slate-400 hover:text-slate-600 bg-transparent data-[state=active]:bg-transparent shadow-none">
                <Cpu className="w-3.5 h-3.5" />
                Integrations
              </TabsTrigger>
            </TabsList>

            {/* MAIN INTERACTIVE WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT VIEWPORT CANVAS CONTROLLERS */}
              <div className="lg:col-span-8">
                
                {/* VIEWPORT 1: CORE BUSINESS ATTRIBUTES */}
                <TabsContent value="business-information" className="mt-0 space-y-6">
                  <Card className="border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100/80">
                      <h3 className="text-sm font-bold text-[#0f172a]">Business Information</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Update your basic business details and contact information.</p>
                    </div>
                    
                    <CardContent className="p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="space-y-2 shrink-0">
                          <Label className="text-xs font-semibold text-slate-700">Business Logo</Label>
                          <div className="w-24 h-24 bg-[#0f172a] rounded-xl flex items-center justify-center relative shadow-sm border border-slate-200 overflow-hidden group">
                            <div className="text-white flex flex-col items-center gap-1">
                              <Building2 className="w-8 h-8" />
                            </div>
                          </div>
                          <Button type="button" variant="outline" className="h-8 text-[11px] font-medium border-slate-200 text-slate-600 px-3 bg-white hover:bg-slate-50 shadow-none mt-2 w-full flex items-center gap-1.5">
                            <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                            Change Logo
                          </Button>
                          <p className="text-[10px] text-slate-400 text-center tracking-tight">PNG, JPG or SVG. Max 2MB.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
                          <FormInput name="name" label="Business Name *" placeholder="Bismark Ventures" className="h-10 text-sm border-slate-200 focus-visible:ring-blue-500/20" />
                          
                          <div className="space-y-1.5">
                            <FormInput
                              name="businessSlug"
                              label="Business Slug *"
                              readOnly
                              placeholder="bismark-ventures"
                              className="h-10 text-sm border-slate-200 bg-slate-50/60 text-slate-400 cursor-not-allowed font-medium shadow-none focus-visible:ring-0"
                            />
                            <div className="text-[11px] text-slate-400 font-medium truncate">
                              This will be used in your business URL.{" "}
                              <a href={`https://multipos.app/${watchSlug}`} target="_blank" rel="noreferrer" className="text-[#2563eb] hover:underline inline-flex items-center gap-0.5 font-semibold">
                                https://multipos.app/{watchSlug || "—"}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <FormInput name="email" label="Email Address *" type="email" placeholder="hello@bismarkventures.com" className="h-10 text-sm border-slate-200 focus-visible:ring-blue-500/20" />
                          <span className="text-[10px] text-slate-400 font-medium">We&apos;ll use this email for important notifications.</span>
                        </div>
                        <div className="space-y-1">
                          <CustomPhoneField />
                          <span className="text-[10px] text-slate-400 font-medium">Primary contact number for your business.</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <FormInput name="address" label="Business Address" textArea placeholder="Accra, Greater Accra Region, Ghana" className="min-h-[70px] text-sm border-slate-200 resize-none focus-visible:ring-blue-500/20" />
                        <span className="text-[10px] text-slate-400 font-medium">Your business location or registered address.</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-start justify-between p-3.5 bg-emerald-50/40 border border-emerald-100/60 rounded-xl">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-slate-700">Email Verification</p>
                            <p className="text-[11px] text-slate-400 font-medium">Your business email has been verified.</p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Verified
                          </span>
                        </div>

                        <div className="flex items-start justify-between p-3.5 bg-emerald-50/40 border border-emerald-100/60 rounded-xl">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-slate-700">Terms Agreement</p>
                            <p className="text-[11px] text-slate-400 font-medium">You have accepted the terms and conditions.</p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Accepted
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" className="h-9 px-4 text-xs font-medium border-slate-200 text-slate-700 bg-white hover:bg-slate-50">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-[#2563eb] hover:bg-blue-700 text-white font-medium text-xs h-9 px-4 rounded-md shadow-sm">Save Changes</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* VIEWPORT 2: GEOGRAPHIC LOCALIZATION SCHEMAS */}
                <TabsContent value="localization" className="mt-0">
                  <Card className="border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100/80">
                      <h3 className="text-sm font-bold text-[#0f172a]">Localization Engine</h3>
                      <p className="text-xs text-slate-400 mt-0.5">System metrics configured automatically via background packages.</p>
                    </div>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                      <FormInput name="countryCode" label="Country Code" readOnly className="h-10 bg-slate-50/60 text-slate-400 text-sm border-slate-200 cursor-not-allowed" />
                      <FormInput name="currencyCode" label="Currency Code" readOnly className="h-10 bg-slate-50/60 text-slate-400 text-sm border-slate-200 cursor-not-allowed" />
                      <FormInput name="currencySymbol" label="Currency Symbol" readOnly className="h-10 bg-slate-50/60 text-slate-400 text-sm border-slate-200 cursor-not-allowed" />
                      <FormInput name="locale" label="System Locale" readOnly className="h-10 bg-slate-50/60 text-slate-400 text-sm border-slate-200 cursor-not-allowed" />
                      <FormInput name="dateFormat" label="Date Format Override" className="h-10 text-sm border-slate-200" />
                      <FormInput name="timeFormat" label="Time Format Override" className="h-10 text-sm border-slate-200" />
                      <FormInput name="numberFormat" label="Number Format" className="h-10 text-sm border-slate-200" />
                      <FormInput name="timezone" label="Timezone Target Node" className="h-10 text-sm border-slate-200" />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* VIEWPORT 3: OPERATIONAL TIME BOUNDARIES */}
                <TabsContent value="working-hours" className="mt-0">
                  <Card className="border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100/80">
                      <h3 className="text-sm font-bold text-[#0f172a]">Working Hours Configuration</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Configure typical enterprise uptime scheduling guidelines.</p>
                    </div>
                    <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput name="workStartTime" label="Work Start Time" type="time" className="h-10 border-slate-200 text-sm" />
                      <FormInput name="workCloseTime" label="Work Close Time" type="time" className="h-10 border-slate-200 text-sm" />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* VIEWPORT 4: DYNAMIC BRANDING CARD CONTENT */}
                <TabsContent value="branding" className="mt-0">
                  <Card className="border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100/80">
                      <h3 className="text-sm font-bold text-[#0f172a]">Branding & Theme Layout</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Control customer-facing themes and receipt footers.</p>
                    </div>
                    <BrandingTab />
                  </Card>
                </TabsContent>

                {/* VIEWPORT 5: PREFERENCES ENGINE SWITCHES */}
                <TabsContent value="preferences" className="mt-0">
                  <Card className="border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100/80">
                      <h3 className="text-sm font-bold text-[#0f172a]">System Preferences</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Global operational rules and stock alerts thresholds.</p>
                    </div>
                    <PreferenceTab />
                  </Card>
                </TabsContent>

                {/* VIEWPORT 6: SUBSCRIPTION SUBSYSTEM BILLING CARD */}
                <TabsContent value="billing" className="mt-0">
                  <Card className="border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100/80">
                      <h3 className="text-sm font-bold text-[#0f172a]">Billing & Subscriptions</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Review subscription level tokens and historical invoice receipts.</p>
                    </div>
                    <BillingTab />
                  </Card>
                </TabsContent>

                {/* VIEWPORT 7: HARDWARE AND TELEMETRY INTEGRATIONS */}
                <TabsContent value="integrations" className="mt-0">
                  <Card className="border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100/80">
                      <h3 className="text-sm font-bold text-[#0f172a]">External Pipelines & Peripherals</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Connect third-party accounting software or POS hardware arrays.</p>
                    </div>
                    <IntegrationsTab />
                  </Card>
                </TabsContent>

              </div>

              {/* RIGHT SIDEBAR: BUSINESS STATUS CONSOLE PANEL */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-slate-200/60 shadow-none bg-white rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-slate-100/80">
                    <h3 className="text-sm font-bold text-[#0f172a]">Business Status</h3>
                  </div>
                  
                  <CardContent className="p-5 space-y-5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800">Email Verified</p>
                          <span className="text-[11px] font-bold text-emerald-600">Yes</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Your email address is verified.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800">Onboarding Status</p>
                          <span className="text-[11px] font-bold text-emerald-600">Completed</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Your business onboarding is complete.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800">Member Since</p>
                          <span className="text-[11px] font-semibold text-slate-700">May 12, 2024</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">1 year, 2 months ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800">Business ID</p>
                          <span className="text-[11px] font-mono text-slate-500 select-all font-medium">BUS_8f7a2e4b</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800">Plan</p>
                          <span className="text-[11px] font-semibold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-md">Pro Plan</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Renews on May 12, 2025</p>
                      </div>
                    </div>

                    <Button type="button" variant="outline" className="w-full text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-slate-50 h-9 rounded-lg shadow-none flex items-center justify-center gap-1.5 mt-2">
                      View Billing Details
                      <span className="text-slate-400 font-normal">↗</span>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-none bg-white rounded-xl overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <h4 className="text-xs font-bold text-[#0f172a]">Need Help?</h4>
                    <p className="text-[11px] text-slate-400 leading-normal font-medium">
                      If you need help updating your business profile or have any questions.
                    </p>
                    <Button type="button" variant="outline" className="w-full text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-slate-50 h-9 rounded-lg shadow-none flex items-center justify-center gap-2">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </div>
          </Tabs>
        </form>
      </FormProvider>
    </div>
  );
}