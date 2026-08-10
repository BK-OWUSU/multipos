"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  ArrowDownRight, ArrowRight, Layers, Loader2, Store, ChevronDown 
} from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import TableMain from "@/components/reusables/table/TableMain";
import {categorySalesColumns, CategorySalesTableMeta } from "@/components/tablesColumnDef/business/analytics/saleByCategroyAnalyticsColumnDef";
import { startOfMonth, format } from "date-fns";
import { AppSheet } from "@/components/reusables/AppSheet";
import { CategoryDetailsDrawer } from "@/components/detials-components/analytics/saleByCategoryDetailsViewer";
import { useShopStore } from "@/store/shopStore";
import { useCategorySalesSummaryStore } from "@/store/analytics-dashbaords/sale-by-category-analyticsStore";
import { CategoryTableDetailItem } from "@/types/types/sale-by-category-analytics.type";

export default function SalesByCategoryView() {
  // Stores
  const { 
    fetchCategorySalesSummary, 
    isLoading, 
    topCategoriesByGrowth, 
    categoryTableDetails, 
    donutChartData, 
    metrics,
    dateRange: storeDateRange 
  } = useCategorySalesSummaryStore();
  
  const { shops, fetchShops } = useShopStore();

  // Filter States
  const [selectedShop, setSelectedShop] = useState<string>("all");
  const [selectedFilter, setSelectedFilter] = useState<"daily" | "current_week" | "current_month" | "last_month" | "custom">("current_month");
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });
  const [compareWithPrevious, setCompareWithPrevious] = useState<boolean>(true);

  // UI Interactive States
  const [chartMode, setChartMode] = useState<"sales" | "transactions">("sales");
  const [growthMode, setGrowthMode] = useState<"sales" | "transactions">("sales");
  const [selectedSaleCategoryItem, setSelectedSaleCategoryItem] = useState<CategoryTableDetailItem | null>(null);
  const [isSaleCategoryDrawerOpen, setIsSaleCategoryDrawerOpen] = useState<boolean>(false);

  // Fetch shops on mount
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Fetch report data when filters change
  const loadData = useCallback(() => {
    fetchCategorySalesSummary({
      shopId: selectedShop === "all" ? undefined : selectedShop,
      filter: selectedFilter,
      startDate: selectedFilter === "custom" ? dateRange.start : undefined,
      endDate: selectedFilter === "custom" ? dateRange.end : undefined,
      compareWithPrevious,
    });
  }, [fetchCategorySalesSummary, selectedShop, selectedFilter, dateRange, compareWithPrevious]);

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
  };

  const chartColors = [
    "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", 
    "#06b6d4", "#eab308", "#ec4899", "#94a3b8"
  ];

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
                  <CurrencyFormatter amount={metrics?.totalSales.current || 0} />
                </h3>
              )}
              <p className={`text-xs font-medium flex items-center gap-1 ${(metrics?.totalSales.percentageChange || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {(metrics?.totalSales.percentageChange || 0) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} 
                {Math.abs(metrics?.totalSales.percentageChange || 0).toFixed(1)}% vs previous period
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
                  {(metrics?.totalTransactions.current || 0).toLocaleString()}
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
                  <CurrencyFormatter amount={metrics?.averageOrderValue.current || 0} />
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
                  {(metrics?.itemsSold.current || 0).toLocaleString()}
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
                  <CurrencyFormatter amount={metrics?.totalRefunds.current || 0} />
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
            <Button 
              variant="ghost" 
              onClick={handleResetFilters}
              className="w-full h-10 text-xs rounded-xl text-slate-600 hover:bg-slate-100 font-semibold border border-transparent hover:border-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Filters
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
                      data={donutChartData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey={chartMode === "sales" ? "totalSales" : "percentageShare"}
                    >
                      {(donutChartData || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center absolute pointer-events-none">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Sales</span>
                  {isLoading ? (
                    <div className="flex justify-center mt-1">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-slate-900">
                      <CurrencyFormatter amount={metrics?.totalSales.current || 0} />
                    </span>
                  )}
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
                    {(donutChartData || []).slice(0, 6).map((cat, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                          <span className="text-slate-700 font-medium truncate max-w-25">{cat.categoryName}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-slate-900">
                          <CurrencyFormatter amount={cat.totalSales} />
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">{cat.percentageShare}%</td>
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
              onChange={(e) => setGrowthMode(e.target.value as "sales" | "transactions")}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-600 outline-none"
            >
              <option value="sales">By Sales Growth</option>
              <option value="transactions">By Transactions</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-4">
            {(topCategoriesByGrowth || []).slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.categoryName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">
                    <CurrencyFormatter amount={item.totalSales} />
                  </p>
                  <p className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${item.salesGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {item.salesGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} 
                    {item.salesGrowth >= 0 ? `+${item.salesGrowth}%` : `${item.salesGrowth}%`}
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
           <div className="w-full overflow-x-auto">
            <TableMain
              columns={categorySalesColumns}
              data={categoryTableDetails || []}
              loading={isLoading}
              columnVisibilityFilter={true}
              tableExportButtonVisible={true}
              tableFilterButtonVisible={true}
              placeholder="Search keyword"            
              searchKey="categoryName"
              meta={{
                onViewCategoryAnalytics(category: CategoryTableDetailItem) {
                    setSelectedSaleCategoryItem(category);
                    setIsSaleCategoryDrawerOpen(true);
                },
              } as CategorySalesTableMeta}
            />
          </div>
        </CardContent>
      </Card>

      <AppSheet
        isOpen={isSaleCategoryDrawerOpen}
        onClose={() => setIsSaleCategoryDrawerOpen(false)}
        title="Sales by Category Analysis"
        description="View comprehensive category performance breakdown, itemized revenue shares, transaction volumes, and profit margin analysis."
        maxWidth="lg"
      >
        {selectedSaleCategoryItem && (
          <CategoryDetailsDrawer category={selectedSaleCategoryItem} />
        )}  
      </AppSheet>

    </div>
  );
}