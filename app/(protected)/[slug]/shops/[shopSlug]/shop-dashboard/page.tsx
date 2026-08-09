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
  Sparkles,
  Loader2,
  MoreHorizontal,
  ArrowUpDown,
  SlidersHorizontal
} from "lucide-react";
import hasAccess from "@/lib/accessPermissionSecurity";

// Shadcn Custom UI Primitives
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

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
import { useShopDashboardStore } from "@/store/analytics-dashbaords/shop-dashboardStore";
import AppLoader from "@/components/loaders/app-loader";
import { DateFilterPreset } from "@/lib/services/analytics_dashboards/shop-dashbaord.service";

// ============================================================================
// BRAND DESIGN TOKENS
// ============================================================================
const VISUAL_TOKENS = {
  salesFill: "rgba(59, 130, 246, 0.08)",
  salesLine: "#3b82f6",    // Royal Blue Accent
  txLine: "#10b981",        // Emerald Green Dash
  gridBorder: "#f1f5f9",    // Slate 100 Divider
  textMuted: "#94a3b8"       // Slate 400 Labels
};

// ============================================================================
// REUSABLE SUB-COMPONENTS
// ============================================================================
type UpperCardProps = {
  title: string;
  value: string | number;
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
  // Zustand Store Integration
  const { user, currentSlug } = useAuthStore();
  const {metrics,salesOverview,topSellingProducts,cashRegister,inventory,recentSales,shopInfo,isLoading,fetchDashboardData} = useShopDashboardStore();
  const { slug } = useParams();
  const router = useRouter();
  
  const [selectedFilter, setSelectedFilter] = React.useState<DateFilterPreset>("daily");
  const [startDate, setCustomStartDate] = React.useState<string | Date | undefined>(undefined);
const [endDate, setCustomEndDate] = React.useState<string | Date | undefined>(undefined);

  useEffect(() => {
    if (!hasAccess(user, "dashboard")) {
      router.push(`/${user?.business.slug}/dashboard`);
    }
  }, [user, router]);

useEffect(() => {
  if (user?.currentShop?.id) {
    fetchDashboardData({ 
      shopId: user.currentShop.id, 
      filter: selectedFilter,
      startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate: endDate instanceof Date ? endDate.toISOString() : endDate
    });
  }
}, [user, selectedFilter, fetchDashboardData, startDate, endDate]);

  if (slug !== currentSlug) {
    router.push(`/${user?.business.slug}/dashboard`);
  }

  if (!user || !hasAccess(user, "dashboard")) return null;

  // Show loading spinner while fetching dashboard payload if desired
  if (isLoading && !metrics) {
    return (
      <AppLoader/>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 lg:p-8 text-slate-900 font-sans antialiased">
      
{/* 💳 MODULE TOP NAVIGATION HEADER */}
<header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
      Welcome back, {user?.firstName}! <span className="animate-bounce">👋</span>
    </h1>
    <p className="text-sm font-medium text-slate-400 mt-0.5">
      Here&apos;s what&apos;s happening in your shop today. {shopInfo?.name ? `(${shopInfo.name})` : ""}
    </p>
  </div>

  <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
    {/* Conditional Custom Date Inputs */}
    {selectedFilter === "custom" && (
      <div className="flex items-center gap-2 animate-in fade-in duration-200">
        <input 
          type="date" 
          className="h-8 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          value={startDate ? (typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0]) : ''}
          onChange={(e) => setCustomStartDate(e.target.value)}
        />
        <span className="text-xs text-slate-400">to</span>
        <input 
          type="date" 
          className="h-8 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          value={endDate ? (typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0]) : ''}
          onChange={(e) => setCustomEndDate(e.target.value)}
        />
      </div>
    )}

    {/* Dropdown Menu */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg border-slate-200 gap-1">
          {selectedFilter === "daily" && "Today"}
          {selectedFilter === "current_week" && "This Week"}
          {selectedFilter === "current_month" && "This Month"}
          {selectedFilter === "last_month" && "Last Month"}
          {selectedFilter === "custom" && "Custom Range"}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-xl">
        <DropdownMenuItem 
          className="text-xs font-semibold" 
          onClick={() => {
            setSelectedFilter("daily");
            setCustomStartDate(undefined);
            setCustomEndDate(undefined);
          }}
        >
          Today
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-xs font-semibold" 
          onClick={() => {
            setSelectedFilter("current_week");
            setCustomStartDate(undefined);
            setCustomEndDate(undefined);
          }}
        >
          This Week
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-xs font-semibold" 
          onClick={() => {
            setSelectedFilter("current_month");
            setCustomStartDate(undefined);
            setCustomEndDate(undefined);
          }}
        >
          This Month
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-xs font-semibold" 
          onClick={() => {
            setSelectedFilter("last_month");
            setCustomStartDate(undefined);
            setCustomEndDate(undefined);
          }}
        >
          Last Month
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-xs font-semibold" 
          onClick={() => {
            setSelectedFilter("custom");
          }}
        >
          Custom
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-bold shadow-md">
      {user?.firstName?.[0]}{user?.lastName?.[0]}
    </div>
  </div>
</header>

    {/* 🚀 QUICK HERO METRIC SUMMARY RAILS */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <MicroMetricCard 
        title="Total Sales" 
        value={`₵${metrics?.totalSales?.toFixed(2) ?? "0.00"}`} 
        growth="--%" 
        icon={<CreditCard className="w-5 h-5 text-blue-600" />} 
        bgTone="bg-blue-50/80" 
      />
      <MicroMetricCard 
        title="Transactions" 
        value={String(metrics?.transactionsCount ?? 0)} 
        growth="--%" 
        icon={<ShoppingCart className="w-5 h-5 text-indigo-600" />} 
        bgTone="bg-indigo-50/80" 
      />
      <MicroMetricCard 
        title="Average Sale" 
        value={`₵${metrics?.averageSale?.toFixed(2) ?? "0.00"}`} 
        growth="--%" 
        icon={<Sparkles className="w-5 h-5 text-purple-600" />} 
        bgTone="bg-purple-50/80" 
      />
      <MicroMetricCard 
        title="Items Sold" 
        value={String(metrics?.itemsSold ?? 0)} 
        growth="--%" 
        icon={<Package className="w-5 h-5 text-amber-600" />} 
        bgTone="bg-amber-50/80" 
      />
      <MicroMetricCard 
        title="Gross Profit" 
        value={`₵${metrics?.grossProfit?.toFixed(2) ?? "0.00"}`} 
        growth="--%" 
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg border-slate-200 gap-1">
                  {selectedFilter === "daily" && "Today"}
                  {selectedFilter === "current_week" && "This Week"}
                  {selectedFilter === "current_month" && "This Month"}
                  {selectedFilter === "last_month" && "Last Month"}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-xl">
                <DropdownMenuItem className="text-xs font-semibold" onClick={() => setSelectedFilter("daily")}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs font-semibold" onClick={() => setSelectedFilter("current_week")}>
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs font-semibold" onClick={() => setSelectedFilter("current_month")}>
                  This Month
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs font-semibold" onClick={() => setSelectedFilter("last_month")}>
                  Last Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>

            <div className="w-full h-64 text-xs font-medium">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={
                      Array.isArray(salesOverview) 
                        ? salesOverview 
                        : Object.entries(salesOverview ?? {}).map(([time, val]) => {
                            const record = val as { sales: number; transactions: number };
                            return {
                              time,
                              sales: record.sales,
                              tx: record.transactions
                            };
                          })
                    } 
                    margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                  >
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

        {/* FEED: TOP SELLING INVENTORY PRODUCTS (Using Shadcn Table) */}
        <Card className="lg:col-span-5 rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900">Top Selling Products</h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem className="text-xs font-semibold gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Sort by Qty
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs font-semibold gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Sort by Amount
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs font-semibold text-blue-600">View All</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="pb-2 font-semibold w-10">#</TableHead>
                    <TableHead className="pb-2 font-semibold">Product</TableHead>
                    <TableHead className="pb-2 font-semibold text-right">Qty Sold</TableHead>
                    <TableHead className="pb-2 font-semibold text-right">Sales (₵)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50 text-xs">
                 {topSellingProducts?.map((prod, index) => (
                    <TableRow key={prod.id} className="hover:bg-slate-50/50 border-none">
                      <TableCell className="py-3 font-bold text-slate-400">{index + 1}</TableCell>
                      <TableCell className="py-3 font-semibold text-slate-800">
                        <span className="mr-2 inline-block text-base">📦</span>
                        {prod.productName}
                      </TableCell>
                      <TableCell className="py-3 text-right font-bold text-slate-600">{prod.qtySold}</TableCell>
                      <TableCell className="py-3 text-right font-black text-slate-900">₵{prod.salesAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {(!topSellingProducts || topSellingProducts.length === 0) && (
                    <TableRow className="border-none">
                      <TableCell colSpan={4} className="py-6 text-center text-slate-400 font-medium">No sales recorded yet today.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
              <Badge className={`text-[10px] font-bold border rounded-md ${cashRegister?.status === "OPEN" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                {cashRegister?.status === "OPEN" ? "Open" : "Closed"}
              </Badge>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opened By</p>
                  <p className="font-bold text-slate-800">{cashRegister?.openedBy ?? "N/A"}</p>
                </div>
              </div>

             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opened At</p>
                  <p className="font-bold text-slate-800">
                    {cashRegister?.openedAt ? new Date(cashRegister.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                  </p>
                </div>
             </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opening Float</p>
                  <p className="font-black text-slate-900">{cashRegister?.openingFloat ?? "₵0.00"}</p>
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl">
                  <DropdownMenuItem className="text-xs font-semibold">Generate Report</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs font-semibold text-blue-600">View All</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" /> Total Products
                </span>
                <span className="font-black text-slate-900 text-sm">{inventory?.totalProducts ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Items
                </span>
                <span className="font-black text-amber-600 text-sm">{inventory?.lowStockItems ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Out of Stock Items
                </span>
                <span className="font-black text-rose-600 text-sm">{inventory?.outOfStockItems ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-slate-500 font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Stock Value
                </span>
                <span className="font-black text-slate-900 text-sm">{inventory?.stockValue ?? "₵0.00"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD: LIVE LEDGER AUDIT LOG */}
        <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Recent Sales</h4>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl">
                  <DropdownMenuItem className="text-xs font-semibold">Export Audit Log</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs font-semibold text-blue-600">View All</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-3">
              {recentSales?.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between text-xs bg-slate-50/40 p-2 rounded-xl border border-slate-100/50">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-mono font-bold text-blue-600 hover:underline cursor-pointer">{sale.invoiceNumber}</span>
                  </div>
                  <span className="font-black text-slate-900">₵{sale.amount.toFixed(2)}</span>
                </div>
              ))}
              {(!recentSales || recentSales.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">No recent transactions.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CARD: SHOP METADATA INFORMATION */}
        <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Shop Information</h4>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-6 text-[11px] font-bold text-blue-600 p-0 flex items-center gap-1 hover:bg-transparent">
                    Edit Outlets <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem className="text-xs font-semibold">Manage Locations</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs font-semibold">Switch Outlet</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                  <p className="font-semibold text-slate-700">{shopInfo?.address ?? "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                  <p className="font-semibold text-slate-700">{shopInfo?.phone ?? "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                  <p className="font-semibold text-slate-700 truncate max-w-[180px]">{shopInfo?.email ?? "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opening Hours</p>
                  <p className="font-semibold text-slate-700">{shopInfo?.openingHours ?? "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 🏢 STICKY APPS METADATA FOOTER FRAME */}
      <footer className="mt-12 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-bold text-slate-400 tracking-tight">
        <p>© 2026 MultiPOS. All rights reserved.</p>
        <p className="font-mono uppercase">MultiPOS v1.0.0</p>
      </footer>

    </div>
  );
}