"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, FormProvider, SubmitHandler, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getAllISOCodes } from "iso-country-currency"
import { Check, Info, Store, ShieldCheck, Building2, User, Eye, Sparkles, ArrowRight, ArrowLeft, Lock } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { useAuthStore } from "@/store/useAuthStore"
import { SignUpFormSchema, signupSchema } from "@/types/schema/auth.schema"
import { SignUpResponse } from "@/types/auth/auth"

import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldDescription, FieldGroup, FieldContent } from "@/components/ui/field"
import { FormInput } from "@/components/reusables/inputs/FormInput"
import CustomButton from "@/components/reusables/CustomButton"
import Image from "next/image"

const STEPS = [
  { id: 1, label: "Business Info", icon: Building2 },
  { id: 2, label: "Create Shop", icon: Store },
  { id: 3, label: "Owner Profile", icon: User },
  { id: 4, label: "Review", icon: Eye },
  { id: 5, label: "Complete", icon: Sparkles },
];

export function SignupForm() {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Load and sort countries alphabetically
  const countries = getAllISOCodes()
    .map((c) => ({ name: c.countryName, code: c.iso }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const forms = useForm<SignUpFormSchema>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      businessName: "",
      countryCode: "",
      shopName: "",
      shopAddress: "",
      shopPhone: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAgreement: false,
    },
  });

  const {
    handleSubmit,
    setError,
    setValue,
    trigger,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = forms;

  const agreementTermsCheck = useWatch({ control, name: "termsAgreement" })

  // Validate only the fields present on the active step before advancing
  const handleNext = async () => {
    let fieldsToValidate: (keyof SignUpFormSchema)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["businessName", "countryCode"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["shopName", "shopAddress", "shopPhone"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["firstName", "lastName", "email", "password", "confirmPassword"];
    } else if (currentStep === 4) {
      fieldsToValidate = ["termsAgreement"];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setDirection("forward");
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setDirection("backward");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Onsubmit function to handle submit
  const onSubmit: SubmitHandler<SignUpFormSchema> = async (data) => {
    setDirection("forward");
    setCurrentStep(5); // Move to provisioning screen
    const response = await signup(data) as SignUpResponse;
    if (response.success && response.message && response.redirectTo) {
      setTimeout(() => {
        router.push(response.redirectTo!);
      }, 2000);
      return;
    }

    // Handle errors
    if (response.error && (response.status === 401 || response.status === 500)) {
      setCurrentStep(4); // Revert back to review/form
      setError("root", { message: response.error })
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center p-0 md:p-6 lg:p-10 font-sans relative overflow-hidden">
      
      {/* Background Animated Orbs / Mesh Gradient Highlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -40, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-[1400px] bg-white/95 backdrop-blur-2xl md:rounded-[2.5rem] shadow-2xl shadow-blue-950/20 border border-white/20 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[850px] relative z-10"
      >

        {/* ================= LEFT SIDEBAR PANEL (ENTERPRISE BRANDING & FEATURES) ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#090d16] p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden border-r border-slate-800/50 text-white">
          
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="space-y-10 z-10">
            {/* Logo & Brand Identity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-3 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center ring-1 ring-white/20">
                  <Link href="/login" className="flex items-center gap-2 self-center">
                    <div className="flex size-6 items-center justify-center text-white">
                      <Image src="/logo-trans.png" alt="Logo" width={24} height={24} className="brightness-200" />
                    </div>
                  </Link>
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight text-white block">MultiPOS</span>
                  <span className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase block">Enterprise Cloud Architecture</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium">
                v2.5 Release
              </span>
            </div>

            {/* Floating Hero Illustration with Soft Glow */}
            <div className="relative w-full max-w-[280px] lg:max-w-[340px] aspect-square mx-auto my-6">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl filter animate-pulse" />
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full h-full drop-shadow-2xl"
              >
                <Image
                  src="/imgs/register-house.png"
                  alt="MultiPOS Shop Setup Illustration"
                  fill
                  sizes="(max-width: 768px) 280px, 340px"
                  className="object-contain"
                  priority
                />
              </motion.div>
            </div>

            {/* Animated Enterprise Value Propositions */}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-widest uppercase text-blue-400">Unified Infrastructure</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Scale your retail footprint globally.
                </h2>
              </div>

              <div className="space-y-3.5">
                {[
                  "Multi-Branch Management & Synchronization",
                  "Real-Time Inventory & Stock Distribution",
                  "Granular Role-Based Employee Permissions",
                  "Advanced Predictive Sales Analytics",
                  "99.99% Uptime Secure Cloud Platform"
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                    className="flex items-center gap-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-xl p-3 transition-colors duration-200"
                  >
                    <div className="bg-blue-500/20 text-blue-400 rounded-lg p-1.5 ring-1 ring-blue-500/30">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="text-sm font-medium text-slate-200">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Trusted Statistics Footer Banner */}
          <div className="bg-gradient-to-r from-slate-900/90 to-blue-950/90 rounded-2xl p-5 border border-slate-700/50 shadow-xl mt-8 z-10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold text-slate-300">Trusted by growing businesses</span>
              </div>
              <span className="text-xs font-bold text-blue-400">500+ Active</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <span className="text-lg font-black text-white block">10M+</span>
                <span className="text-[11px] text-slate-400 font-medium">Processed Transactions</span>
              </div>
              <div>
                <span className="text-lg font-black text-emerald-400 block">99.99%</span>
                <span className="text-[11px] text-slate-400 font-medium">Platform Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM CONTENT AREA ================= */}
        <div className="lg:col-span-7 p-6 md:p-12 lg:p-16 flex flex-col justify-between bg-white relative">
          <div className="w-full max-w-[600px] mx-auto my-auto space-y-8">

            {/* Header Titles */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enterprise Onboarding Wizard</span>
              </motion.div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Your MultiPOS Workspace</h1>
              <p className="text-slate-500 text-sm font-medium">
                Configure your retail command center in seconds.
              </p>
            </div>

            {/* Premium Progress Onboarding Stepper Bar */}
            <div className="w-full py-4">
              <div className="flex w-full items-center justify-between relative">
                {STEPS.map((step, index) => {
                  const isCompleted = currentStep > step.id || (currentStep === 4 && agreementTermsCheck && step.id === 4);
                  const isActive = currentStep === step.id && !(currentStep === 4 && agreementTermsCheck && step.id === 4);
                  const StepIcon = step.icon;

                  return (
                    <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
                      <div className="flex items-center w-full justify-center">
                        <motion.div
                          animate={{
                            scale: isActive ? 1.1 : 1,
                            backgroundColor: isCompleted ? "#2563eb" : isActive ? "#ffffff" : "#f1f5f9",
                            borderColor: isCompleted ? "#2563eb" : isActive ? "#2563eb" : "#e2e8f0",
                          }}
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-colors duration-300 shadow-sm ${
                            isCompleted
                              ? "text-white shadow-blue-500/30 shadow-md"
                              : isActive
                              ? "text-blue-600 ring-4 ring-blue-50"
                              : "text-slate-400"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : (
                            <StepIcon className="w-5 h-5" />
                          )}
                        </motion.div>

                        {/* Animated Connecting Line */}
                        {index < STEPS.length - 1 && (
                          <div className="h-[3px] flex-1 mx-2 bg-slate-100 rounded-full overflow-hidden relative">
                            <motion.div
                              className="absolute inset-y-0 left-0 bg-blue-600"
                              initial={{ width: "0%" }}
                              animate={{ width: currentStep > step.id ? "100%" : "0%" }}
                              transition={{ duration: 0.4, ease: "easeInOut" }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-center">
                        <span className={`text-[11px] font-bold tracking-tight transition-colors duration-300 ${isActive || isCompleted ? "text-blue-700" : "text-slate-400"}`}>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Form Fields Container Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100 relative overflow-hidden">
              <FormProvider {...forms}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                  <AnimatePresence mode="wait" initial={false}>
                    {/* STEP 1: BUSINESS LOGISTICS DATA */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: direction === "forward" ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction === "forward" ? -20 : 20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">Let&apos;s create your business workspace</h3>
                            <p className="text-xs text-slate-500">Provide your official commercial entity name and region.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <FormInput name="businessName" type="text" label="Business Name *" placeholder="e.g. Candy Klyne Logistics" />

                          <Field>
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Country Location *</label>
                            <Select onValueChange={(value) => setValue("countryCode", value, { shouldValidate: true })} defaultValue={getValues("countryCode")}>
                              <SelectTrigger className={`h-12 w-full bg-slate-50/50 rounded-xl border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 ${errors.countryCode ? "border-destructive focus:ring-destructive" : ""}`}>
                                <SelectValue placeholder="Select your operational country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((c) => (
                                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.countryCode && <p className="text-destructive text-xs mt-1.5 font-semibold">{errors.countryCode.message}</p>}
                          </Field>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: CREATE FIRST SHOP OUTLET */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: direction === "forward" ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction === "forward" ? -20 : 20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">Setup your primary branch outlet</h3>
                            <p className="text-xs text-slate-500">Add your first physical shop or location details.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <FormInput name="shopName" type="text" label="Shop Name *" placeholder="e.g. Main Branch" />
                          <FormInput name="shopPhone" type="text" label="Phone Number" placeholder="e.g. +233 20 123 4567" />
                          <FormInput name="shopAddress" type="text" label="Shop Address" placeholder="Enter shop physical street layout address" />

                          <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
                            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>You can scale and configure additional retail branches seamlessly from your dashboard anytime after deployment.</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: ACCESS & CONTROL SYSTEM IDENTITY MANAGEMENT */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step-3"
                        initial={{ opacity: 0, x: direction === "forward" ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction === "forward" ? -20 : 20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">Create your secure administrator account</h3>
                            <p className="text-xs text-slate-500">Establish your master credentials for complete workspace access control.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput name="firstName" type="text" label="First Name *" placeholder="First name" />
                            <FormInput name="lastName" type="text" label="Last Name *" placeholder="Last name" />
                          </div>

                          <FormInput name="email" type="email" label="Email Address *" placeholder="e.g. owner@example.com" />
                          <FormInput name="password" type="password" label="Password *" placeholder="••••••••" hintText="Must be at least 8 secure characters long." />
                          <FormInput name="confirmPassword" type="password" label="Confirm Password *" placeholder="••••••••" />
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4: VERIFICATION PRE-FLIGHT AUDIT */}
                    {currentStep === 4 && (
                      <motion.div
                        key="step-4"
                        initial={{ opacity: 0, x: direction === "forward" ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction === "forward" ? -20 : 20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Eye className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">Review everything before we launch your workspace</h3>
                            <p className="text-xs text-slate-500">Verify your multi-tenant parameters prior to database provisioning.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/60 p-5 space-y-3.5 text-xs text-slate-600 font-medium">
                            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                              <span className="text-slate-400">Workspace Business:</span>
                              <span className="text-slate-900 font-bold">{getValues("businessName")}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                              <span className="text-slate-400">Primary Branch Outlet:</span>
                              <span className="text-slate-900 font-bold">{getValues("shopName")}</span>
                            </div>
                            {getValues("shopPhone") && (
                              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                                <span className="text-slate-400">Shop Contact Line:</span>
                                <span className="text-slate-900 font-bold">{getValues("shopPhone")}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                              <span className="text-slate-400">Administrator Full Name:</span>
                              <span className="text-slate-900 font-bold">{getValues("firstName")} {getValues("lastName")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Admin Email ID:</span>
                              <span className="text-slate-900 font-bold lowercase">{getValues("email")}</span>
                            </div>
                          </div>

                          <FieldGroup>
                            <Field orientation="horizontal" className="flex items-start gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 transition-colors">
                              <Checkbox
                                id="termsAgreement"
                                className="mt-0.5 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                checked={agreementTermsCheck}
                                onCheckedChange={(checked) => {
                                  setValue("termsAgreement", checked as boolean, { shouldValidate: true })
                                }}
                              />
                              <FieldContent>
                                <FieldDescription className="text-xs text-slate-600 leading-relaxed font-medium">
                                  I explicitly agree to MultiPOS&apos;s <a href="#" className="text-blue-600 hover:underline font-bold">Terms of Use</a> and confirm having thoroughly reviewed the global <a href="#" className="text-blue-600 hover:underline font-bold">Privacy Policy</a> context directives.
                                </FieldDescription>
                              </FieldContent>
                            </Field>
                            {errors.termsAgreement && <p className="text-destructive text-xs font-semibold mt-1">{errors.termsAgreement.message}</p>}
                          </FieldGroup>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 5: PROVISIONING ORCHESTRATION TERMINAL LOADING SCREEN */}
                    {currentStep === 5 && (
                      <motion.div
                        key="step-5"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 space-y-6"
                      >
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100 shadow-xl shadow-blue-500/10 relative">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-3xl border-2 border-dashed border-blue-400"
                          />
                          <Sparkles className="w-10 h-10 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-slate-900">Your workspace is almost ready</h3>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                            Configuring database isolation contexts, generating secure multi-tenant assets, and launching dashboard...
                          </p>
                        </div>
                        <div className="w-48 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
                          <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CONTROL BUTTONS HUD NAVIGATION BOARD */}
                  {currentStep < 5 && (
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                      {currentStep > 1 ? (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="h-12 px-6 text-sm font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 flex items-center gap-2 active:scale-95"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back</span>
                        </button>
                      ) : (
                        <div className="text-xs text-slate-500 font-medium">
                          Already have an account? <Link href="/login" className="text-blue-600 hover:underline font-bold ml-1">Login</Link>
                        </div>
                      )}

                      {currentStep < 4 ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleNext}
                          className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center gap-2"
                        >
                          <span>Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      ) : (
                        <CustomButton
                          type="submit"
                          text="Complete Activation Setup"
                          isLoading={isSubmitting}
                          disabled={!agreementTermsCheck}
                          className="h-12 bg-blue-600 hover:bg-blue-700 font-bold text-sm rounded-xl px-8 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        />
                      )}
                    </div>
                  )}

                  {errors.root && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-center text-xs font-semibold bg-destructive/5 p-4 rounded-xl border border-destructive/10 mt-4"
                    >
                      {errors.root.message}
                    </motion.p>
                  )}
                </form>
              </FormProvider>
            </div>

            {/* Bottom Enterprise Security Badge Footer */}
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium pt-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Protected by 256-bit SSL Enterprise Security</span>
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}