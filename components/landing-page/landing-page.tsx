"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Check, ChevronDown, Globe, ShieldCheck, 
  Sparkles, Star, Zap, BarChart3, Box, Building2, 
  Layers, RefreshCw, ShoppingCart
} from "lucide-react";

interface LandingPageProps {
  currentSlug?: string;
  isLoggedIn?: boolean;
}

const fadeInParent = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const fadeUpChild = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number] } 
  },
};

const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

const pulseGlow = {
  initial: { opacity: 0.4, scale: 0.95 },
  animate: {
    opacity: [0.4, 0.7, 0.4],
    scale: [0.95, 1.05, 0.95],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};
export function Navbar({ currentSlug, isLoggedIn }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-600">
            Multi<span className="text-blue-600">POS</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link>
          <Link href="#showcase" className="hover:text-blue-600 transition-colors">Platform</Link>
          <Link href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(isLoggedIn ? `/${currentSlug || "dashboard"}` : "/login")}
            className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors hidden sm:inline-flex"
          >
            {isLoggedIn ? "Dashboard" : "Sign In"}
          </Button>
          <Button
            onClick={() => router.push(isLoggedIn ? `/${currentSlug || "dashboard"}` : "/signup")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-full px-6 shadow-sm transition-all"
          >
            <span>{isLoggedIn ? "Open POS" : "Get Started"}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
}

export function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen bg-slate-950 text-white overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32 flex items-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          variants={pulseGlow}
          initial="initial"
          animate="animate"
          className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px]" 
        />
        <motion.div 
          variants={pulseGlow}
          initial="initial"
          animate="animate"
          className="absolute top-1/2 -right-40 w-125 h-125 bg-indigo-600/20 rounded-full blur-[150px]" 
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <motion.div 
            variants={fadeInParent}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 space-y-8"
          >
            <motion.div variants={fadeUpChild} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Enterprise POS Architecture</span>
            </motion.div>

            <motion.h1 variants={fadeUpChild} className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Scale your retail empire with <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-300 to-blue-500">unmatched speed</span>
            </motion.h1>

            <motion.p variants={fadeUpChild} className="text-lg sm:text-xl text-slate-300 max-w-xl font-normal leading-relaxed">
              The multi-tenant point-of-sale infrastructure built for high-growth businesses. Real-time inventory sync, offline resilience, and deep analytics.
            </motion.p>

            <motion.div variants={fadeUpChild} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Button
                onClick={() => router.push("/signup")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 px-8 h-14 rounded-xl"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => router.push("#showcase")}
                size="lg"
                variant="ghost"
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold px-8 h-14 rounded-xl"
              >
                Explore Platform
              </Button>
            </motion.div>

           <motion.div variants={fadeUpChild} className="pt-4 flex items-center gap-6 border-t border-slate-800/80">
              <div className="flex -space-x-2">
                {[
                  "/imgs/pos-img-1.png",
                  "/imgs/pos-img-2.png",
                  "/imgs/pos-1.png",
                  "/imgs/pos-img-4.png",
                ].map((imgSrc, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden">
                    <Image src={imgSrc} alt={`User ${i + 1}`} width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Trusted by <strong className="text-white">500+</strong> global retail brands
                </p>
              </div>
            </motion.div>

          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-6 relative"
          >
            <motion.div 
              variants={floatAnimation}
              initial="initial"
              animate="animate"
              className="relative mx-auto max-w-lg lg:max-w-none"
            >
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden p-4 sm:p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">multipos.app/central-hub</span>
                  <div className="w-4" />
                </div>

                <div className="py-6 space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <p className="text-xs text-slate-400">Total Revenue</p>
                      <p className="text-xl font-bold text-white mt-1">₵148,290.50</p>
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                        +14.2% this month
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <p className="text-xs text-slate-400">Active Branches</p>
                      <p className="text-xl font-bold text-white mt-1">24 Shops</p>
                      <span className="text-xs text-blue-400 font-medium flex items-center gap-1 mt-1">
                        Fully synced
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 col-span-2 sm:col-span-1">
                      <p className="text-xs text-slate-400">Daily Transactions</p>
                      <p className="text-xl font-bold text-white mt-1">1,420</p>
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                        99.99% uptime
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-slate-300">Revenue Velocity</span>
                      <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded">Live Feed</span>
                    </div>
                    <div className="h-32 flex items-end gap-2 pt-4">
                      {[40, 65, 45, 80, 55, 95, 75, 100, 85, 110, 90, 130].map((val, idx) => (
                        <div key={idx} className="flex-1 bg-slate-800 rounded-t-sm relative group">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${val}%` }}
                            transition={{ duration: 1, delay: idx * 0.05 }}
                            className="absolute bottom-0 inset-x-0 bg-linear-to-t from-blue-600 to-indigo-500 rounded-t-sm group-hover:from-blue-500 group-hover:to-indigo-400 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <motion.div 
                variants={floatAnimation}
                initial="initial"
                animate="animate"
                transition={{ delay: 1 }}
                className="absolute -bottom-6 -left-6 sm:-left-10 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md hidden sm:flex items-center gap-4 max-w-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">New Sale Recorded</p>
                  <p className="text-sm font-bold text-white">₵1,250.00 • Momo Pay</p>
                  <span className="text-[10px] text-emerald-400 font-medium">Just now from Koforidua Branch</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function TrustedCompanies() {
  const companies = ["Shopify", "Stripe", "Vercel", "Notion", "Linear", "Supabase"];

  return (
    <section className="py-16 bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-8">
          Powered by world-class software standards
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-70">
          {companies.map((company, index) => (
            <div key={index} className="text-xl font-bold tracking-wider text-slate-400 font-mono hover:text-white transition-colors">
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesGrid() {
  const features = [
    {
      icon: <Building2 className="w-6 h-6 text-blue-400" />,
      title: "Multi-Tenant Architecture",
      description: "Manage multiple branches, isolated databases, and customized pricing structures effortlessly from one master account."
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-indigo-400" />,
      title: "Real-Time Inventory Sync",
      description: "Automatic stock deduction across all touchpoints with instant low-stock alerts and transfer tracking."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-400" />,
      title: "Advanced Financial Analytics",
      description: "Deep insights into profit margins, top-selling variants, cashier performance, and cash register discrepancies."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: "Enterprise Security & ACL",
      description: "Granular role-based access control, biometric login options, and immutable audit logs for every transaction."
    },
    {
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      title: "Offline-First Resilience",
      description: "Never lose a sale. Continue processing transactions offline with automatic background queue synchronization."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: "Lightning Fast POS UI",
      description: "Optimized keyboard shortcuts, barcode scanning support, and split-payment handling built for high-speed queues."
    }
  ];

  return (
    <section id="features" className="py-24 bg-white text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold tracking-widest uppercase text-blue-600 mb-3">Capabilities</h2>
          <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Engineered for high-volume retail operations
          </p>
          <p className="mt-4 text-lg text-slate-600">
            Every module is meticulously designed to provide zero friction during checkout while giving management total control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)" }}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function InteractiveShowcase() {
  return (
    <section id="showcase" className="py-24 bg-slate-50 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Branch Control</span>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Control all your storefronts from a single pane of glass
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              Create and manage multiple shops, assign permissions to employees, and monitor live register shifts in real-time across different cities.
            </p>
            <ul className="space-y-3 pt-2">
              {["Centralized product catalog pricing", "Branch-specific low stock thresholds", "Detailed cashier shift reconciliation"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xl p-4 relative group">
              <div className="absolute inset-0 bg-blue-600/5 rounded-2xl filter blur-xl group-hover:bg-blue-600/10 transition-colors" />
              <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center text-slate-400 font-mono text-sm">
                <Image src="/imgs/pos-img-1.png" className="object-fill" fill   sizes="100vw"  alt="Descriptive text" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xl p-4 relative group">
              <div className="absolute inset-0 bg-indigo-600/5 rounded-2xl filter blur-xl group-hover:bg-indigo-600/10 transition-colors" />
              <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center text-slate-400 font-mono text-sm">
                 <Image src="/imgs/pos-img-3.png" className="object-fill" fill   sizes="100vw"  alt="Descriptive text" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
              <Box className="w-3.5 h-3.5" />
              <span>Advanced Inventory Management</span>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Seamless stock transfers and barcode scanning
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              Track variants by size, color, and material. Issue stock transfer requests between branches with full sign-off discrepancy checks.
            </p>
            <ul className="space-y-3 pt-2">
              {["Variant matrix support with custom attributes", "Purchase order supplier management", "Stock logs with IP and user auditing"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Statistics() {
  const stats = [
    { value: "500+", label: "Active Retail Businesses" },
    { value: "10M+", label: "Transactions Processed" },
    { value: "99.99%", label: "System Uptime Guaranteed" },
    { value: "120+", label: "Cities & Storefronts Connected" },
  ];

  return (
    <section className="py-20 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"
            >
              <p className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400 mb-2">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const testimonials = [
    {
      name: "Kwame Mensah",
      role: "Operations Director, Accra Retail Hub",
      comment: "MultiPOS completely transformed how we handle stock across our branches. The multi-tenant architecture is exceptionally fast and reliable.",
      avatar: "/imgs/avatar-1.png"
    },
    {
      name: "Abena Osei",
      role: "Founder, Koforidua Boutique Stores",
      comment: "The offline resilience saved us during network outages. The dashboard layout is as clean as Notion or Linear.",
      avatar: "/imgs/avatar-3.png"
    },
    {
      name: "Kofi Boateng",
      role: "CFO, Enterprise Supermarkets",
      comment: "Reporting and cash shift reconciliation are bulletproof. Audit logs give us total accountability over every cashier.",
     avatar: "/imgs/avatar-3.png"
    }
  ];

  return (
    <section className="py-24 bg-white text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold tracking-widest uppercase text-blue-600 mb-3">Testimonials</h2>
          <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Loved by modern retail leaders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6">&quot;{t.comment}&quot;</p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <Image src={t.avatar} alt={t.name} width={48} height={48} className="rounded-full object-cover" />
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingPreview() {
  const router = useRouter();
  const plans = [
    {
      name: "Starter",
      price: "₵299",
      period: "per month",
      description: "Ideal for single-location boutiques and small retail stores.",
      features: ["1 Shop location", "Up to 3 staff accounts", "Basic inventory management", "Standard reporting", "Email support"],
      highlighted: false,
    },
    {
      name: "Business",
      price: "₵799",
      period: "per month",
      description: "Built for growing multi-branch businesses scaling operations.",
      features: ["Up to 5 shop locations", "Unlimited staff accounts", "Advanced variant matrix & transfers", "Real-time cash session tracking", "Priority 24/7 support"],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact sales",
      description: "For large retail chains requiring custom integrations & dedicated SLAs.",
      features: ["Unlimited shop locations", "Dedicated database isolation", "Custom API & ERP integrations", "Advanced audit logs & security", "Dedicated Account Manager"],
      highlighted: false,
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold tracking-widest uppercase text-blue-600 mb-3">Pricing</h2>
          <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Simple, transparent plans for every scale
          </p>
          <p className="mt-4 text-lg text-slate-600">
            No hidden fees. Start with a 14-day free trial on any plan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all ${
                plan.highlighted 
                  ? "bg-slate-950 text-white shadow-2xl ring-2 ring-blue-600 lg:-translate-y-4" 
                  : "bg-white text-slate-900 border border-slate-200 shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.highlighted ? "text-slate-400" : "text-slate-600"}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl sm:text-5xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${plan.highlighted ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={plan.highlighted ? "text-slate-300" : "text-slate-700"}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={() => router.push("/signup")}
                className={`w-full py-6 rounded-xl font-semibold transition-all ${
                  plan.highlighted 
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30" 
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Can I use MultiPOS offline?",
      a: "Yes! MultiPOS features an offline-first architecture. You can continue processing transactions without internet access, and data automatically synchronizes when connection is restored."
    },
    {
      q: "How does multi-tenant branching work?",
      a: "Each business operates inside its own isolated database scope. You can manage multiple shops, assign distinct inventories, and track individual branch performance from a master admin account."
    },
    {
      q: "What payment methods are supported?",
      a: "MultiPOS supports Cash, Mobile Money (MoMo), Card payments, and Split payments seamlessly integrated with local and global payment gateways."
    },
    {
      q: "How do I migrate my existing product catalog?",
      a: "You can easily import your products, variants, and customer lists via CSV or connect directly through our developer API."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold tracking-widest uppercase text-blue-600 mb-3">FAQ</h2>
          <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Frequently asked questions
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left font-bold text-lg text-slate-900 flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openIndex === index ? "rotate-180" : ""}`} />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-200/60 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  const router = useRouter();

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-linear-to-br from-blue-900 to-indigo-900 text-white rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-xl border border-blue-950"
        >
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl max-w-2xl mx-auto leading-tight">
            Ready to Scale Your Retail Operations?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-blue-100 max-w-xl mx-auto">
            Join the high-growth businesses using MultiPOS to streamline checkout, inventory, and branch management.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              onClick={() => router.push("/signup")}
              size="lg"
              className="bg-white text-blue-900 hover:bg-blue-50 font-semibold shadow-md w-full sm:w-auto px-8 transition-colors duration-200"
            >
              Get Started Now
            </Button>
            <Button
              onClick={() => router.push("/contact")}
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white border border-white/20 w-full sm:w-auto px-8"
            >
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-white">MultiPOS</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The enterprise multi-tenant point-of-sale platform built for high-performance retail chains.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Product</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#showcase" className="hover:text-white transition-colors">Platform</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Resources</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/api" className="hover:text-white transition-colors">API Reference</Link></li>
              <li><Link href="/status" className="hover:text-white transition-colors">System Status</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors">Support Center</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Company</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Sales</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MultiPOS Inc. All rights reserved.</p>
          <p className="mt-4 sm:mt-0 font-mono">Designed for Enterprise Scale</p>
        </div>
      </div>
    </footer>
  );
}

export default function MultiPOSLandingPage({ currentSlug, isLoggedIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <Navbar currentSlug={currentSlug} isLoggedIn={isLoggedIn} />
      <Hero />
      <TrustedCompanies />
      <FeaturesGrid />
      <InteractiveShowcase />
      <Statistics />
      <Testimonials />
      <PricingPreview />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}