"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useParams, useRouter } from "next/navigation";
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Package, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Store
} from "lucide-react";
import hasAccess from "@/lib/accessPermissionSecurity";

// Shadcn Custom UI Primitives
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Recharts Graphing Infrastructure 
import { 
  ResponsiveContainer,
  AreaChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

// ============================================================================
// BRAND DESIGN TOKENS (Sourced from image_b279cc.jpg)
// ============================================================================
const VISUAL_TOKENS = {
  salesFill: "rgba(59, 130, 246, 0.08)",
  salesLine: "#3b82f6",     // Royal Blue Accent
  txLine: "#10b981",        // Emerald Green Dash
  gridBorder: "#f1f5f9",    // Slate 100 Divider
  textMuted: "#94a3b8"       // Slate 400 Labels
};

// ============================================================================
// DATA FEEDS
// ============================================================================
const HOURLY_SALES_DATA = [
  { time: "12 AM", sales: 100, tx: 5 },
  { time: "4 AM", sales: 1200, tx: 28 },
  { time: "8 AM", sales: 2400, tx: 55 },
  { time: "12 PM", sales: 3200, tx: 78 },
  { time: "4 PM", sales: 4100, tx: 92 },
  { time: "8 PM", sales: 1800, tx: 40 },
  { time: "12 AM", sales: 200, tx: 8 },
];

const TOP_PRODUCTS = [
  { rank: 1, name: "Coca Cola 500ml", qty: 32, sales: "₵240.00", emoji: "🥤" },
  { rank: 2, name: "FanIce 500ml", qty: 28, sales: "₵196.00", emoji: "🍦" },
  { rank: 3, name: "Voltic Water 500ml", qty: 25, sales: "₵125.00", emoji: "💧" },
  { rank: 4, name: "Indomie Chicken", qty: 20, sales: "₵200.00", emoji: "🍜" },
  { rank: 5, name: "Milo Sachet", qty: 18, sales: "₵90.00", emoji: "☕" },
];

const RECENT_SALES = [
  { id: "INV-00128", time: "11:45 AM", amount: "₵45.00" },
  { id: "INV-00127", time: "11:30 AM", amount: "₵23.00" },
  { id: "INV-00126", time: "11:15 AM", amount: "₵67.00" },
  { id: "INV-00125", time: "11:00 AM", amount: "₵12.00" },
  { id: "INV-00124", time: "10:45 AM", amount: "₵34.00" },
];

// ============================================================================
// REUSABLE SUB-COMPONENTS
// ============================================================================
type UpperCardProps = {
  title: string;
  value: string;
  growth: string;
  icon: React.ReactNode;
  bgTone: string;
};

function MicroMetricCard({ title, value, growth, icon, bgTone }: UpperCardProps) {
  return (
    <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50/60 px-2 py-0.5 rounded-md w-max">
            <TrendingUp className="w-3 h-3" /> {growth} <span className="text-slate-400 font-medium">vs Yesterday</span>
          </div>
        </div>
        <div className={`p-3.5 rounded-2xl ${bgTone} shrink-0`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CORE CONTROLLER MODULE
// ============================================================================
export default function ShopDashboard() {
  const { slug } = useParams();
  const { user, currentSlug } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasAccess(user, "dashboard")) {
      router.push(`/${user?.business.slug}/dashboard`);
    }
  }, [user, router]);

  if (slug !== currentSlug) {
    router.push(`/${user?.business.slug}/dashboard`);
  }

  if (!user || !hasAccess(user, "dashboard")) return null;

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 lg:p-8 text-slate-900 font-sans antialiased">
      
      {/* 💳 MODULE TOP NAVIGATION HEADER */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Welcome back, {user?.firstName}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            Here&apos;s what&apos;s happening in your shop today.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700 font-semibold rounded-xl text-xs h-10 gap-2 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Today, May 18, 2025 <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </Button>
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-bold shadow-md">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </header>

      {/* 🚀 QUICK HERO METRIC SUMMARY RAILS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MicroMetricCard 
          title="Total Sales" 
          value="₵4,250.00" 
          growth="12.5%" 
          icon={<CreditCard className="w-5 h-5 text-blue-600" />} 
          bgTone="bg-blue-50/80" 
        />
        <MicroMetricCard 
          title="Transactions" 
          value="128" 
          growth="8.2%" 
          icon={<ShoppingCart className="w-5 h-5 text-indigo-600" />} 
          bgTone="bg-indigo-50/80" 
        />
        <MicroMetricCard 
          title="Average Sale" 
          value="₵33.20" 
          growth="4.1%" 
          icon={<Sparkles className="w-5 h-5 text-purple-600" />} 
          bgTone="bg-purple-50/80" 
        />
        <MicroMetricCard 
          title="Items Sold" 
          value="236" 
          growth="10.3%" 
          icon={<Package className="w-5 h-5 text-amber-600" />} 
          bgTone="bg-amber-50/80" 
        />
        <MicroMetricCard 
          title="Gross Profit" 
          value="₵1,680.00" 
          growth="11.6%" 
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} 
          bgTone="bg-emerald-50/80" 
        />
      </div>

      {/* 📊 CORE VISUAL GRAPH RAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* GRAPH ENGINE DISPLAY CARD */}
        <Card className="lg:col-span-7 rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Sales Overview</h3>
                <div className="flex items-center gap-4 mt-2 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" /> Sales (₵)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2.5 h-1 block border-t-2 border-dashed border-emerald-500" /> Transactions
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg border-slate-200 gap-1">
                Today <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>

            <div className="w-full h-64 text-xs font-medium">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY_SALES_DATA} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={VISUAL_TOKENS.salesLine} stopOpacity={0.12}/>
                      <stop offset="95%" stopColor={VISUAL_TOKENS.salesLine} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={VISUAL_TOKENS.gridBorder} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} stroke={VISUAL_TOKENS.textMuted} tickMargin={10} />
                  <YAxis yAxisId="left" orientation="left" tickLine={false} axisLine={false} stroke={VISUAL_TOKENS.textMuted} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} stroke={VISUAL_TOKENS.textMuted} />
                  <Tooltip />
                  
                  {/* Sales Gradient Fill & Primary Path */}
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="sales" 
                    stroke={VISUAL_TOKENS.salesLine} 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#salesGrad)" 
                  />
                  {/* Secondary Dashed Count Line */}
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tx" 
                    stroke={VISUAL_TOKENS.txLine} 
                    strokeDasharray="4 4" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* FEED: TOP SELLING INVENTORY PRODUCTS */}
        <Card className="lg:col-span-5 rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900">Top Selling Products</h3>
              <Button variant="ghost" className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 p-0">View All</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-semibold">#</th>
                    <th className="pb-2 font-semibold">Product</th>
                    <th className="pb-2 font-semibold text-right">Qty Sold</th>
                    <th className="pb-2 font-semibold text-right">Sales (₵)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {TOP_PRODUCTS.map((prod) => (
                    <tr key={prod.rank} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-400">{prod.rank}</td>
                      <td className="py-3 font-semibold text-slate-800">
                        <span className="mr-2 inline-block text-base">{prod.emoji}</span>
                        {prod.name}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-600">{prod.qty}</td>
                      <td className="py-3 text-right font-black text-slate-900">{prod.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🛠️ BASE LOWER WORKFLOW CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD: CASH REGISTER CONTROL PANEL */}
        <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-sm flex flex-col justify-between">
          <CardContent className="p-5 space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Cash Register Status</h4>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold border border-emerald-100 rounded-md">Open</Badge>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opened By</p>
                  <p className="font-bold text-slate-800">Kwadwo Mensah</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opened At</p>
                  <p className="font-bold text-slate-800">8:00 AM</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opening Float</p>
                  <p className="font-black text-slate-900">₵200.00</p>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl">
            <Button size="sm" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs h-9 rounded-xl shadow-none">
              View Cash Register
            </Button>
          </div>
        </Card>

        {/* CARD: INVENTORY HEALTH MONITOR */}
        <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Inventory Summary</h4>
              <Button variant="ghost" className="h-6 text-[11px] font-bold text-blue-600 p-0">View All</Button>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" /> Total Products
                </span>
                <span className="font-black text-slate-900 text-sm">1,245</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Items
                </span>
                <span className="font-black text-amber-600 text-sm">18</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Out of Stock Items
                </span>
                <span className="font-black text-rose-600 text-sm">4</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-slate-500 font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Stock Value
                </span>
                <span className="font-black text-slate-900 text-sm">₵28,450.00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD: LIVE LEDGER AUDIT LOG */}
        <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Recent Sales</h4>
              <Button variant="ghost" className="h-6 text-[11px] font-bold text-blue-600 p-0">View All</Button>
            </div>
            
            <div className="space-y-3">
              {RECENT_SALES.map((sale, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-slate-50/40 p-2 rounded-xl border border-slate-100/50">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">{sale.time}</span>
                    <span className="font-mono font-bold text-blue-600 hover:underline cursor-pointer">{sale.id}</span>
                  </div>
                  <span className="font-black text-slate-900">{sale.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CARD: SHOP METADATA INFORMATION */}
        <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Shop Information</h4>
              <Button variant="ghost" className="h-6 text-[11px] font-bold text-blue-600 p-0 flex items-center gap-1">
                Edit Outlets
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                  <p className="font-semibold text-slate-700">45 Anumansa Street, East Legon</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                  <p className="font-semibold text-slate-700">+233 20 987 6543</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                  <p className="font-semibold text-slate-700 truncate max-w-[180px]">mainbranch@kingzmen.com</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opening Hours</p>
                  <p className="font-semibold text-slate-700">8:00 AM - 10:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 🏢 STICKY APPS METADATA FOOTER FRAME */}
      <footer className="mt-12 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-bold text-slate-400 tracking-tight">
        <p>© 2025 MultiPOS. All rights reserved.</p>
        <p className="font-mono uppercase">MultiPOS v1.0.0</p>
      </footer>

    </div>
  );
}