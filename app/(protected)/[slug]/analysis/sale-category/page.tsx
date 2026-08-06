"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, ShoppingBag, BarChart3, RefreshCcw, 
  Download, Calendar, Filter, RotateCcw, ArrowUpRight, 
  ArrowRight, Sparkles, Heart, Milk, Cookie, Home, Package, ChevronLeft, ChevronRight 
} from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock data for Sales by Category Donut Chart & Table breakdown
const salesByCategoryData = [
  { name: "Beverages", value: 45780, percentage: "36.7%", color: "#2563eb", transactions: 458, aov: 22.35, itemsSold: 1256, refunds: 120.00, growth: "+11.2%" },
  { name: "Groceries", value: 23460, percentage: "18.8%", color: "#10b981", transactions: 312, aov: 18.65, itemsSold: 892, refunds: 60.00, growth: "+8.6%" },
  { name: "Snacks", value: 18350, percentage: "14.7%", color: "#f59e0b", transactions: 265, aov: 19.43, itemsSold: 742, refunds: 40.00, growth: "+14.7%" },
  { name: "Household", value: 14620, percentage: "11.7%", color: "#8b5cf6", transactions: 198, aov: 19.11, itemsSold: 623, refunds: 50.00, growth: "+9.3%" },
  { name: "Personal Care", value: 10840, percentage: "8.7%", color: "#06b6d4", transactions: 154, aov: 18.70, itemsSold: 432, refunds: 30.00, growth: "+24.8%" },
  { name: "Dairy & Eggs", value: 7280, percentage: "5.8%", color: "#eab308", transactions: 110, aov: 16.61, itemsSold: 310, refunds: 15.00, growth: "+18.4%" },
  { name: "Health & Beauty", value: 3670, percentage: "2.9%", color: "#ec4899", transactions: 58, aov: 21.50, itemsSold: 145, refunds: 10.00, growth: "+22.6%" },
  { name: "Others", value: 690, percentage: "0.6%", color: "#94a3b8", transactions: 15, aov: 15.00, itemsSold: 45, refunds: 5.00, growth: "+4.1%" },
];

export default function SalesByCategoryView() {
  const [dateRange] = useState("May 1, 2026 - May 27, 2026");
  const [chartMode, setChartMode] = useState<"sales" | "transactions">("sales");
  const [growthMode, setGrowthMode] = useState<"sales" | "transactions">("sales");

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      
      {/* 1. Header & Actions Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sale By Category</h1>
          <p className="text-sm text-slate-500">
            Analyse sales performance by product categories across all shops.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-slate-200 text-slate-700 bg-white shadow-xs">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button variant="outline" className="gap-2 border-slate-200 text-slate-700 bg-white shadow-xs">
            <Calendar className="h-4 w-4" /> Schedule Report
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Sales</p>
              <h3 className="text-2xl font-bold text-slate-900"><CurrencyFormatter amount={124680} /></h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +12.5% vs May 1 - May 27
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Transactions</p>
              <h3 className="text-2xl font-bold text-slate-900">1,248</h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +8.2% vs May 1 - May 27
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Order Value</p>
              <h3 className="text-2xl font-bold text-slate-900"><CurrencyFormatter amount={19.78} /></h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +5.6% vs May 1 - May 27
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Items Sold</p>
              <h3 className="text-2xl font-bold text-slate-900">3,486</h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +10.4% vs May 1 - May 27
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Refunds</p>
              <h3 className="text-2xl font-bold text-slate-900"><CurrencyFormatter amount={320.00} /></h3>
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                -2.4% vs May 1 - May 27
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <RefreshCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filter Toolbar Section */}
      <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-center">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Date Range</label>
            <div className="text-sm font-medium border border-slate-200 rounded-lg p-2 bg-white flex items-center justify-between text-slate-700">
              <span className="truncate">{dateRange}</span>
              <Calendar className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Compare With</label>
            <div className="text-sm font-medium border border-slate-200 rounded-lg p-2 bg-white flex items-center justify-between text-slate-700">
              <span className="truncate">Apr 1, 2026 - Apr 27, 2026</span>
              <Calendar className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Group By</label>
            <select className="text-sm font-medium border border-slate-200 rounded-lg p-2 bg-white w-full text-slate-700 outline-none">
              <option>Category</option>
              <option>Daily</option>
              <option>Weekly</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Shop</label>
            <select className="text-sm font-medium border border-slate-200 rounded-lg p-2 bg-white w-full text-slate-700 outline-none">
              <option>All Shops</option>
              <option>Accra Mall Branch</option>
              <option>West Hills Branch</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">&nbsp;</label>
            <Button variant="outline" className="w-full border-slate-200 text-slate-700 shadow-xs">
              <Filter className="h-4 w-4 mr-2" /> More Filters
            </Button>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">&nbsp;</label>
            <Button variant="ghost" className="w-full text-slate-600 hover:bg-slate-100">
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Middle Section: Donut Chart + Breakdown List & Growth Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Sales by Category (Donut + Compact List) */}
        <Card className="lg:col-span-7 border-slate-200/80 shadow-xs rounded-xl bg-white flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Sales by Category</CardTitle>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
              <button 
                onClick={() => setChartMode("sales")}
                className={`px-3 py-1 rounded-md transition-all ${chartMode === "sales" ? "bg-white text-slate-900 shadow-xs font-semibold" : "hover:text-slate-900"}`}
              >
                By Sales
              </button>
              <button 
                onClick={() => setChartMode("transactions")}
                className={`px-3 py-1 rounded-md transition-all ${chartMode === "transactions" ? "bg-white text-slate-900 shadow-xs font-semibold" : "hover:text-slate-900"}`}
              >
                By Transactions
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Donut Chart */}
              <div className="md:col-span-5 h-52 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey={chartMode === "sales" ? "value" : "transactions"}
                    >
                      {salesByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center absolute pointer-events-none">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Sales</span>
                  <span className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={124680} /></span>
                </div>
              </div>

              {/* Compact Mini Table List */}
              <div className="md:col-span-7 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-2 font-medium">Category</th>
                      <th className="py-2 px-2 font-medium text-right">Total Sales</th>
                      <th className="py-2 px-2 font-medium text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salesByCategoryData.slice(0, 6).map((cat, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-slate-700 font-medium truncate max-w-[100px]">{cat.name}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-slate-900"><CurrencyFormatter amount={cat.value} /></td>
                        <td className="py-2 px-2 text-right text-slate-400">{cat.percentage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-100">
            <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View Category Performance Over Time <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

        {/* Right Side: Top Categories by Growth */}
        <Card className="lg:col-span-5 border-slate-200/80 shadow-xs rounded-xl bg-white flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Top Categories by Growth</CardTitle>
            <select 
              value={growthMode}
              onChange={(e) => setGrowthMode(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-600 outline-none"
            >
              <option value="sales">By Sales Growth</option>
              <option value="transactions">By Transactions</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Personal Care", amount: 10840, growth: "+24.8%", icon: <Sparkles className="h-4 w-4 text-cyan-600" />, bg: "bg-cyan-50" },
              { name: "Health & Beauty", amount: 3670, growth: "+22.6%", icon: <Heart className="h-4 w-4 text-pink-600" />, bg: "bg-pink-50" },
              { name: "Dairy & Eggs", amount: 7280, growth: "+18.4%", icon: <Milk className="h-4 w-4 text-amber-600" />, bg: "bg-amber-50" },
              { name: "Snacks", amount: 18350, growth: "+14.7%", icon: <Cookie className="h-4 w-4 text-orange-600" />, bg: "bg-orange-50" },
              { name: "Beverages", amount: 45780, growth: "+11.2%", icon: <Package className="h-4 w-4 text-blue-600" />, bg: "bg-blue-50" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900"><CurrencyFormatter amount={item.amount} /></p>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> {item.growth}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t border-slate-100">
            <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View All Insights <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

      </div>

      {/* 5. Bottom Section: Detailed Category Table */}
      <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Category Performance Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Total Sales</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Avg Order Value</th>
                  <th className="py-3 px-4">Items Sold</th>
                  <th className="py-3 px-4">Refunds</th>
                  <th className="py-3 px-4">% of Total Sales</th>
                  <th className="py-3 px-4">Sales Growth</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {salesByCategoryData.map((cat, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-900">{cat.name}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900"><CurrencyFormatter amount={cat.value} /></td>
                    <td className="py-3 px-4">{cat.transactions}</td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={cat.aov} /></td>
                    <td className="py-3 px-4">{cat.itemsSold}</td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={cat.refunds} /></td>
                    <td className="py-3 px-4">{cat.percentage}</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold flex items-center gap-0.5 pt-3.5">
                      <ArrowUpRight className="h-3 w-3" /> {cat.growth}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="outline" size="icon" className="h-7 w-7 border-slate-200 text-slate-600 hover:bg-slate-100">
                        <BarChart3 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
            <span>Showing 1 to 8 of 8 categories</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7 border-slate-200 text-slate-400" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="default" size="sm" className="h-7 w-7 bg-blue-600 text-white font-semibold">
                  1
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7 border-slate-200 text-slate-400" disabled>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <select className="border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 outline-none ml-2">
                <option>10 / page</option>
                <option>20 / page</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}