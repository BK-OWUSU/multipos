"use client"
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, ShoppingCart, Users, Settings, CreditCard, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LandingPageNavBar from "./landing-nav";
import { useAuthStore } from "@/store/useAuthStore";
import { footerSections } from "./footerSections";

export default function LandingPage() {
  const { currentSlug } = useAuthStore();
  const sectionFooter = footerSections(currentSlug || "");
  
  const features = [
    {
      icon: <ShoppingCart className="w-5 h-5 text-blue-600" />,
      title: "Point of Sale",
      description: "Fast and intuitive checkout system with multiple payment options for rapid retail storefront lanes."
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      title: "Advanced Reports",
      description: "Real-time business analytics and sales insights generated dynamically by category, branch location, and staff."
    },
    {
      icon: <Users className="w-5 h-5 text-blue-600" />,
      title: "Employee Management",
      description: "Track employee shift performance parameters, automated physical shop time cards, and collective hours logged."
    },
    {
      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
      title: "Payment Processing",
      description: "Secure, optimized global transaction pipelines supporting multi-channel local checkout options."
    },
    {
      icon: <Settings className="w-5 h-5 text-blue-600" />,
      title: "Inventory Control",
      description: "Real-time stock adjustment tracking, granular variant categorization, and instant system quantity logs."
    },
    {
      icon: <Zap className="w-5 h-5 text-blue-600" />,
      title: "Fast & Reliable",
      description: "High-performance infrastructure engineered for intense multi-terminal concurrent transactions."
    }
  ];

  return (
    <div className="w-full bg-white antialiased selection:bg-blue-600 selection:text-white">
      <LandingPageNavBar />
      
      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-900 pt-32 pb-24 lg:pt-40 lg:pb-36 flex items-center">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          <div className="space-y-6 lg:col-span-7 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-full text-xs font-semibold text-blue-400 tracking-wide backdrop-blur-xs">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              All-In-One Enterprise Platform
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Revolutionize Your <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-300 bg-clip-text text-transparent">
                Point of Sale
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              MultiPOS provides structured operations, deep data reporting analytics, and instantaneous multi-terminal management infrastructure contextually customized for modern, fast-scaling retail operations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link 
                href="/login"
                className="inline-flex items-center justify-center px-6 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md shadow-blue-900/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started <ArrowRight className="ml-2 w-4 h-4 shrink-0" />
              </Link>
              <Link 
                href={currentSlug ? `/${currentSlug}/dashboard` : `/login`}
                className="inline-flex items-center justify-center px-6 h-12 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-200 rounded-lg font-bold text-sm backdrop-blur-xs hover:-translate-y-0.5 transition-all duration-200"
              >
                View Live Dashboard
              </Link>
            </div>
          </div>
          
          {/* Dynamic Image Wrapper Container */}
          <div className="lg:col-span-5 relative w-full aspect-square max-w-[480px] lg:max-w-none mx-auto lg:ml-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-2xl blur-lg pointer-events-none" />
            <div className="w-full h-full border border-slate-700/50 p-2.5 bg-slate-800/40 rounded-2xl backdrop-blur-md shadow-2xl">
              <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-900">
                <Image
                  src="/pos-1.jpg"
                  alt="MultiPOS Application Operations View Layout"
                  fill
                  className="object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE GRID PLATFORM FEATURES ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Engineered for Complete Control
            </h2>
            <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed">
              Everything required to run, balance, and scale your global storefront retail operations efficiently from a singular database backend.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/80 group transition-all duration-300 rounded-xl overflow-hidden flex flex-col">
                <CardHeader className="p-6 pb-2 space-y-4">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors duration-300">
                    <span className="group-hover:text-white transition-colors duration-300">
                      {feature.icon}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-grow">
                  <CardDescription className="text-slate-500 font-medium leading-relaxed text-xs sm:text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTEXT SHOWCASE ROW SECTION ────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Image Component Layer */}
            <div className="lg:col-span-5 relative w-full aspect-square max-w-[450px] lg:max-w-none mx-auto">
              <div className="absolute inset-0 bg-slate-200/60 rounded-2xl transform rotate-2 scale-95 pointer-events-none" />
              <div className="w-full h-full border border-slate-100 p-2 bg-slate-50/50 rounded-2xl shadow-xl relative z-10">
                <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src="/pos-2.jpeg"
                    alt="MultiPOS Live Multi-tenant Infrastructure Metrics Summary Display"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
            
            {/* Right Informational Stack Component */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Unified System Management
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Eliminate isolated operating data sheets. MultiPOS binds tracking data pools straight into live dashboard workflows seamlessly.
                </p>
              </div>

              <div className="space-y-5">
                {[
                  { title: "Smart Transactions", desc: "Process point-of-sale customer receipts with live inventory updating." },
                  { title: "Real-time Analytics", desc: "Track macro sales performance distributions across custom date frames and categories." },
                  { title: "Team Coordination Logs", desc: "Enforce accountability constraints with access controls and integrated time-cards." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 text-blue-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">{item.title}</h3>
                      <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-2">
                <Link 
                  href="/sale"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-bold text-sm gap-1 group"
                >
                  Explore Complete Capabilities 
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── METRICS COUNTERS RIBBON ─────────────────────────────────────── */}
      <section className="py-16 px-6 bg-blue-600 text-white relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 text-center">
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">500+</div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-100">Active Retailers</p>
            </div>
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">1M+</div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-100">Daily Operations Logged</p>
            </div>
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">99.9%</div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-100">System Core Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION SECTION ──────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15]">
            Ready to Transform Your <br />Retail Business Architecture?
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Empower your team, protect store inventory assets, and extract deep financial clarity today with MultiPOS tools.
          </p>
          <div className="pt-4">
            <Link 
              href={currentSlug ? `/${currentSlug}/dashboard` : `/login`}
              className="inline-flex items-center px-8 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-base shadow-lg shadow-blue-900/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Your Operational Account <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER BLOCK (NAVBAR & FOOTER RETAINED UNCHANGED) ───────────── */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 border-t border-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h4 className="font-bold text-white text-lg">MultiPOS</h4>
              <p className="text-sm leading-relaxed">
                The complete point-of-sale solution for modern retail and business management.
              </p>
            </div>

            {sectionFooter.map((section) => (
              <div key={section.title}>
                <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">
                  {section.title}
                </h4>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.isExternal ? (
                        <a 
                          href={link.href} 
                          className="hover:text-white transition-colors duration-200"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link 
                          href={link.href} 
                          className="hover:text-white transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-900 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} MultiPOS. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Status</a>
              <a href="#" className="hover:text-white">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}