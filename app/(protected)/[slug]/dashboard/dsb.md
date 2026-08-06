"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useParams, useRouter } from "next/navigation";
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  Package, 
  Store, 
  AlertTriangle,
  ChevronDown,
  Loader2
} from "lucide-react";
import hasAccess from "@/lib/accessPermissionSecurity";

// Shadcn UI primitives
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Recharts layout engine primitives
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

// Shadcn charting runtime providers
import { 
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { useCustomerStore } from "@/store/customerStore";
import { useProductStore } from "@/store/productsStore";
import { useShopStore } from "@/store/shopStore";
import { useDashboardStore } from "@/store/analytics-dashbaords/business-dashboardStore";

// ============================================================================
// BRAND COLOR PALETTE CONFIGURATION
// ============================================================================
const BRAND_COLORS = {
  purple: "#6366f1",     // Sales line
  blue: "#3b82f6",       
  emerald: "#10b981",    
  amber: "#f59e0b",      
  gridLine: "#e2e8f0",   // Light grid line border
  textMuted: "#94a3b8"   // Axis label colors
};

const lineChartConfig = {
  sales: {
    label: "Sales Amount",
    color: BRAND_COLORS.purple,
  },
} satisfies ChartConfig;

const CATEGORY_COLORS = [BRAND_COLORS.purple, BRAND_COLORS.blue, BRAND_COLORS.emerald, BRAND_COLORS.amber];

// ============================================================================
// TOP LINE HERO CARD COMPONENT
// ============================================================================
type StatCardProps = {
  title: string;
  value: string;
  growth: string;
  timeline: string;
  icon: React.ReactNode;
  iconColor: string;
};

function TopStatCard({ title, value, growth, timeline, icon, iconColor }: StatCardProps) {
  const isPositive = growth.startsWith("+");
  return (
    <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconColor}`}>
            {icon}
          </div>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{value}</h3>
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <span className={`${isPositive ? "text-emerald-600" : "text-rose-600"} font-bold flex items-center gap-0.5`}>
            <TrendingUp className="w-3 h-3" /> {growth}
          </span>
          <span className="text-slate-400 font-medium">{timeline}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE CONTROLLER MODULE
// ============================================================================
export default function BusinessDashboard() {
  const { slug } = useParams();
  const { user, currentSlug } = useAuthStore();
  const router = useRouter();
  const [timeframe, setTimeframe] = useState("Daily");

  // Dashboard Store Hooks
  const { 
    metrics, 
    overview, 
    categorySales, 
    topProducts, 
    recentTransactions, 
    lowStockInventory, 
    isLoading, 
    fetchDashboardData 
  } = useDashboardStore();

  useEffect(() => {
    if (!hasAccess(user, "dashboard")) {
      router.push(`/${user?.business.slug}/dashboard`);
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.business?.id) {
      fetchDashboardData({preset: "last_month"});
    }
  }, [user?.business?.id, fetchDashboardData]);

  if (slug !== currentSlug) {
    router.push(`/${user?.business.slug}/dashboard`);
  }

  if (!user || !hasAccess(user, "dashboard")) return null;

  // Format dynamic line chart data
  const formattedOverviewData = useMemo(() => {
    if (!overview) return [];
    return overview.map((item) => ({
      name: item.date,
      sales: item.total,
    }));
  }, [overview]);

  // Format dynamic category donut data with persistent colors and fully dynamic config generation
  const formattedCategoryData = useMemo(() => {
    if (!categorySales) return [];
    return categorySales.map((cat, index) => ({
      name: cat.name,
      value: cat.total,
      fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [categorySales]);

  const dynamicPieChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    formattedCategoryData.forEach((cat, index) => {
      const key = cat.name.toLowerCase().replace(/\s+/g, "_");
      config[key] = {
        label: cat.name,
        color: cat.fill,
      };
    });
    return config;
  }, [formattedCategoryData]);

  const totalSalesAmount = metrics?.totalSales.amount || 0;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 text-slate-900 relative">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* 👤 APP PANEL HEADER BAR */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overviewing <span className="font-semibold text-indigo-600">{user?.business.name}</span> management metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-400 font-medium capitalize">{user?.role.name}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-900 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </header>

      {/* 🚀 HERO METRIC SUMMARY RAILS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <TopStatCard 
          title="Total Sales" 
          value={`₵${Number(metrics?.totalSales.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          growth={`${metrics?.totalSales.growth ?? 0 >= 0 ? "+" : ""}${metrics?.totalSales.growth ?? 0}%`} 
          timeline="vs previous period"
          icon={<DollarSign className="w-5 h-5" />} 
          iconColor="bg-indigo-50 text-indigo-600"
        />
        <TopStatCard 
          title="Total Orders" 
          value={String(metrics?.totalOrders.count || 0)} 
          growth={`${metrics?.totalOrders.growth ?? 0 >= 0 ? "+" : ""}${metrics?.totalOrders.growth ?? 0}%`} 
          timeline="vs previous period"
          icon={<ShoppingCart className="w-5 h-5" />} 
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <TopStatCard 
          title="New Customers" 
          value={String(metrics?.newCustomers.count || 0)} 
          growth={`${metrics?.newCustomers.growth ?? 0 >= 0 ? "+" : ""}${metrics?.newCustomers.growth ?? 0}%`} 
          timeline="vs previous period"
          icon={<Users className="w-5 h-5" />} 
          iconColor="bg-sky-50 text-sky-600"
        />
        <TopStatCard 
          title="Total Profit" 
          value={`₵${Number(metrics?.totalProfit.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          growth={`${metrics?.totalProfit.growth ?? 0 >= 0 ? "+" : ""}${metrics?.totalProfit.growth ?? 0}%`} 
          timeline="vs previous period"
          icon={<TrendingUp className="w-5 h-5" />} 
          iconColor="bg-purple-50 text-purple-600"
        />
      </div>

      {/* 📊 DATA GRAPH ARRAYS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* LINE RENDERING ELEMENT BLOCK */}
        <Card className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-sm text-slate-900">Sales Overview</h3>
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg border-slate-200 gap-1 font-semibold">
                {timeframe} <ChevronDown className="w-3 h-3 text-slate-400" />
              </Button>
            </div>

            <ChartContainer config={lineChartConfig} className="w-full h-72">
              <LineChart data={formattedOverviewData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BRAND_COLORS.gridLine} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} stroke={BRAND_COLORS.textMuted} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} stroke={BRAND_COLORS.textMuted} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke={BRAND_COLORS.purple} 
                  strokeWidth={2.5} 
                  dot={{ fill: BRAND_COLORS.purple, stroke: "#fff", strokeWidth: 1.5, r: 4 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* DONUT CATEGORY RENDERING PANEL */}
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900">Sales by Category</h3>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-indigo-600 hover:text-indigo-700">View Report</Button>
            </div>
            
            <div className="flex items-center justify-center h-48 relative">
              <ChartContainer config={dynamicPieChartConfig} className="w-full h-full">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={formattedCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {formattedCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-slate-900">
                  ₵{totalSalesAmount > 1000 ? `${(totalSalesAmount / 1000).toFixed(1)}K` : totalSalesAmount.toFixed(0)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Sales</span>
              </div>
            </div>

            {/* Micro Category Legends List */}
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {formattedCategoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                    <span className="text-slate-500 font-semibold">{cat.name}</span>
                  </div>
                  <span className="text-slate-900 font-bold">₵{cat.value.toLocaleString()}</span>
                </div>
              ))}
              {formattedCategoryData.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">No category data available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🗂️ TRANSACTIONAL FEED REGISTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        
        {/* PRODUCT FEED ROW */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-sm text-slate-900">Top Selling Products</h4>
              <Button variant="ghost" className="h-6 text-xs text-indigo-600 font-bold p-0">View All</Button>
            </div>
            <div className="space-y-4">
              {topProducts?.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{prod.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{prod.soldQty} Sold</p>
                    </div>
                  </div>
                  <span className="font-black text-slate-900">₵{Number(prod.revenue).toFixed(2)}</span>
                </div>
              ))}
              {(!topProducts || topProducts.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">No top products recorded.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LEDGER TRANSACTIONS AUDIT */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-sm text-slate-900">Recent Transactions</h4>
              <Button variant="ghost" className="h-6 text-xs text-indigo-600 font-bold p-0">View All</Button>
            </div>
            <div className="space-y-3">
              {recentTransactions?.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                  <div>
                    <p className="font-bold text-slate-900">{tx.customer?.name || "Walk-in Customer"}</p>
                    <p className="text-[10px] font-mono text-slate-400">{tx.invoice?.invoiceNumber || tx.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-bold text-slate-900">₵{Number(tx.totalAmount).toFixed(2)}</span>
                    <Badge variant="outline" className={`text-[10px] font-bold rounded-md px-1.5 py-0 ${
                      tx.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!recentTransactions || recentTransactions.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">No recent transactions.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CRITICAL LOW STOCK WARNING PANELS */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-sm text-slate-900">Low Stock Alerts</h4>
              <Button variant="ghost" className="h-6 text-xs text-indigo-600 font-bold p-0">View All</Button>
            </div>
            <div className="space-y-4">
              {lowStockInventory?.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{alert.variant?.product?.name || "Product Item"}</p>
                      <p className="text-[10px] font-bold text-slate-400">Current Stock: <span className="text-rose-600 font-extrabold">{alert.stock}</span></p>
                    </div>
                  </div>
                  <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 text-[10px] font-bold border border-rose-100 rounded-md">
                    Low Stock
                  </Badge>
                </div>
              ))}
              {(!lowStockInventory || lowStockInventory.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">No low stock warnings.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🏢 BOTTOM THREE-WAY HUB LINK BAR */}
      <BottomLinks/>
    </div>
  );
}

function BottomLinks () {
    const { customers, fetchCustomers } = useCustomerStore();
    const {products, fetchProducts} = useProductStore();
    const {shops, fetchShops} = useShopStore()
    const { slug } = useParams();
    const { user, currentSlug } = useAuthStore();
    const router = useRouter();
 
    // Fetching Data
    useEffect(() => {
      fetchCustomers();
      fetchProducts();
      fetchShops();
    }, [fetchCustomers, fetchProducts, fetchShops]);
 
    // Stats calculated from REAL database data
    const stats = useMemo(() => {
      const customerList = customers || [];
      const productList = products || [];
      const shopList = shops || [];
      if (slug !== currentSlug) {
          router.push(`/${user?.business.slug}/dashboard`);
        }
      
      const totalCustomers = customerList.length;
      const totalProducts = productList.length;
      const totalShops = shopList.length;
     
      return [
        { label: "Total Customers", value: totalCustomers, linkIcon: ArrowUpRight, color: "text-blue-600", icon: <Users className="w-5 h-5" />, linkPath: `/${slug}/customers/customer-base` },
        { label: "Total Products", value: totalProducts, linkIcon: ArrowUpRight, color: "text-emerald-600", icon: <Package className="w-5 h-5" />,linkPath: `/${slug}/products/product-list`},
        { label: "Total Outlets", value: totalShops, linkIcon: ArrowUpRight, color: "text-sky-600", icon: <Store className="w-5 h-5" /> , linkPath: `/${slug}/shops`}
      ];
    }, [currentSlug, customers, products, router, shops, slug, user?.business.slug]);
    
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {stats.map((stat, idx) => (
        <Card key={idx} className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-slate-50 border border-slate-100 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
                <span className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 rounded-xl" onClick={() => router.push(stat.linkPath)}>
              <stat.linkIcon className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}