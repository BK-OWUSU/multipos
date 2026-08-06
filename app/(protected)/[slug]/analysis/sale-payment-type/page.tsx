"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, ShoppingBag, BarChart3, RefreshCcw, 
  Download, Calendar, Filter, RotateCcw, ArrowUpRight, 
  ArrowRight, CreditCard, Smartphone, Banknote, Globe, 
  ShieldCheck, ChevronLeft, ChevronRight 
} from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock data for Sales by Payment Method Table & Charts
const salesByPaymentData = [
  { name: "Mobile Money (MTN)", code: "momo_mtn", type: "Mobile Money", value: 52340, percentage: "42.0%", color: "#f59e0b", transactions: 580, aov: 90.24, itemsSold: 1420, refunds: 120.00, growth: "+15.4%" },
  { name: "Credit / Debit Card", code: "card", type: "Card Payment", value: 34120, percentage: "27.4%", color: "#2563eb", transactions: 290, aov: 117.65, itemsSold: 980, refunds: 90.00, growth: "+12.1%" },
  { name: "Cash", code: "cash", type: "Physical Cash", value: 21450, percentage: "17.2%", color: "#10b981", transactions: 245, aov: 87.55, itemsSold: 650, refunds: 60.00, growth: "+4.5%" },
  { name: "Mobile Money (Telecel)", code: "momo_telecel", type: "Mobile Money", value: 11200, percentage: "9.0%", color: "#ec4899", transactions: 95, aov: 117.89, itemsSold: 310, refunds: 30.00, growth: "+18.8%" },
  { name: "Bank Transfer", code: "bank", type: "Direct Transfer", value: 3870, percentage: "3.1%", color: "#8b5cf6", transactions: 28, aov: 138.21, itemsSold: 96, refunds: 15.00, growth: "+8.2%" },
  { name: "Gift Card / Voucher", code: "voucher", type: "Voucher", value: 1700, percentage: "1.3%", color: "#06b6d4", transactions: 10, aov: 170.00, itemsSold: 30, refunds: 5.00, growth: "+2.0%" },
];

export default function SalesByPaymentMethodView() {
  const [dateRange] = useState("May 1, 2026 - May 27, 2026");
  const [chartMode, setChartMode] = useState<"sales" | "transactions">("sales");
  const [growthMode, setGrowthMode] = useState<"growth" | "transactions">("growth");

  // Helper icons for payment methods
  const getPaymentIcon = (type: string) => {
    switch (type) {
      case "Mobile Money":
        return <Smartphone className="h-4 w-4 text-amber-600" />;
      case "Card Payment":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "Physical Cash":
        return <Banknote className="h-4 w-4 text-emerald-600" />;
      default:
        return <Globe className="h-4 w-4 text-purple-600" />;
    }
  };

  const getPaymentBg = (type: string) => {
    switch (type) {
      case "Mobile Money": return "bg-amber-50";
      case "Card Payment": return "bg-blue-50";
      case "Physical Cash": return "bg-emerald-50";
      default: return "bg-purple-50";
    }
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      
      {/* 1. Header & Actions Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sale By Payment Method</h1>
          <p className="text-sm text-slate-500">
            Analyze transaction distribution, revenue share, and processing channels across all payment types.
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
              <option>Payment Method</option>
              <option>Channel Type</option>
              <option>Daily</option>
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

      {/* 4. Middle Section: Donut Chart + Progress Distribution & Channel Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Sales by Payment Method (Donut + Compact Breakdown) */}
        <Card className="lg:col-span-7 border-slate-200/80 shadow-xs rounded-xl bg-white flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Distribution by Payment Method</CardTitle>
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
                      data={salesByPaymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey={chartMode === "sales" ? "value" : "transactions"}
                    >
                      {salesByPaymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center absolute pointer-events-none">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Volume</span>
                  <span className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={124680} /></span>
                </div>
              </div>

              {/* Compact Mini Table List */}
              <div className="md:col-span-7 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-2 font-medium">Method</th>
                      <th className="py-2 px-2 font-medium text-right">Total Sales</th>
                      <th className="py-2 px-2 font-medium text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salesByPaymentData.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-700 font-medium truncate max-w-[120px]">{item.name}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-slate-900"><CurrencyFormatter amount={item.value} /></td>
                        <td className="py-2 px-2 text-right text-slate-400">{item.percentage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Gateway uptime: 99.98% secured
            </span>
            <button className="font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View Reconciliation Log <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

        {/* Right Side: Top Methods by Growth & Channel Share */}
        <Card className="lg:col-span-5 border-slate-200/80 shadow-xs rounded-xl bg-white flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Payment Growth & Trends</CardTitle>
            <select 
              value={growthMode}
              onChange={(e) => setGrowthMode(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-600 outline-none"
            >
              <option value="growth">Growth (vs Last Month)</option>
              <option value="transactions">By Transactions</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {salesByPaymentData.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${getPaymentBg(item.type)} flex items-center justify-center shrink-0`}>
                    {getPaymentIcon(item.type)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.type} • {item.transactions} txns</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900"><CurrencyFormatter amount={item.value} /></p>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> {item.growth}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t border-slate-100">
            <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View Channel Insights <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

      </div>

      {/* 5. Bottom Section: Detailed Payment Method Table */}
      <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Payment Channel Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Channel Type</th>
                  <th className="py-3 px-4">Total Sales</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Avg Order Value</th>
                  <th className="py-3 px-4">Items Sold</th>
                  <th className="py-3 px-4">Refunds</th>
                  <th className="py-3 px-4">% Share</th>
                  <th className="py-3 px-4">Growth</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {salesByPaymentData.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-900">{item.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.type}</td>
                    <td className="py-3 px-4 font-bold text-slate-900"><CurrencyFormatter amount={item.value} /></td>
                    <td className="py-3 px-4">{item.transactions}</td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={item.aov} /></td>
                    <td className="py-3 px-4">{item.itemsSold}</td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={item.refunds} /></td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.percentage}</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold flex items-center gap-0.5 pt-4">
                      <ArrowUpRight className="h-3 w-3" /> {item.growth}
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
            <span>Showing 1 to 6 of 6 payment methods</span>
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