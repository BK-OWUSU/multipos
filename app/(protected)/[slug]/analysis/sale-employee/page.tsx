"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, ShoppingBag, BarChart3, RefreshCcw, 
  Download, Calendar, Filter, RotateCcw, ArrowUpRight, 
  ArrowRight, ChevronLeft, ChevronRight 
} from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock data for Sales by Employee Table & Charts
const salesByEmployeeData = [
  { name: "Michael Brown", branch: "Accra Mall Branch", value: 24580, percentage: "19.7%", color: "#2563eb", transactions: 256, aov: 21.80, itemsSold: 712, discounts: 1240.00, refunds: 60.00, growth: "+14.2%" },
  { name: "Sarah Johnson", branch: "West Hills Branch", value: 18760, percentage: "15.0%", color: "#10b981", transactions: 198, aov: 20.13, itemsSold: 542, discounts: 980.00, refunds: 40.00, growth: "+11.8%" },
  { name: "Kwame Mensah", branch: "Kumasi City Branch", value: 15430, percentage: "12.4%", color: "#f59e0b", transactions: 171, aov: 18.97, itemsSold: 439, discounts: 760.00, refunds: 30.00, growth: "+9.6%" },
  { name: "Ama Serwaa", branch: "Accra Mall Branch", value: 12650, percentage: "10.1%", color: "#8b5cf6", transactions: 139, aov: 19.64, itemsSold: 361, discounts: 540.00, refunds: 20.00, growth: "+24.6%" },
  { name: "Kofi Boateng", branch: "Takoradi Branch", value: 10230, percentage: "8.2%", color: "#06b6d4", transactions: 112, aov: 18.78, itemsSold: 285, discounts: 420.00, refunds: 10.00, growth: "+18.3%" },
  { name: "Emely Davis", branch: "West Hills Branch", value: 8460, percentage: "6.8%", color: "#ec4899", transactions: 94, aov: 19.00, itemsSold: 210, discounts: 310.00, refunds: 15.00, growth: "+6.7%" },
  { name: "David Wilson", branch: "Kumasi City Branch", value: 6570, percentage: "5.3%", color: "#94a3b8", transactions: 73, aov: 18.50, itemsSold: 165, discounts: 210.00, refunds: 5.00, growth: "+3.2%" },
];

export default function SalesByEmployeeView() {
  const [dateRange] = useState("May 1, 2026 - May 27, 2026");
  const [chartMode, setChartMode] = useState<"sales" | "transactions">("sales");
  const [growthMode, setGrowthMode] = useState<"growth" | "transactions">("growth");

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      
      {/* 1. Header & Actions Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sale By Employee</h1>
          <p className="text-sm text-slate-500">
            Track sales performance of employees across all shops.
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
              <option>Employee</option>
              <option>Daily</option>
              <option>Shop</option>
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

      {/* 4. Middle Section: Horizontal Bar Chart + Growth Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Sales by Employee (Horizontal Bar Breakdown) */}
        <Card className="lg:col-span-7 border-slate-200/80 shadow-xs rounded-xl bg-white flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Sales by Employee</CardTitle>
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
          <CardContent className="space-y-3 pt-2">
            {salesByEmployeeData.map((emp, i) => {
              const maxVal = 30000;
              const currentVal = chartMode === "sales" ? emp.value : emp.transactions * 100; // proportional scale
              const percentageWidth = Math.min(Math.round((currentVal / maxVal) * 100), 100);

              return (
                <div key={i} className="flex items-center justify-between gap-4 text-xs">
                  <div className="w-32 flex items-center gap-2 shrink-0">
                    <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px] shrink-0">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-medium text-slate-800 truncate">{emp.name}</span>
                  </div>
                  
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentageWidth}%` }}
                    />
                  </div>

                  <div className="w-24 text-right font-bold text-slate-900 shrink-0">
                    {chartMode === "sales" ? <CurrencyFormatter amount={emp.value} /> : `${emp.transactions} trans`}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 px-32">
              <span>0</span>
              <span>₵5K</span>
              <span>₵10K</span>
              <span>₵15K</span>
              <span>₵20K</span>
              <span>₵25K</span>
              <span>₵30K</span>
            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-100">
            <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View Full Employee Performance <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

        {/* Right Side: Top Employees by Sales Growth */}
        <Card className="lg:col-span-5 border-slate-200/80 shadow-xs rounded-xl bg-white flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Top Employees by Sales Growth</CardTitle>
            <select 
              value={growthMode}
              onChange={(e) => setGrowthMode(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-600 outline-none"
            >
              <option value="growth">Growth (vs Apr 1 - Apr 27)</option>
              <option value="transactions">By Transactions</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Donut Chart */}
              <div className="md:col-span-5 h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByEmployeeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {salesByEmployeeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center absolute pointer-events-none">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Avg Growth</span>
                  <span className="text-sm font-bold text-slate-900">+12.5%</span>
                </div>
              </div>

              {/* Growth Legend List */}
              <div className="md:col-span-7 space-y-2">
                {[
                  { name: "Ama Serwaa", growth: "+24.6%", color: "#8b5cf6" },
                  { name: "Kofi Boateng", growth: "+18.3%", color: "#06b6d4" },
                  { name: "Michael Brown", growth: "+14.2%", color: "#2563eb" },
                  { name: "Sarah Johnson", growth: "+11.8%", color: "#10b981" },
                  { name: "Kwame Mensah", growth: "+9.6%", color: "#f59e0b" },
                  { name: "Emely Davis", growth: "+6.7%", color: "#ec4899" },
                  { name: "David Wilson", growth: "+3.2%", color: "#94a3b8" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 font-medium truncate max-w-[110px]">{item.name}</span>
                    </div>
                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" /> {item.growth}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-100">
            <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View Growth Insights <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

      </div>

      {/* 5. Bottom Section: Detailed Employee Table */}
      <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Employee Sales Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Total Sales</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Avg Order Value</th>
                  <th className="py-3 px-4">Items Sold</th>
                  <th className="py-3 px-4">Discounts</th>
                  <th className="py-3 px-4">Refunds</th>
                  <th className="py-3 px-4">Sales Growth</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {salesByEmployeeData.map((emp, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">{emp.name}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{emp.branch}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900"><CurrencyFormatter amount={emp.value} /></td>
                    <td className="py-3 px-4">{emp.transactions}</td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={emp.aov} /></td>
                    <td className="py-3 px-4">{emp.itemsSold}</td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={emp.discounts} /></td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={emp.refunds} /></td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold flex items-center gap-0.5 pt-4">
                      <ArrowUpRight className="h-3 w-3" /> {emp.growth}
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
            <span>Showing 1 to 7 of 7 employees</span>
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