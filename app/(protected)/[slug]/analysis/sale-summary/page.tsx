"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, ShoppingBag, TrendingUp, BarChart3, RefreshCcw, 
  Download, Calendar, Filter, RotateCcw, ArrowUpRight, Award, Clock, ArrowRight 
} from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";

// Mock data for the Sales Over Time line/area chart comparing periods
const salesOverTimeData = [
  { date: "May 1", current: 4800, previous: 2500 },
  { date: "May 3", current: 5700, previous: 3100 },
  { date: "May 5", current: 5400, previous: 3800 },
  { date: "May 7", current: 6200, previous: 3400 },
  { date: "May 9", current: 7100, previous: 4500 },
  { date: "May 11", current: 6500, previous: 4200 },
  { date: "May 13", current: 7400, previous: 4900 },
  { date: "May 15", current: 7000, previous: 4600 },
  { date: "May 17", current: 8500, previous: 5800 },
  { date: "May 19", current: 8100, previous: 5400 },
  { date: "May 21", current: 8900, previous: 6200 },
  { date: "May 23", current: 8400, previous: 5900 },
  { date: "May 25", current: 9300, previous: 6700 },
  { date: "May 27", current: 8700, previous: 6300 },
];

// Mock data for Sales by Shop Donut Chart
const salesByShopData = [
  { name: "Accra Mall Branch", value: 45780, percentage: "36.7%", color: "#2563eb" },
  { name: "West Hills Branch", value: 32450, percentage: "26.0%", color: "#10b981" },
  { name: "Kumasi City Branch", value: 24180, percentage: "19.4%", color: "#f59e0b" },
  { name: "Takoradi Branch", value: 12630, percentage: "10.1%", color: "#8b5cf6" },
  { name: "Other Shops", value: 9640, percentage: "7.8%", color: "#94a3b8" },
];

export default function SalesSummaryView() {
  const [dateRange] = useState("May 1, 2026 - May 27, 2026");

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      
      {/* 1. Header & Actions Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Summary</h1>
          <p className="text-sm text-slate-500">
            Overview of your sales performance across all shops.
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
            <select className="text-sm font-medium border border-slate-200 rounded-lg p-2 bg-white w-full text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Shop</label>
            <select className="text-sm font-medium border border-slate-200 rounded-lg p-2 bg-white w-full text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
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

      {/* 4. Middle Section: Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Over Time Line Chart */}
        <Card className="lg:col-span-2 border-slate-200/80 shadow-xs rounded-xl bg-white flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Sales Over Time</CardTitle>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span> May 1 - May 27, 2026
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span> Apr 1 - Apr 27, 2026
                </span>
              </div>
            </div>
            <select className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-600 outline-none">
              <option>Daily</option>
              <option>Weekly</option>
            </select>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}K`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: any) => [`GH₵ ${value.toLocaleString()}`, ""]}
                  />
                  <Area type="monotone" dataKey="current" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)" />
                  <Area type="monotone" dataKey="previous" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorPrevious)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Shop Donut Breakdown */}
        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Sales by Shop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByShopData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {salesByShopData.map((entry, index) => (
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

            <div className="space-y-2 border-t border-slate-100 pt-3">
              {salesByShopData.map((shop, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: shop.color }} />
                    <span className="text-slate-700 font-medium truncate max-w-[130px]">{shop.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900"><CurrencyFormatter amount={shop.value} /></span>
                    <span className="text-slate-400 w-10 text-right">{shop.percentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-100">
            <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View Shop Breakdown <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

      </div>

      {/* 5. Bottom Section: Period Table & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales Summary by Period Table */}
        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900">Sales Summary by Period</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Total Sales</th>
                    <th className="py-3 px-4">Transactions</th>
                    <th className="py-3 px-4">AOV</th>
                    <th className="py-3 px-4">Refunds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  <tr>
                    <td className="py-3 px-4 text-slate-900 font-semibold">May 1 - May 27, 2026</td>
                    <td className="py-3 px-4 font-bold text-slate-900"><CurrencyFormatter amount={124680} /></td>
                    <td className="py-3 px-4">1,248</td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={19.78} /></td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={320} /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-900 font-semibold">Apr 1 - Apr 27, 2026</td>
                    <td className="py-3 px-4 font-bold text-slate-900"><CurrencyFormatter amount={110660} /></td>
                    <td className="py-3 px-4">1,154</td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={18.56} /></td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={328} /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-900 font-semibold">Mar 1 - Mar 31, 2026</td>
                    <td className="py-3 px-4 font-bold text-slate-900"><CurrencyFormatter amount={98450} /></td>
                    <td className="py-3 px-4">1,021</td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={17.89} /></td>
                    <td className="py-3 px-4"><CurrencyFormatter amount={410} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100">
              <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                View Full Report <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Sales Highlights Card */}
        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900">Sales Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Best Day</p>
                  <p className="text-sm font-bold text-slate-900">Saturday, May 24, 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={8760} /></p>
                <p className="text-xs text-slate-400">87 Transactions</p>
              </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Highest Selling Shop</p>
                  <p className="text-sm font-bold text-slate-900">Accra Mall Branch</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={45780} /></p>
                <p className="text-xs text-slate-400">36.7% of total sales</p>
              </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Top Selling Category</p>
                  <p className="text-sm font-bold text-slate-900">Beverages</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={38450} /></p>
                <p className="text-xs text-slate-400">30.8% of total sales</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Peak Hour</p>
                  <p className="text-sm font-bold text-slate-900">12:00 PM - 1:00 PM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={15680} /></p>
                <p className="text-xs text-slate-400">156 Transactions</p>
              </div>
            </div>

          </CardContent>
          <div className="p-4 border-t border-slate-100">
            <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View Detailed Insights <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

      </div>

    </div>
  );
}