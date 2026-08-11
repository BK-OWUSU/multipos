"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  DollarSign, ShoppingBag, BarChart3, RefreshCcw, 
  Calendar, RotateCcw, ArrowUpRight, 
  ArrowRight, ChevronDown, Store, ArrowDownRight, Loader2
} from "lucide-react";
import { startOfMonth, format } from "date-fns";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import TableMain from "@/components/reusables/table/TableMain";
import { AppSheet } from "@/components/reusables/AppSheet";
import { EmployeeDetailsDrawer } from "@/components/detials-components/analytics/saleByEmployeeDetailsViewer";
import { employeeSalesColumns, EmployeeSalesTableMeta } from "@/components/tablesColumnDef/business/analytics/saleByEmployeeAnalyticsColumnDef";
import { EmployeeTableDetailItem } from "@/types/types/sale-by-employee-analytics.types";
import { useShopStore } from "@/store/shopStore";
import { useEmployeeSalesSummaryStore } from "@/store/analytics-dashbaords/sale-by-employee-analyticsStore";
import CustomButton from "@/components/reusables/CustomButton";

export default function SalesByEmployeeView() {
    const {
      isLoading, metrics,
      donutChartData, barChartData,
      topListByGrowth, tableDetails, 
      fetchEmployeeSalesSummary
    } = useEmployeeSalesSummaryStore();
    const { shops, fetchShops } = useShopStore();

    
    // Filter States
    const [compareWithPrevious, setCompareWithPrevious] = useState<boolean>(true);
    const [selectedShop, setSelectedShop] = useState<string>("all");
    const [selectedFilter, setSelectedFilter] = useState<"daily" | "current_week" | "current_month" | "last_month" | "custom">("current_month");
    const [selectedGroupBy, setSelectedGroupBy] = useState<"Employee" | "Shop" | "Daily" | "None">("None");
    
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
      start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd")
    });

    // Fetch shops on mount
    useEffect(() => {
      fetchShops();
    }, [fetchShops]);

    // Fetch report data when filters change
    const loadData = useCallback(() => {
      fetchEmployeeSalesSummary({
        shopId: selectedShop === "all" ? undefined : selectedShop,
        filter: selectedFilter,
        startDate: selectedFilter === "custom" ? dateRange.start : undefined,
        endDate: selectedFilter === "custom" ? dateRange.end : undefined,
        compareWithPrevious,
        groupBy: selectedGroupBy === "None" ? undefined: selectedGroupBy
      });
    }, [fetchEmployeeSalesSummary, selectedShop, selectedFilter, dateRange.start, dateRange.end, compareWithPrevious, selectedGroupBy]);

    useEffect(() => {
      loadData();
    }, [loadData]);

    const handleResetFilters = () => {
      setSelectedShop("all");
      setSelectedFilter("current_month");
      setDateRange({
        start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        end: format(new Date(), "yyyy-MM-dd")
      });
      setCompareWithPrevious(true);
      setSelectedGroupBy("None");
    };

  const [chartMode, setChartMode] = useState<"sales" | "transactions">("sales");
  const [growthMode, setGrowthMode] = useState<"growth" | "transactions">("growth");

  const [selectedSaleEmployeeItem, setSelectedSaleEmployeeItem] = useState<EmployeeTableDetailItem | null>(null);
  const [isSaleEmployeeDrawerOpen, setIsSaleEmployeeDrawerOpen] = useState<boolean>(false);

  // Safe accessor mappings or fallbacks based on store metrics
  const totalSalesVal = metrics?.totalSales ?? 0;
  const totalTransactionsVal = metrics?.totalTransactions ?? 0;
  const averageOrderValueVal = metrics?.averageOrderValue ?? 0;
  const itemsSoldVal = metrics?.itemsSold ?? 0;
  const totalRefundsVal = metrics?.totalRefunds ?? 0;

  // Safe dataset helpers to prevent null/undefined issues on Recharts and iteration
  const safeBarChartData = barChartData ?? [];
  const safeDonutChartData = donutChartData ?? [];
  const safeTopListByGrowth = topListByGrowth ?? [];
  const safeTableDetails = tableDetails ?? [];

  const effectiveBarData = (safeBarChartData.length > 0 ? safeBarChartData : safeTableDetails).slice(0, 7);
  const effectiveDonutData = safeDonutChartData.length > 0 ? safeDonutChartData : safeTableDetails;
  const effectiveGrowthData = safeTopListByGrowth.length > 0 ? safeTopListByGrowth : safeTableDetails;

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
      </div>

      {/* 2. Top Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Sales</p>
              {isLoading ? (
                <div className="py-1">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">
                  <CurrencyFormatter amount={typeof totalSalesVal === "number" ? totalSalesVal : (totalSalesVal?.current ?? 0)} />
                </h3>
              )}
              <p className={`text-xs font-medium flex items-center gap-1 ${(typeof totalSalesVal === "object" && totalSalesVal !== null ? totalSalesVal.percentageChange : 12.5) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {(typeof totalSalesVal === "object" && totalSalesVal !== null ? totalSalesVal.percentageChange : 12.5) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} 
                {Math.abs(typeof totalSalesVal === "object" && totalSalesVal !== null ? totalSalesVal.percentageChange : 12.5).toFixed(1)}% vs previous period
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
              {isLoading ? (
                <div className="py-1">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">
                  {typeof totalTransactionsVal === "number" ? totalTransactionsVal.toLocaleString() : ((totalTransactionsVal?.current ?? 0).toLocaleString())}
                </h3>
              )}
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                Completed orders count
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
              {isLoading ? (
                <div className="py-1">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">
                  <CurrencyFormatter amount={typeof averageOrderValueVal === "number" ? averageOrderValueVal : (averageOrderValueVal?.current ?? 0)} />
                </h3>
              )}
              <p className="text-xs text-slate-500 font-medium">Per transaction</p>
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
              {isLoading ? (
                <div className="py-1">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">
                  {typeof itemsSoldVal === "number" ? itemsSoldVal.toLocaleString() : ((itemsSoldVal?.current ?? 0).toLocaleString())}
                </h3>
              )}
              <p className="text-xs text-slate-500 font-medium">Total units moved</p>
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
              {isLoading ? (
                <div className="py-1">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">
                  <CurrencyFormatter amount={typeof totalRefundsVal === "number" ? totalRefundsVal : (totalRefundsVal?.current ?? 0)} />
                </h3>
              )}
              <p className="text-xs text-rose-600 font-medium">Returned amount</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <RefreshCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filter Toolbar Section */}
      <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-center">
          
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

          {/* Group By Dropdown */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Group By</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-10 text-xs rounded-xl border-slate-200 justify-between font-semibold bg-white shadow-xs text-slate-700">
                  <span className="truncate">{selectedGroupBy}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl w-44">
                <DropdownMenuItem onClick={() => setSelectedGroupBy("Employee")} className="text-xs font-semibold cursor-pointer">Employee</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroupBy("None")} className="text-xs font-semibold cursor-pointer">None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroupBy("Daily")} className="text-xs font-semibold cursor-pointer">Daily</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroupBy("Shop")} className="text-xs font-semibold cursor-pointer">Shop</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Shop Dropdown */}
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

          {/* Reset Action */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">&nbsp;</label>
            <CustomButton
              className="w-full"
               onClick={handleResetFilters}
               text="Reset Filters"
               customVariant="primary"
               icon={<RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
             />
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
            {effectiveBarData.map((emp, i) => {
              const maxVal = 30000;
              const empValue = Number(emp.totalSales ?? 0);
              const empTransactions = Number("transactions" in emp ? emp.transactions : 0);
              const empName = "name" in emp && typeof emp.name === "string" ? emp.name : ("label" in emp && typeof emp.label === "string" ? emp.label : "Unknown");

              const currentVal = chartMode === "sales" ? empValue : empTransactions * 100;
              const percentageWidth = Math.min(Math.round((currentVal / maxVal) * 100), 100);

              return (
                <div key={i} className="flex items-center justify-between gap-4 text-xs">
                  <div className="w-32 flex items-center gap-2 shrink-0">
                    <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px] shrink-0">
                      {empName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <span className="font-medium text-slate-800 truncate">{empName}</span>
                  </div>
                  
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentageWidth}%` }}
                    />
                  </div>

                  <div className="w-24 text-right font-bold text-slate-900 shrink-0">
                    {chartMode === "sales" ? <CurrencyFormatter amount={empValue} /> : `${empTransactions} trans`}
                  </div>
                </div>
              );
            })}
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
              onChange={(e) => setGrowthMode(e.target.value as "growth" | "transactions")}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-600 outline-none"
            >
              <option value="growth">Growth</option>
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
                      data={effectiveDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="totalSales"
                    >
                      {effectiveDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"][index % 6]} />
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
                {effectiveGrowthData.slice(0, 7).map((item, i) => {
                  const growthVal = Number("salesGrowth" in item ? item.salesGrowth : 0);
                  const isPos = growthVal >= 0;
                  const itemName = "name" in item && typeof item.name === "string" ? item.name : ("label" in item && typeof item.label === "string" ? item.label : "Unknown");
                  const colors = ["#8b5cf6", "#06b6d4", "#2563eb", "#10b981", "#f59e0b", "#ec4899", "#94a3b8"];
                  
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                        <span className="text-slate-700 font-medium truncate max-w-27.5">{itemName}</span>
                      </div>
                      <span className={`${isPos ? "text-emerald-600" : "text-rose-600"} font-semibold flex items-center gap-0.5`}>
                        <ArrowUpRight className="h-3 w-3" /> {isPos ? `+${growthVal.toFixed(1)}%` : `${growthVal.toFixed(1)}%`}
                      </span>
                    </div>
                  );
                })}
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
           <div className="w-full overflow-x-auto">
            <TableMain
              columns={employeeSalesColumns}
              data={tableDetails || []}
              loading={isLoading}
              columnVisibilityFilter={true}
              tableExportButtonVisible={true}
              tableFilterButtonVisible={true}
              placeholder="Search keyword"            
              searchKey="name"
              meta={{
               onViewEmployeeAnalytics(employee) {
                   setSelectedSaleEmployeeItem(employee);
                   setIsSaleEmployeeDrawerOpen(true);
               },
              } as EmployeeSalesTableMeta}
            />
          </div>
        </CardContent>
      </Card>

      <AppSheet
        isOpen={isSaleEmployeeDrawerOpen}
        onClose={() => setIsSaleEmployeeDrawerOpen(false)}
        title="Sales by Employee Performance"
        description="View individual sales metrics, total revenue generated, transaction volume, average order value, and target progress for this employee."
        maxWidth="lg"
      >
        {selectedSaleEmployeeItem && (
          <EmployeeDetailsDrawer employee={selectedSaleEmployeeItem} />
        )}  
      </AppSheet>

    </div>
  );
}