"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, FormProvider, SubmitHandler, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getAllISOCodes } from "iso-country-currency"
import { Check, Info, Store, ShieldCheck, Building2, User, Eye, Sparkles } from "lucide-react"

import { useAuthStore } from "@/store/useAuthStore"
import { SignUpFormSchema, signupSchema } from "@/types/schema/auth.schema"
import { AppResponse} from "@/types/auth/auth"

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

  //Onsubmit function to handle submit
  const onSubmit: SubmitHandler<SignUpFormSchema> = async (data) => {
    const response = await signup(data) as AppResponse;
    if (response.success && response.redirectTo) {
      router.push(response.redirectTo);
      return;
    }

    //Handle errors
    if (response.error && (response.status === 401 || response.status === 500)) {
      setError("root", { message: response.error })
    }
  }

  // Generate directional dynamic classes for slide transitions
  const getAnimationClass = () => {
    if (direction === "forward") {
      return "animate-in fade-in slide-in-from-right-4 duration-300 ease-out fill-mode-both";
    }
    return "animate-in fade-in slide-in-from-left-4 duration-300 ease-out fill-mode-both";
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-0 md:p-4 lg:p-8 font-sans">
      <div className="w-full max-w-350 bg-white md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[850px]">

        {/* ================= LEFT SIDEBAR PANEL (BRANDING & FEATURES) ================= */}
        <div className="lg:col-span-4 bg-[#f0f4ff] p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden border-r border-slate-100">
          <div className="space-y-8 z-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-[#2563eb] p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center">
                <Link href="/login" className="flex items-center gap-2 self-center font-medium">
                  <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Image src="/logo-trans.png" alt="Logo" width={20} height={20} />
                  </div>
                </Link>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block">MultiPOS</span>
                <span className="text-[11px] text-slate-500 font-medium tracking-wide uppercase -mt-1 block">Sell Smarter. Grow Faster.</span>
              </div>
            </div>

            {/* Feature Illustration Graphic Asset */}
            <div className="relative w-full max-w-70 md:max-w-[320px] aspect-square mx-auto my-4 animate-in fade-in zoom-in-95 duration-500">
              <Image
                src="/imgs/register-house.png"
                alt="MultiPOS Shop Setup Illustration"
                fill
                sizes="(max-width: 768px) 280px, 320px"
                className="object-contain"
                priority
              />
            </div>

            {/* Value Proposition Bullet Points */}
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your business,<br />one platform</h2>

              <ul className="space-y-3.5 text-sm font-medium text-slate-600">
                <li className="flex items-center gap-3">
                  <div className="bg-blue-800 text-white rounded-full p-0.5"><Check className="w-3.5 h-3.5 stroke-3" /></div>
                  <span>Manage multiple shops</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-blue-800 text-white rounded-full p-0.5"><Check className="w-3.5 h-3.5 stroke-3" /></div>
                  <span>Track inventory in real-time</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-blue-800 text-white rounded-full p-0.5"><Check className="w-3.5 h-3.5 stroke-3" /></div>
                  <span>Powerful sales reporting</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-blue-800 text-white rounded-full p-0.5"><Check className="w-3.5 h-3.5 stroke-3" /></div>
                  <span>Secure and reliable</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-blue-800 text-white rounded-full p-0.5"><Check className="w-3.5 h-3.5 stroke-3" /></div>
                  <span>Built for growth</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Privacy/Security Banner */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-3 mt-8 z-10">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-900 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-xs">Your data is 100% secure</p>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">We use enterprise-grade security to keep your business safe.</p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM CONTENT AREA ================= */}
        <div className="lg:col-span-8 p-6 md:p-12 lg:p-16 flex flex-col justify-between bg-white">
          <div className="w-full max-w-170 mx-auto my-auto space-y-8">

            {/* Header Titles */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-blue-900 tracking-tight">Create Your MultiPOS Account</h1>
              <p className="text-slate-500 text-sm"> Let&apos;s get your business set up in a few simple steps</p>
            </div>

            {/* Progress Stepper Visual Bar */}
            <div className="w-full py-6">
              <div className="flex w-full items-start justify-between">
                {STEPS.map((step, index) => {
                  const isCompleted = currentStep > step.id || (currentStep === 4 && agreementTermsCheck && step.id === 4);
                  const isActive = currentStep === step.id && !(currentStep === 4 && agreementTermsCheck && step.id === 4);
                  const StepIcon = step.icon;

                  return (
                    <div key={step.id} className="flex flex-col items-center flex-1 last:flex-none">

                      {/* Top Row: Standard flex container to cleanly align circles and lines in a single row */}
                      <div className="flex items-center w-full justify-center">

                        {/* The Icon Circle */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 z-10 ${
                            isCompleted
                              ? "bg-blue-800 border-blue-800 text-white scale-105"
                              : isActive
                              ? "bg-white border-blue-500 text-blue-500 ring-4 ring-blue-50 scale-105"
                              : "bg-white border-slate-200 text-slate-400"
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4 stroke-3 animate-in zoom-in-50 duration-200" /> : <StepIcon className="w-4 h-4" />}
                        </div>

                        {/* Seamless, Natural Connecting Line */}
                        {index < STEPS.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 mx-2 transition-all duration-500 ease-in-out origin-left ${
                              isCompleted ? "bg-blue-800 scale-x-100" : "bg-slate-100"
                            }`}
                          />
                        )}
                      </div>

                      {/* Bottom Row: Text spacing remains totally independent */}
                      <div className="mt-2 text-center hidden sm:block">
                        <span className={`text-[11px] font-medium tracking-tight transition-colors duration-300 ${isActive || isCompleted ? "text-blue-800 font-semibold" : "text-slate-400"}`}>
                          {step.label}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Form Fields Canvas */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm overflow-hidden relative">
              <FormProvider {...forms}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                  {/* STEP 1: BUSINESS LOGISTICS DATA */}
                  {currentStep === 1 && (
                    <div key="step-1" className={`space-y-5 ${getAnimationClass()}`}>
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Store className="w-5 h-5 text-blue-800" />
                        <h3 className="font-bold text-slate-800">Business Base Information</h3>
                      </div>

                      <div className="space-y-4 transition-all duration-300">
                        <FormInput name="businessName" type="text" label="Business Name *" placeholder="e.g. Candy Klyne Logistics" />

                        <Field>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Country Location *</label>
                          <Select onValueChange={(value) => setValue("countryCode", value, { shouldValidate: true })} defaultValue={getValues("countryCode")}>
                            <SelectTrigger className={`h-11 w-full bg-white border-slate-200 transition-shadow focus:ring-2 focus:ring-blue-500/20 ${errors.countryCode ? "border-destructive focus:ring-destructive" : ""}`}>
                              <SelectValue placeholder="Select your operational country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((c) => (
                                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.countryCode && <p className="text-destructive text-xs mt-1.5 font-medium">{errors.countryCode.message}</p>}
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CREATE FIRST SHOP OUTLET */}
                  {currentStep === 2 && (
                    <div key="step-2" className={`space-y-5 ${getAnimationClass()}`}>
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="p-1.5 bg-blue-50 text-blue-800 rounded-lg"><Store className="w-4 h-4" /></div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-base">Create Your First Shop</h3>
                          <p className="text-xs text-slate-400">Add your first shop or location. You can add more shops later.</p>
                        </div>
                      </div>

                      <div className="space-y-4 transition-all duration-300">
                        <FormInput name="shopName" type="text" label="Shop Name *" placeholder="e.g. Main Branch" />
                        <FormInput name="shopPhone" type="text" label="Phone Number" placeholder="e.g. +233 20 123 4567" />
                        <FormInput name="shopAddress" type="text" label="Shop Address" placeholder="Enter shop physical street layout address" />

                        <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100/70 flex items-start gap-2.5 text-xs text-blue-900 leading-normal animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 fill-mode-both">
                          <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                          <span>You can add more shops and customize settings after your account is created.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: ACCESS & CONTROL SYSTEM IDENTITY MANAGEMENT */}
                  {currentStep === 3 && (
                    <div key="step-3" className={`space-y-5 ${getAnimationClass()}`}>
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Owner Profile & Security Credentials</h3>
                      </div>

                      <div className="space-y-4 transition-all duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormInput name="firstName" type="text" label="First Name *" placeholder="First name" />
                          <FormInput name="lastName" type="text" label="Last Name *" placeholder="Last name" />
                        </div>

                        <FormInput name="email" type="email" label="Email Address *" placeholder="e.g. owner@example.com" />
                        <FormInput name="password" type="password" label="Password *" placeholder="••••••••" hintText="Must be at least 8 characters long." />
                        <FormInput name="confirmPassword" type="password" label="Confirm Password *" placeholder="••••••••" />
                      </div>
                    </div>
                  )}

                  {/* STEP 4: VERIFICATION PRE-FLIGHT AUDIT */}
                  {currentStep === 4 && (
                    <div key="step-4" className={`space-y-5 ${getAnimationClass()}`}>
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Review Workspace Configurations</h3>
                      </div>

                      <div className="space-y-4 transition-all duration-300">
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3 text-xs text-slate-600 font-medium">
                          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                            <span className="text-slate-400">Workspace Business:</span>
                            <span className="text-slate-900 font-semibold">{getValues("businessName")}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                            <span className="text-slate-400">Primary Branch Outlet:</span>
                            <span className="text-slate-900 font-semibold">{getValues("shopName")}</span>
                          </div>
                          {getValues("shopPhone") && (
                            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                              <span className="text-slate-400">Shop Contact Line:</span>
                              <span className="text-slate-900 font-semibold">{getValues("shopPhone")}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                            <span className="text-slate-400">Business Owner&apos;s Name:</span>
                            <span className="text-slate-900 font-semibold">{getValues("firstName")} {getValues("lastName")}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">System Log In Identifier:</span>
                            <span className="text-slate-900 font-semibold lowercase">{getValues("email")}</span>
                          </div>
                        </div>

                        <FieldGroup>
                          <Field orientation="horizontal" className="flex items-start gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 transition-colors duration-200 focus-within:border-blue-200">
                            <Checkbox
                              id="termsAgreement"
                              className="mt-0.5 border-slate-300 data-[state=checked]:bg-blue-800 data-[state=checked]:border-blue-800 transition-transform duration-200 data-[state=checked]:scale-105"
                              checked={agreementTermsCheck}
                              onCheckedChange={(checked) => {
                                setValue("termsAgreement", checked as boolean, { shouldValidate: true })
                              }}
                            />
                            <FieldContent>
                              <FieldDescription className="text-xs text-slate-500 leading-normal font-medium">
                                I explicitly agree to MultiPOS&apos;s <a href="#" className="text-blue-800 hover:underline font-semibold">Terms of Use</a> and confirm having thoroughly reviewed the global <a href="#" className="text-blue-800 hover:underline font-semibold">Privacy Policy</a> context directives.
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                          {errors.termsAgreement && <p className="text-destructive text-xs font-semibold mt-1">{errors.termsAgreement.message}</p>}
                        </FieldGroup>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: PROVISIONING ORCHESTRATION TERMINAL LOADING SCREEN */}
                  {currentStep === 5 && (
                    <div key="step-5" className="text-center py-10 space-y-4 animate-in zoom-in-95 duration-300">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                        <ShieldCheck className="w-8 h-8 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900">Configuring Database Isolation Contexts</h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Please wait while we provision your structural shop schema models, initialize system settings, and configure tenant structures.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CONTROL BUTTONS HUD NAVIGATION BOARD */}
                  {currentStep < 5 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                      {currentStep > 1 ? (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="h-11 px-5 text-sm font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 flex items-center justify-center active:scale-95"
                        >
                          &larr; Back
                        </button>
                      ) : (
                        <div className="text-xs text-slate-500 font-medium">
                          Already have an account? <Link href="/login" className="text-blue-700 hover:underline font-bold ml-0.5">Login</Link>
                        </div>
                      )}

                      {currentStep < 4 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="h-10 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-sm px-6 rounded-md shadow-sm transition-all duration-200 flex items-center justify-center active:scale-95"
                        >
                          Continue &rarr;
                        </button>
                      ) : (
                        <CustomButton
                          type="submit"
                          text="Complete Activation Setup"
                          isLoading={isSubmitting}
                          disabled={!agreementTermsCheck}
                          className="h-10 bg-blue-800 hover:bg-blue-900 font-semibold text-sm rounded-md px-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        />
                      )}
                    </div>
                  )}

                  {errors.root && (
                    <p className="text-destructive text-center text-xs font-semibold bg-destructive/5 p-3 rounded-xl border border-destructive/10 mt-4 animate-in fade-in duration-200">
                      {errors.root.message}
                    </p>
                  )}
                </form>
              </FormProvider>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}