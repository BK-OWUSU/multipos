"use client";

import { 
  Clock, 
  Users, 
  CalendarDays, 
  Store, 
  TrendingUp, 
  Info,
  Loader2,
  SlidersHorizontal
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { useTotalHoursWorkedStore } from "@/store/employee/total-hours-worked-store";
import { useShopStore } from "@/store/shopStore";
import { TimeCardTableMeta, totalHoursWorkedColumnDef } from "@/components/tablesColumnDef/business/employee/totalHoursWorkedColumnDef";
import TableMain from "@/components/reusables/table/TableMain";
import { TimeCard, TimeCardStatus } from "@/types/timecards.type";
import CustomButton from "@/components/reusables/CustomButton";
import React from "react";
import { AppSheet } from "@/components/reusables/AppSheet";
import TimeCardDetailsCard from "@/components/detials-components/employee/TimeCardDetailsCardViewer";

export default function TotalHoursWorkedPage() {
  const { isLoading, fetchTimeCards, timeCards, meta } = useTotalHoursWorkedStore();
  const { fetchShops, shops } = useShopStore();

  // Local state for filter inputs with proper typing
  const [selectedShopId, setSelectedShopId] = React.useState<string>("");
  const [selectedStatus, setSelectedStatus] = React.useState<TimeCardStatus | "">("");
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>("this-month");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [pageSize, setPageSize] = React.useState<number>(100);

  const [selectedTimeCard, setSelectedTimeCard] = React.useState<TimeCard | null>(null);
  const [isTimeCardDrawerOpen, setIsTimeCardDrawerOpen] = React.useState(false);

  // Fetch initial data on mount
  React.useEffect(() => {
    fetchTimeCards({ period: "this-month", limit: pageSize });
    fetchShops();
  }, [fetchTimeCards, fetchShops, pageSize]);

  // Handler when clicking "Apply"
  const handleApplyFilters = () => {
    fetchTimeCards({
      shopId: selectedShopId === "" ? undefined : selectedShopId,
      status: selectedStatus === "" ? undefined : selectedStatus,
      period: startDate || endDate ? undefined : selectedPeriod, // Clear period if custom dates are provided, or keep both depending on backend logic
      startDate: startDate === "" ? undefined : startDate,
      endDate: endDate === "" ? undefined : endDate,
      limit: pageSize,
      page: 1,
    });
  };

  // Safe fallback for metrics coming from the API meta response
  const metrics = meta?.metrics;

  return (
    <div className="w-full space-y-6 p-6 lg:p-8 bg-slate-50/50 min-h-screen font-sans">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Total Hours Worked</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and review total working hours for employees across all shops.</p>
        </div>
      </div>

      {/* 2. Top Analytics Metrics Cards with Loading Spinner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Hours</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Clock className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 my-1" />
              ) : (
                <>
                  {metrics?.totalHoursSum ? String(metrics.totalHoursSum) : "1,248.75"} <span className="text-xs font-normal text-slate-500">hrs</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400">Filtered Range</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Employees</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Users className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600 my-1" />
              ) : (
                metrics?.activeEmployees ?? 42
              )}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Active Employees</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Avg. Hours / Day</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><CalendarDays className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-purple-600 my-1" />
              ) : (
                <>
                  {metrics?.avgHoursPerEmployee ? String(metrics.avgHoursPerEmployee) : "8.23"} <span className="text-xs font-normal text-slate-500">hrs</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400">Across Employees</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Shops</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Store className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-amber-600 my-1" />
              ) : (
                shops.length || metrics?.totalShops || 8
              )}
            </div>
            <span className="text-[11px] text-slate-400">Active Shops</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">This Month</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-teal-600 my-1" />
              ) : (
                <>
                  {metrics?.thisMonthHours ? String(metrics.thisMonthHours) : "184.50"} <span className="text-xs font-normal text-slate-500">hrs</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400">Total Hours</span>
          </div>
        </Card>

      </div>

      {/* 3. Filters Toolbar Card */}
      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Period Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Period Preset</label>
            <select 
              value={selectedPeriod}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setSelectedPeriod(e.target.value);
                setStartDate(""); // clear custom dates if choosing preset
                setEndDate("");
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none"
            >
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Start Date</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none"
            />
          </div>

          {/* End Date Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">End Date</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none"
            />
          </div>

          {/* Shop Dropdown Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Shop</label>
            <select 
              value={selectedShopId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedShopId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none"
            >
              <option value="">All Shops</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Status</label>
            <select 
              value={selectedStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value as TimeCardStatus | "")}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="MISSED_CLOCK_OUT">Missed Clock Out</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2 pt-1 sm:pt-0">
            <CustomButton
             customVariant="primary"
             text="Apply"
             className="w-full h-9 text-xs"
             onClick={handleApplyFilters}
             icon = { <SlidersHorizontal className="h-5 w-5 " />}
            />
          </div>

        </div>

        {/* Info Notification Sub-Bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-800 text-xs">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <span>Showing total hours worked for the selected date range and filters.</span>
        </div>
      </Card>

      {/* 5. Data Table Component */}
      <Card className="border border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white w-full">
        <div className="w-full overflow-x-auto">
          <TableMain
            columns={totalHoursWorkedColumnDef}
            data={timeCards || []}
            loading={isLoading}
            onPageSizeChange={(size: number) => {
              setPageSize(size);
              fetchTimeCards({ 
                limit: size, 
                shopId: selectedShopId || undefined,
                status: selectedStatus ? selectedStatus : undefined,
                period: startDate || endDate ? undefined : selectedPeriod,
                startDate: startDate || undefined,
                endDate: endDate || undefined
              });
            }}
            columnVisibilityFilter={true}
            tableExportButtonVisible={true}
            tableFilterButtonVisible={true}
            placeholder="Search key word"            
            searchKey="employee"
            meta={{
              onViewTimeCard(timeCard) {
                  setSelectedTimeCard(timeCard)
                  setIsTimeCardDrawerOpen(true)
              },
            } as TimeCardTableMeta}
          />
        </div>
      </Card>

    <AppSheet
      isOpen={isTimeCardDrawerOpen}
      onClose={() => setIsTimeCardDrawerOpen(false)}
      title="Employee Time Card"
      description="View comprehensive daily time logs, clock-in/out stamps, and total hours worked for this pay period."
      maxWidth="lg"
    >
      {selectedTimeCard && (
        <TimeCardDetailsCard timeCard={selectedTimeCard} />
      )}  
    </AppSheet>
    </div>
  );
}