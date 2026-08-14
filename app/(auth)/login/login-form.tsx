"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm, SubmitHandler, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion} from "motion/react"
import { 
  LogIn, 
  Loader2, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  Lock,
  Store,
  BarChart3
} from "lucide-react"

import { cn } from "@/lib/utils"
import { loginSchema, LoginSchema } from "@/types/schema/auth.schema"
import { useAuthStore } from "@/store/useAuthStore"
import { LoginResponse } from "@/types/auth/auth"
import CustomButton from "@/components/reusables/CustomButton"
import { FormInput } from "@/components/reusables/inputs/FormInput"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const login = useAuthStore((state) => state.login)
  const router = useRouter()
  const [rememberMe, setRememberMe] = useState(false)

  const forms = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  })

  const { handleSubmit, setError, formState: { isSubmitting, errors } } = forms

  const onSubmit: SubmitHandler<LoginSchema> = async (data) => {
    const response = await login(data) as LoginResponse

    if (response.isVerified === false && response.redirectTo) {
      router.push(response.redirectTo)
      return;
    } 
      
    if (response.requiresPasswordChange && response.redirectTo) {
      router.push(response.redirectTo)
      return
    }

    if (response.success && response.redirectTo) {
      toast.success("Login successful! Redirecting...", { 
        icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
      })
      const businessSlug = response.businessesSlug || null
      router.push(`/${businessSlug}/dashboard`)
      return
    }
      
    if (response.success && response.multipleBusinesses) {
      toast.success("Multiple Business Owner Implementation coming soon")
      return
    }

    if (response.error) {
      setError("root", { message: response.error })
    }
  }

  return (
    <FormProvider {...forms}>
      <form onSubmit={handleSubmit(onSubmit)} className={cn("flex flex-col gap-5", className)} {...props}>
        <FieldGroup className="space-y-4">
          
          <FormInput 
            name="email" 
            type="email" 
            placeholder="name@company.com" 
            label="Email Address"
          />

          <div className="space-y-1">
            <FormInput 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              label="Password"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe} 
                  onCheckedChange={(c) => setRememberMe(c as boolean)}
                  className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label htmlFor="remember" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <Field className="pt-2">
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <CustomButton 
                type="submit" 
                text="Sign in to Workspace" 
                isLoading={isSubmitting} 
                className="w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200"
                icon={<LogIn className="w-4 h-4 ml-1" />}
              />
            </motion.div>
          </Field>

          {errors.root && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold text-center"
            >
              {errors.root.message}
            </motion.div>
          )}

          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-slate-400 text-[11px] font-bold uppercase tracking-wider">or continue with</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* UI-only Google Authentication Button */}
          <button
            type="button"
            onClick={() => toast.info("Google Enterprise SSO integration pending configuration.")}
            className="w-full h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in with Google Enterprise</span>
          </button>

          <Field className="pt-2">
            <FieldDescription className="text-center text-xs text-slate-500 font-medium">
              Don&apos;t have an active workspace?{" "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4">
                Create Account
              </Link>
            </FieldDescription>
          </Field>

        </FieldGroup>
      </form>
    </FormProvider>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center p-0 lg:p-6 font-sans relative overflow-hidden">
      
      {/* Background Animated Gradient Mesh & Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-125 h-125 bg-indigo-600/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-360 bg-white/95 backdrop-blur-2xl lg:rounded-[2.5rem] shadow-2xl shadow-blue-950/20 border border-white/20 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-212.5 relative z-10"
      >

        {/* ================= LEFT SIDE: AUTHENTICATION PANEL ================= */}
        <div className="lg:col-span-5 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-white relative">
          
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 font-bold group">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <Image src="/logo-trans.png" alt="MultiPOS Logo" width={22} height={22} className="brightness-200" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900">MultiPOS</span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Enterprise Cloud</span>
              </div>
            </Link>
          </div>

          {/* Centered Auth Card Container */}
          <div className="w-full max-w-105 mx-auto my-auto space-y-8 py-6">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enterprise-grade encryption</span>
              </div>
              
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back 👋</h1>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Welcome back! Sign in to access your MultiPOS workspace and continue managing your business with confidence.
              </p>
            </div>

            {/* Embedded Form Component */}
            <div className="bg-slate-50/50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
              <LoginForm />
            </div>

          </div>

          {/* Bottom Security Note */}
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium pt-4">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Secure cloud authentication • Trusted by growing businesses</span>
          </div>

        </div>

        {/* ================= RIGHT SIDE: LIVE PRODUCT SHOWCASE ================= */}
        <div className="lg:col-span-7 bg-linear-to-br from-[#0b1329] via-[#111c38] to-[#070b16] p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white border-l border-slate-800/50">
          
          {/* Subtle Grid Background Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none" />

          {/* Top Floating Badge Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">Live Multi-Tenant Dashboard Preview</span>
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
              v2.5 Architecture
            </span>
          </div>

          {/* Central Interactive Floating Showcase Canvas */}
          <div className="relative w-full max-w-155 mx-auto my-auto py-8">
            
            {/* Main Central Dashboard Mockup Card */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="bg-slate-900/80 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl shadow-blue-950/50 space-y-6 relative z-20"
            >
              {/* Header inside mockup */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Accra Flagship & Retail HQ</h4>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Fully Synchronized
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">Today</span>
                </div>
              </div>

              {/* Top Quick Widgets Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Today&apos;s Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-white">$24,850.40</div>
                  <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +18.4% vs yesterday
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Active Orders</span>
                    <ShoppingCart className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-white">1,482</div>
                  <div className="text-[10px] text-blue-400 font-bold">Live POS Queue</div>
                </div>
              </div>

              {/* Sales Graph Simulated Visual */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <span>Real-Time Sales Performance</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Updated 5s ago</span>
                </div>
                <div className="h-28 w-full flex items-end gap-1.5 pt-4 px-1">
                  {[40, 65, 45, 80, 55, 95, 75, 85, 60, 90, 100, 85].map((val, i) => (
                    <div key={i} className="flex-1 bg-slate-800/80 rounded-t-md relative group h-full flex items-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${val}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                        className="w-full bg-linear-to-t from-blue-600 to-indigo-400 rounded-t-md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating Widget Card 1: Inventory Status */}
            <motion.div
              animate={{ y: [8, -8, 8] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-6 -left-8 bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl z-30 hidden sm:block w-56"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Inventory Status</span>
                  <span className="text-xs font-bold text-white">98.2% Optimal Stock</span>
                </div>
              </div>
            </motion.div>

            {/* Floating Widget Card 2: Employee Performance */}
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -top-6 -right-6 bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl z-30 hidden sm:block w-52"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Active Cashiers</span>
                  <span className="text-xs font-bold text-emerald-400">24 Staff On Duty</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Bottom Footer Feature Callouts */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 z-10">
            <div>
              <span className="text-xs font-bold text-white block">Multi-Branch Sync</span>
              <span className="text-[11px] text-slate-400">Instant cross-outlet updates</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Offline Resilience</span>
              <span className="text-[11px] text-slate-400">Zero downtime operations</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Granular Security</span>
              <span className="text-[11px] text-slate-400">Role-based access control</span>
            </div>
          </div>

        </div>

      </motion.div>
    </div>
  )
}