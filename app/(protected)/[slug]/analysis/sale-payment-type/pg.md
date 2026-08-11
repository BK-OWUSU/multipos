"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  DollarSign, ShoppingBag, BarChart3, RefreshCcw, 
  Download, Calendar, RotateCcw, ArrowUpRight, 
  ArrowRight, CreditCard, Smartphone, Banknote, Globe, 
  ShieldCheck, Loader2, ChevronDown, Store, ArrowDownRight
} from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import CustomButton from "@/components/reusables/CustomButton";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import TableMain from "@/components/reusables/table/TableMain";
import { AppSheet } from "@/components/reusables/AppSheet";
import { startOfMonth, format } from "date-fns";
import { paymentSalesColumns, PaymentSalesTableMeta } from "@/components/tablesColumnDef/business/analytics/saleByPaymentTypeAnalyticsColumnDef";
import { PaymentDetailsDrawer } from "@/components/detials-components/analytics/saleByPaymentTypeDetailsViewer";
import { useShopStore } from "@/store/shopStore";
import { usePaymentSalesSummaryStore } from "@/store/analytics-dashbaords/sale-by-paymentTypeStore-analytics";
import { PaymentTableDetailItem } from "@/types/types/sale-by-paymentType-analytics.type";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SalesByPaymentMethodView() {
  const {
    isLoading, 
    metrics, 
    barChartData,
    donutChartData, 
    topListByGrowth, 
    tableDetails,
    fetchPaymentSalesSummary
  } = usePaymentSalesSummaryStore();
  const { shops, fetchShops } = useShopStore();
  
  // Filter States
  const [compareWithPrevious, setCompareWithPrevious] = useState<boolean>(true);
  const [selectedShop, setSelectedShop] = useState<string>("all");
  const [selectedFilter, setSelectedFilter] = useState<"daily" | "current_week" | "current_month" | "last_month" | "custom">("current_month");
  const [selectedGroupBy, setSelectedGroupBy] = useState<"Payment Method" | "Shop" | "Daily" | "None">("None");
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });

  // Fetch shops on mount
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Fetch report data when filters change using useCallback
  const loadData = useCallback(() => {
    fetchPaymentSalesSummary({
      shopId: selectedShop === "all" ? undefined : selectedShop,
      filter: selectedFilter,
      startDate: selectedFilter === "custom" ? dateRange.start : undefined,
      endDate: selectedFilter === "custom" ? dateRange.end : undefined,
      compareWithPrevious,
      groupBy: selectedGroupBy === "None" ? undefined : selectedGroupBy
    });
  }, [fetchPaymentSalesSummary, selectedShop, selectedFilter, dateRange.start, dateRange.end, compareWithPrevious, selectedGroupBy]);

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

  const [selectedSalePaymentTypeItem, setSelectedSalePaymentTypeItem] = useState<PaymentTableDetailItem | null>(null);
  const [isSalePaymentTypeDrawerOpen, setIsSalePaymentTypeDrawerOpen] = useState<boolean>(false);

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

  const effectiveDonutData = safeDonutChartData.length > 0 ? safeDonutChartData : safeTableDetails;

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
                <DropdownMenuItem onClick={() => setSelectedGroupBy("Payment Method")} className="text-xs font-semibold cursor-pointer">Payment Method</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroupBy("Shop")} className="text-xs font-semibold cursor-pointer">Shop</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroupBy("Daily")} className="text-xs font-semibold cursor-pointer">Daily</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroupBy("None")} className="text-xs font-semibold cursor-pointer">None</DropdownMenuItem>
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
                      data={effectiveDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey={chartMode === "sales" ? "value" : "transactions"}
                    >
                      {effectiveDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={(entry as { color?: string }).color || "#2563eb"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center absolute pointer-events-none">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Volume</span>
                  <span className="text-sm font-bold text-slate-900">
                    <CurrencyFormatter amount={typeof totalSalesVal === "number" ? totalSalesVal : (totalSalesVal?.current ?? 0)} />
                  </span>
                </div>
              </div>

              {/* Compact Mini Table List */}
              <div className="md:col-span-7 overflow-x-auto">
                <Table>
                  <TableHeader className="text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2 px-2 font-medium text-left">Method</TableHead>
                      <TableHead className="py-2 px-2 font-medium text-right">Total Sales</TableHead>
                      <TableHead className="py-2 px-2 font-medium text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-50">
                    {effectiveDonutData.map((item, i: number) => {
                      const itemName = "name" in item ? item.name : item.label;
                      const itemValue = "value" in item ? (item as { value: number }).value : item.totalSales;
                      const itemPercentage = "percentage" in item ? (item as { percentage: string }).percentage : `${item.percentageShare}%`;
                      const itemColor = "color" in item ? (item as { color?: string }).color : "#2563eb";

                      return (
                        <TableRow key={i} className="hover:bg-slate-50/50 border-0">
                          <TableCell className="py-2 px-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
                            <span className="text-slate-700 font-medium truncate max-w-30">{itemName}</span>
                          </TableCell>
                          <TableCell className="py-2 px-2 text-right font-semibold text-slate-900">
                            <CurrencyFormatter amount={itemValue} />
                          </TableCell>
                          <TableCell className="py-2 px-2 text-right text-slate-400">
                            {itemPercentage}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
              onChange={(e) => setGrowthMode(e.target.value as "growth" | "transactions")}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-600 outline-none"
            >
              <option value="growth">Growth (vs Last Month)</option>
              <option value="transactions">By Transactions</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {safeTopListByGrowth.map((item, i: number) => {
              const itemName = "name" in item ? item.name : (item as { label: string }).label;
              const itemType = "type" in item ? (item as { type: string }).type : (item.subtitle || "Payment Method");
              const itemValue = "value" in item ? (item as { value: number }).value : item.totalSales;
              const itemTransactions = "transactions" in item ? item.transactions : 0;
              const itemGrowth = "growth" in item ? (item as { growth: string }).growth : `${item.salesGrowth}%`;

              return (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg ${getPaymentBg(itemType)} flex items-center justify-center shrink-0`}>
                      {getPaymentIcon(itemType)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{String(itemName ?? "")}</p>
                      <p className="text-[11px] text-slate-400">{itemType} • {itemTransactions} txns</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900"><CurrencyFormatter amount={itemValue} /></p>
                    <p className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                      <ArrowUpRight className="h-3 w-3" /> {itemGrowth}
                    </p>
                  </div>
                </div>
              );
            })}
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
          <div className="w-full overflow-x-auto">
            <TableMain
              columns={paymentSalesColumns}
              data={safeTableDetails}
              loading={isLoading}
              columnVisibilityFilter={true}
              tableExportButtonVisible={true}
              tableFilterButtonVisible={true}
              placeholder="Search keyword"            
              searchKey="name"
              meta={{
                onViewPaymentAnalytics(payment: PaymentTableDetailItem) {
                  setSelectedSalePaymentTypeItem(payment);
                  setIsSalePaymentTypeDrawerOpen(true);
                },
              } as PaymentSalesTableMeta}
            />
          </div>
        </CardContent>
      </Card>

      <AppSheet
        isOpen={isSalePaymentTypeDrawerOpen}
        onClose={() => setIsSalePaymentTypeDrawerOpen(false)}
        title="Sales by Payment Method Performance"
        description="View individual sales metrics, total revenue generated, transaction volume, average order value, and target progress for this payment channel."
        maxWidth="lg"
      >
        {selectedSalePaymentTypeItem && (
          <PaymentDetailsDrawer payment={selectedSalePaymentTypeItem} />
        )}  
      </AppSheet>
    </div>
  );
}