"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, ShoppingBag, TrendingUp, BarChart3, RefreshCcw, 
  Download, Calendar, RotateCcw, ArrowUpRight, Award, Clock, ArrowRight, Loader2, 
  Store,
  ChevronDown
} from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { startOfMonth, format } from "date-fns";
import { useSalesSummaryStore } from "@/store/analytics-dashbaords/sale-summary-analyticsStore";
import { useShopStore } from "@/store/shopStore";
import { DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import { Table,TableBody,TableCell,TableHead,TableHeader, TableRow} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { exportToExcel, exportToPDF } from "@/lib/exports/exportUtils";


const CHART_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
];

export default function SalesSummaryView() {
  const {metrics,salesByShop,salesOverTimeChart,historicalPeriods,salesHighlights,isLoading,error,fetchSalesSummary} = useSalesSummaryStore();
  const { shops, fetchShops } = useShopStore();

  // Local state for filter controls
  const [selectedFilter, setSelectedFilter] = useState<"" | "daily" | "current_week" | "last_week" | "current_month" | "last_month" | "custom">("current_month");
  const [compareWithPrevious, setCompareWithPrevious] = useState<boolean>(true);
  const [selectedShop, setSelectedShop] = useState<string>("all");
  
  // Local state for custom date range inputs (typed cleanly as strings)
 const [dateRange, setDateRange] = useState<{ 
  start: string; 
  end: string 
}>({
  start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  end: format(new Date(), "yyyy-MM-dd")
});

  useEffect(() => {
    fetchSalesSummary({
      filter: selectedFilter,
      compareWithPrevious,
      shopId: selectedShop === "all" ? undefined : selectedShop,
      startDate: dateRange.start, 
      endDate: dateRange.end,     
    });
    fetchShops();
  }, [selectedFilter, compareWithPrevious, dateRange, fetchSalesSummary, selectedShop, fetchShops]);
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
        
        {/* Excel Export Dropdown or Direct Action */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-slate-200 text-slate-700 bg-white shadow-xs font-semibold text-xs rounded-xl h-9">
              <Download className="h-3.5 w-3.5" /> Export Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl w-44">
            <DropdownMenuItem 
              onClick={() => {
                // Format historicalPeriods data for clean export columns
                const exportData = (historicalPeriods || []).map((period) => ({
                  "Period": period.periodLabel,
                  "Total Sales": period.totalSales,
                  "Transactions": period.transactions,
                  "AOV": period.aov,
                  "Refunds": period.refunds
                }));
                
                exportToExcel(exportData, { 
                  filename: `sales_summary_${selectedFilter}`, 
                  sheetName: "Sales Summary" 
                });
              }}
              className="text-xs font-semibold cursor-pointer"
            >
              Export as Excel (.xlsx)
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => {
                const exportData = (historicalPeriods || []).map((period) => ({
                  "Period": period.periodLabel,
                  "Total Sales": period.totalSales,
                  "Transactions": period.transactions,
                  "AOV": period.aov,
                  "Refunds": period.refunds
                }));

                exportToPDF(exportData, { 
                  filename: `sales_summary_${selectedFilter}`, 
                  title: `Sales Summary Report (${selectedFilter.toUpperCase()})` 
                });
              }}
              className="text-xs font-semibold cursor-pointer"
            >
              Export as PDF (.pdf)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" className="gap-2 border-slate-200 text-slate-700 bg-white shadow-xs font-semibold text-xs rounded-xl h-9">
          <Calendar className="h-3.5 w-3.5" /> Schedule Report
        </Button>
      </div>
    </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          {error}
        </div>
      )}

    {/* 2. Top Metric Summary Cards */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Sales</p>
            {isLoading || !metrics ? (
              <div className="py-2 flex items-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
            ) : (
              <h3 className="text-2xl font-bold text-slate-900"><CurrencyFormatter amount={metrics.totalSales.current} /></h3>
            )}
            <p className={`text-xs font-medium flex items-center gap-1 ${metrics && metrics.totalSales.percentageChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <ArrowUpRight className="h-3 w-3" /> {metrics ? `${metrics.totalSales.percentageChange >= 0 ? "+" : ""}${metrics.totalSales.percentageChange.toFixed(1)}% vs previous` : "Loading..."}
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
            {isLoading || !metrics ? (
              <div className="py-2 flex items-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
            ) : (
              <h3 className="text-2xl font-bold text-slate-900">{metrics.totalTransactions.current.toLocaleString()}</h3>
            )}
            <p className={`text-xs font-medium flex items-center gap-1 ${metrics && metrics.totalTransactions.percentageChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <ArrowUpRight className="h-3 w-3" /> {metrics ? `${metrics.totalTransactions.percentageChange >= 0 ? "+" : ""}${metrics.totalTransactions.percentageChange.toFixed(1)}% vs previous` : "Loading..."}
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
            {isLoading || !metrics ? (
              <div className="py-2 flex items-center"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>
            ) : (
              <h3 className="text-2xl font-bold text-slate-900"><CurrencyFormatter amount={metrics.averageOrderValue.current} /></h3>
            )}
            <p className={`text-xs font-medium flex items-center gap-1 ${metrics && metrics.averageOrderValue.percentageChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <ArrowUpRight className="h-3 w-3" /> {metrics ? `${metrics.averageOrderValue.percentageChange >= 0 ? "+" : ""}${metrics.averageOrderValue.percentageChange.toFixed(1)}% vs previous` : "Loading..."}
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
            {isLoading || !metrics ? (
              <div className="py-2 flex items-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
            ) : (
              <h3 className="text-2xl font-bold text-slate-900">{metrics.itemsSold.current.toLocaleString()}</h3>
            )}
            <p className={`text-xs font-medium flex items-center gap-1 ${metrics && metrics.itemsSold.percentageChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <ArrowUpRight className="h-3 w-3" /> {metrics ? `${metrics.itemsSold.percentageChange >= 0 ? "+" : ""}${metrics.itemsSold.percentageChange.toFixed(1)}% vs previous` : "Loading..."}
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
            {isLoading || !metrics ? (
              <div className="py-2 flex items-center"><Loader2 className="h-6 w-6 animate-spin text-rose-600" /></div>
            ) : (
              <h3 className="text-2xl font-bold text-slate-900"><CurrencyFormatter amount={metrics.totalRefunds.current} /></h3>
            )}
            <p className={`text-xs font-medium flex items-center gap-1 ${metrics && metrics.totalRefunds.percentageChange <= 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {metrics ? `${metrics.totalRefunds.percentageChange.toFixed(1)}% vs previous` : "Loading..."}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
          
          {/* Date Range Inputs */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Date Range</label>
            <div className="text-sm font-medium border border-slate-200 rounded-xl px-2 py-1 bg-white flex items-center gap-1.5 text-slate-700 shadow-xs">
              <Input 
                type="date" 
                value={dateRange?.start ? dateRange.start.split('T')[0] : ""}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  setSelectedFilter("custom");
                }}
                className="bg-transparent text-[11px] h-8 px-1 border-0 shadow-none outline-none focus-visible:ring-0 text-slate-700 cursor-pointer w-full"
              />
              <span className="text-slate-400 font-normal shrink-0">-</span>
              <Input 
                type="date" 
                value={dateRange?.end ? dateRange.end.split('T')[0] : ""}
                onChange={(e) => {
                  setDateRange({ ...dateRange, end: e.target.value });
                  setSelectedFilter("custom");
                }}
                className="bg-transparent text-[11px] h-8 px-1 border-0 shadow-none outline-none focus-visible:ring-0 text-slate-700 cursor-pointer w-full"
              />
            </div>
          </div>

          {/* Compare With Dropdown */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Compare With</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-10 text-xs rounded-xl border-slate-200 justify-between font-semibold bg-white shadow-xs text-slate-700">
                  <span className="truncate">{compareWithPrevious ? "Previous Period" : "None"}</span>
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl w-44">
                <DropdownMenuItem onClick={() => setCompareWithPrevious(true)} className="text-xs font-semibold cursor-pointer">
                  Previous Period
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCompareWithPrevious(false)} className="text-xs font-semibold cursor-pointer">
                  None
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filter Preset Dropdown */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Filter Preset</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-10 text-xs rounded-xl border-slate-200 justify-between font-semibold bg-white shadow-xs text-slate-700">
                  <span className="truncate">
                    {selectedFilter === "daily" ? "Daily" :
                    selectedFilter === "current_week" ? "Current Week" :
                    selectedFilter === "current_month" ? "Current Month" :
                    selectedFilter === "last_month" ? "Last Month" :
                    selectedFilter === "custom" ? "Custom" : "Select Preset"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl w-44">
                <DropdownMenuItem onClick={() => setSelectedFilter("daily")} className="text-xs font-semibold cursor-pointer">Daily</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("current_week")} className="text-xs font-semibold cursor-pointer">Current Week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("current_month")} className="text-xs font-semibold cursor-pointer">Current Month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("last_month")} className="text-xs font-semibold cursor-pointer">Last Month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("custom")} className="text-xs font-semibold cursor-pointer">Custom</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Shop Dropdown (Kept exactly as requested) */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Shop</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full h-10 text-xs rounded-xl border-slate-200 gap-2 font-semibold bg-white shadow-xs justify-between">
                  <span className="flex items-center gap-2 truncate">
                    <Store className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{selectedShop === "all" ? "All Outlets" : shops.find(s => s.id === selectedShop)?.name || "Select Shop"}</span>
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl">
                <DropdownMenuItem onClick={() => setSelectedShop("all")} className="text-xs font-semibold cursor-pointer">
                  All Outlets
                </DropdownMenuItem>
                {shops.map((shop) => (
                  <DropdownMenuItem key={shop.id} onClick={() => setSelectedShop(shop.id)} className="text-xs font-semibold cursor-pointer">
                    {shop.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reset Action (Expanded column layout adjustment and grid-cols-5 balance) */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">&nbsp;</label>
            <Button 
              variant="ghost" 
              onClick={() => { setSelectedFilter("current_month"); setSelectedShop("all"); setCompareWithPrevious(true); }}
              className="w-full h-10 text-xs rounded-xl text-slate-600 hover:bg-slate-100 font-semibold border border-transparent hover:border-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Filters
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
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 mt-1">
            
            {/* Current Period Legend */}
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
              <span className="font-semibold text-slate-700">Current range:</span>
              <span>
                {dateRange?.start && dateRange?.end 
                  ? `${new Date(dateRange.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(dateRange.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` 
                  : "Current Period"}
              </span>
            </div>

            {/* Previous Period / Comparison Legend */}
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
              <span className="font-semibold text-slate-700">Previous Period:</span>
              <span>
                {compareWithPrevious && dateRange?.start && dateRange?.end ? (() => {
                  const currStart = new Date(dateRange.start);
                  const currEnd = new Date(dateRange.end);
                  const diffTime = Math.abs(currEnd.getTime() - currStart.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                  const prevEnd = new Date(currStart);
                  prevEnd.setDate(prevEnd.getDate() - 1);

                  const prevStart = new Date(prevEnd);
                  prevStart.setDate(prevStart.getDate() - diffDays + 1);

                  return `${prevStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${prevEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
                })() : "None"}
              </span>
            </div>

          </div>
        </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl border-slate-200 gap-2 font-semibold bg-white shadow-2xs text-slate-700">
                  <span className="truncate">
                    {selectedFilter === "daily" ? "Daily" :
                    selectedFilter === "current_week" ? "Current Week" :
                    selectedFilter === "current_month" ? "Current Month" :
                    selectedFilter === "last_month" ? "Last Month" :
                    selectedFilter === "custom" ? "Custom Range" : "Select Preset"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl w-44">
                <DropdownMenuItem onClick={() => setSelectedFilter("daily")} className="text-xs font-semibold cursor-pointer">Daily</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("current_week")} className="text-xs font-semibold cursor-pointer">Current Week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("current_month")} className="text-xs font-semibold cursor-pointer">Current Month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("last_month")} className="text-xs font-semibold cursor-pointer">Last Month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("custom")} className="text-xs font-semibold cursor-pointer">Custom</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <div className="h-72 w-full pt-4">
              {isLoading && !salesOverTimeChart ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
              ) : (
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesOverTimeChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val: number) => `${val/1000}K`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: number | string | readonly (number | string)[] | undefined) => {
                      const rawVal = Array.isArray(value) ? value[0] : value;
                      const numericValue = typeof rawVal === "number" ? rawVal : Number(rawVal) || 0;
                      
                      return [
                        <CurrencyFormatter key="currency-val" amount={numericValue} />, 
                        ""
                      ];
                    }}
                  />
                  <Area type="monotone" dataKey="primarySales" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)" />
                  <Area type="monotone" dataKey="comparisonSales" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorPrevious)" />
                </AreaChart>
              </ResponsiveContainer>
              )}
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
              {isLoading && !salesByShop ? (
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByShop || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="totalSales"
                        nameKey="shopName"
                      >
                        {(salesByShop || []).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center absolute pointer-events-none">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Sales</span>
                    <span className="text-sm font-bold text-slate-900">
                      <CurrencyFormatter amount={metrics ? metrics.totalSales.current : 0} />
                    </span>
                  </div>
                </>
              )}
            </div>

           <div className="space-y-2 border-t border-slate-100 pt-3 max-h-40 overflow-y-auto">
              {(salesByShop || []).map((shop, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="h-2.5 w-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} 
                    />
                    <span className="text-slate-700 font-medium truncate max-w-32.5">{shop.shopName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900"><CurrencyFormatter amount={shop.totalSales} /></span>
                    <span className="text-slate-400 w-10 text-right">{shop.percentageShare}%</span>
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
              <Table>
                <TableHeader className="bg-slate-50 uppercase tracking-wider border-y border-slate-100">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-slate-500 text-xs font-semibold">Period</TableHead>
                    <TableHead className="py-3 px-4 text-slate-500 text-xs font-semibold">Total Sales</TableHead>
                    <TableHead className="py-3 px-4 text-slate-500 text-xs font-semibold">Transactions</TableHead>
                    <TableHead className="py-3 px-4 text-slate-500 text-xs font-semibold">AOV</TableHead>
                    <TableHead className="py-3 px-4 text-slate-500 text-xs font-semibold">Refunds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-slate-700 font-medium text-xs">
                  {historicalPeriods && historicalPeriods.length > 0 ? (
                    historicalPeriods.map((period, index) => (
                      <TableRow key={index}>
                        <TableCell className="py-3 px-4 text-slate-900 font-semibold">{period.periodLabel}</TableCell>
                        <TableCell className="py-3 px-4 font-bold text-slate-900"><CurrencyFormatter amount={period.totalSales} /></TableCell>
                        <TableCell className="py-3 px-4">{period.transactions.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4"><CurrencyFormatter amount={period.aov} /></TableCell>
                        <TableCell className="py-3 px-4"><CurrencyFormatter amount={period.refunds} /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-4 text-center text-slate-400">
                        {!historicalPeriods ? "Loading historical periods..." : "No historical data available."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
                  <p className="text-sm font-bold text-slate-900">{salesHighlights?.bestDay.date || "N/A"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={salesHighlights?.bestDay.totalSales || 0} /></p>
                <p className="text-xs text-slate-400">{salesHighlights?.bestDay.transactions || 0} Transactions</p>
              </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Highest Selling Shop</p>
                  <p className="text-sm font-bold text-slate-900">{salesHighlights?.highestSellingShop.shopName || "N/A"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={salesHighlights?.highestSellingShop.totalSales || 0} /></p>
                <p className="text-xs text-slate-400">{salesHighlights?.highestSellingShop.percentageShare || "0%"} of total sales</p>
              </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Top Selling Category</p>
                  <p className="text-sm font-bold text-slate-900">{salesHighlights?.topSellingCategory.categoryName || "N/A"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={salesHighlights?.topSellingCategory.totalSales || 0} /></p>
                <p className="text-xs text-slate-400">{salesHighlights?.topSellingCategory.totalSales || "0%"} of total sales</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Peak Hour</p>
                  <p className="text-sm font-bold text-slate-900">{salesHighlights?.peakHour.timeRange || "N/A"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900"><CurrencyFormatter amount={salesHighlights?.peakHour.totalSales || 0} /></p>
                <p className="text-xs text-slate-400">{salesHighlights?.peakHour.transactions || 0} Transactions</p>
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