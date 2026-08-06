"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Download,
  AlertCircle,
  LogIn,
  LogOut,
  Coffee,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimeCardStore } from "@/store/timeCardStore";
import TableMain from "@/components/reusables/table/TableMain";
import { timeCardColumns, TimeCardLog } from "@/components/tablesColumnDef/business/timeCardColumns";
import { Decimal } from "@prisma/client/runtime/client";
import { toast } from "sonner";


export default function EmployeeTimeCardPage() {



  //Connect Zustand State Actions and Selectors
  const { activeTimeCards,historicalLogs,loading, fetchActiveTimeCards,fetchTimeCards, clockIn, clockOut} = useTimeCardStore();

  // Find if this specific employee context currently has an active shift item
  // (In a multi-employee view, you can filter by employee profile, but here we read the live shift)
  const currentActiveShift = activeTimeCards[0] || null;
  const isClockedIn = !!currentActiveShift;
  const [liveDuration, setLiveDuration] = useState("00:00:00");
  const [selectedPeriod, setSelectedPeriod] = useState("current-week");


  // 1. Automatically fetch data whenever our local filter state changes
  // useEffect(() => {
  //   fetchInvoices();
  // }, [filters.period, filters.startDate, filters.endDate, filters.status, filters.paymentType, filters.shopId, filters.page]);

  //  console.log("ACTIVE TIME CARDS: ", activeTimeCards)
  // 🟢 Fetch active card arrays on mount
  useEffect(() => {
    // Pass placeholder fallback businessId or handle dashboard routing initialization logic
    fetchActiveTimeCards("current-business-id");
    fetchTimeCards({
      period: selectedPeriod, 
    });
  }, [fetchActiveTimeCards, fetchTimeCards, selectedPeriod]);

 
  // 🟢 Robust Live Timer Mechanism - Fixed Cascading Render Warning
useEffect(() => {
  // 1. Guard check: If not clocked in, let the loop bail out *without* a synchronous state update
  if (!isClockedIn || !currentActiveShift?.clockIn) {
    return;
  }

  const calculateDuration = () => {
    const startTime = new Date(currentActiveShift.clockIn).getTime();
    const now = new Date().getTime();
    const differenceMs = Math.max(0, now - startTime);

    const totalSeconds = Math.floor(differenceMs / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, "0");
    setLiveDuration(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
  };

  // Run immediately on mount/shift changes *only* if the worker is clocked in
  calculateDuration();

  // Setup precision interval tick
  const interval = setInterval(calculateDuration, 1000);
  
  return () => {
    clearInterval(interval);
    // Reset state cleanly on unmount or when clock-out happens *safely* inside the cleanup phase
    setLiveDuration("00:00:00");
  };
}, [isClockedIn, currentActiveShift]);

  // 🟢 Handle Client Interaction Submissions Safely
  const handleClockAction = async () => {
    if (isClockedIn && currentActiveShift) {
      // Execute global clock out mutation
      await clockOut(currentActiveShift.id, "Shift ended from main terminal dashboard view.");
    } else {
      // Execute global clock in mutation (Backend extracts employeeId from JWT session)
      await clockIn("placeholder-employee-id", "Shift initiated via web portal.");
    }
  };

  // Helper formatting utility for displaying initial check-in time cleanly
  const formatClockInTime = (dateInput?: Date | string) => {
    if (!dateInput) return "--:-- --";
    return new Date(dateInput).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatClockInDate = (dateInput?: Date | string) => {
    if (!dateInput) return "No active shift tracking";
    return new Date(dateInput).toLocaleDateString([], {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };

// ── DERIVE LIVE SUMMARY METRICS FROM HISTORICAL LOGS ─────────────────
const summaryMetrics = React.useMemo(() => {
  if (!historicalLogs || historicalLogs.length === 0) {
    return { totalDays: 0, totalHours: 0, averageHours: 0, overtimeHours: 0 };
  }

  // 1. Calculate Total Hours safely parsing Prisma Decimals without 'any'
  const totalHours = historicalLogs.reduce((sum: number, log: TimeCardLog) => {
    // Only accumulate hours for completed shifts
    if (log.status === "ACTIVE" || !log.totalHours) return sum;
    
    const hoursNum = log.totalHours && typeof log.totalHours === "object" && "toNumber" in log.totalHours
      ? (log.totalHours as Decimal).toNumber()
      : Number(log.totalHours);
      
    return sum + hoursNum;
  }, 0);

  // 2. Count Unique Days worked to handle multi-shift days cleanly
  const uniqueDays = new Set<string>(
    historicalLogs
      .filter((log: TimeCardLog) => log.clockIn)
      .map((log: TimeCardLog) => {
        const dateObj = log.clockIn instanceof Date ? log.clockIn : new Date(log.clockIn);
        return dateObj.toISOString().split("T")[0];
      })
  );
  const totalDays = uniqueDays.size;

  // 3. Calculate Average Hours worked per distinct day
  const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

  // 4. Calculate Overtime safely using explicit TimeCardLog parameters
  const overtimeHours = historicalLogs.reduce((sum: number, log: TimeCardLog) => {
    if (log.status === "ACTIVE" || !log.totalHours) return sum;

    const hoursNum = log.totalHours && typeof log.totalHours === "object" && "toNumber" in log.totalHours
      ? (log.totalHours as Decimal).toNumber()
      : Number(log.totalHours);

    // If an individual shift goes over 8.00 hours, stack the surplus as overtime
    const shiftOvertime = hoursNum > 8 ? hoursNum - 8 : 0;
    return sum + shiftOvertime;
  }, 0);

  return {
    totalDays,
    totalHours,
    averageHours,
    overtimeHours,
  };
}, [historicalLogs]);


  // Helper to get a formatted range string for a given offset from the current week
  const getWeekRangeLabel = (weeksAgo: number = 0): string => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Sun) - 6 (Sat)
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay - (weeksAgo * 7));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formatOptions: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit" };
    const yearOptions: Intl.DateTimeFormatOptions = { year: "numeric" };
    
    return `${startOfWeek.toLocaleDateString([], formatOptions)} – ${endOfWeek.toLocaleDateString([], formatOptions)}, ${endOfWeek.toLocaleDateString([], yearOptions)}`;
  };


const handleExportCSV = () => {
  // 1. Guard check: Ensure data exists before processing
  if (!historicalLogs || historicalLogs.length === 0) {
    toast.info("No time card entries available to export for this period.");
    return;
  }

  // 2. Define the header columns for the spreadsheet CSV (Exactly 6 columns)
  const headers: string[] = ["Date", "Clock In", "Clock Out", "Total Hours", "Status", "Notes"];

// 3. Map over records using your explicit type contract safely
const csvRows: string[] = historicalLogs.map((log: TimeCardLog): string => {
  
  const formatDecimal = (val: string | number | Decimal | null | undefined): string => {
    if (!val) return "0.00";
    if (typeof val === "object" && "toNumber" in val) {
      return (val as Decimal).toNumber().toFixed(2);
    }
    return Number(val).toFixed(2);
  };

  // 1. 🟢 Force formatting options without internal commas, OR wrap in quotes
  const dateStr = log.clockIn 
    ? `"${new Date(log.clockIn).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}"` 
    : '""';
    
  // 2. 🟢 Wrap times in quotes to keep them safely bundled as single items
  const clockInTime = log.clockIn 
    ? `"${new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"` 
    : '""';
    
  const clockOutTime = log.clockOut 
    ? `"${new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"` 
    : '"--"';
  
  // 3. 🟢 Clean internal quotes out of notes, then wrap in quotes
  const sanitizedNotes = log.notes ? `"${log.notes.replace(/"/g, '""')}"` : '""';

  // 4. Everything here will align 1:1 beautifully because commas are protected by quotes
  return [
    dateStr,
    clockInTime,
    clockOutTime,
    formatDecimal(log.totalHours),
    log.status,
    sanitizedNotes
  ].join(",");
});

  // 4. 🟢 Cleanest merge strategy: Join arrays distinctly to prevent cell shifting
  const headerLine = headers.join(",");
  const dataLines = csvRows.join("\n");
  const csvContent = `${headerLine}\n${dataLines}`;

  // 5. Trigger an automated physical browser download sequence
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `TimeCard_Report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    <div className="space-y-6 p-6 max-w-400 mx-auto bg-slate-50/50 min-h-screen text-slate-900">
      
      {/* ── HEADER NAVIGATION ────────────────────────────────────────────── */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employee Time Card</h1>
        <p className="text-sm text-slate-500">Track your daily work hours and attendance</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* Bound the state handler directly to the dropdown engine */}
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-64 bg-white h-10 border-slate-200 shadow-sm font-medium">
            <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="current-week">This Week ({getWeekRangeLabel(0)})</SelectItem>
            <SelectItem value="last-week">Last Week ({getWeekRangeLabel(1)})</SelectItem>
            <SelectItem value="current-month">This Month</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          className="gap-2 bg-white h-10 border-slate-200 shadow-sm font-semibold text-slate-700"
          onClick={handleExportCSV}
          >
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>
    </div>

    {/* ── TOP METRICS BLOCK (NOW FULLY DYNAMIC) ─────────────────────────── */}
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Days</p>
            <h3 className="text-2xl font-bold tracking-tight mt-0.5">
              {summaryMetrics.totalDays}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Selected Period</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Hours</p>
            <h3 className="text-2xl font-bold tracking-tight mt-0.5">
              {summaryMetrics.totalHours.toFixed(2)}{" "}
              <span className="text-sm font-normal text-slate-500">hrs</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Selected Period</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Hours/Day</p>
            <h3 className="text-2xl font-bold tracking-tight mt-0.5">
              {summaryMetrics.averageHours.toFixed(2)}{" "}
              <span className="text-sm font-normal text-slate-500">hrs</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Selected Period</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overtime Hours</p>
            <h3 className="text-2xl font-bold tracking-tight mt-0.5">
              {summaryMetrics.overtimeHours.toFixed(2)}{" "}
              <span className="text-sm font-normal text-slate-500">hrs</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Selected Period</p>
          </div>
        </CardContent>
      </Card>
    </div>

      {/* ── MAIN WORKSPACE CONTAINER ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COMPONENT: PLACEHOLDER DATA VIEW */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/30">
              <h2 className="font-bold text-slate-800 tracking-tight text-base">Time Card Entries</h2>
            </div>
            
            {/* Keeping Table Data Content Static as Requested */}
            <div className="overflow-x-auto">
              <TableMain
                columns={timeCardColumns}
                data={historicalLogs || []}
              />
            </div>
          </Card>
        </div>

        {/* RIGHT COMPONENT: DYNAMIC SHIFT CONTROL ACTION PANE */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Today&apos;s Status</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center">
                {isClockedIn ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5 px-3 py-1 font-semibold text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Currently Clocked In
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 gap-1.5 px-3 py-1 font-semibold text-xs">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Currently Clocked Out
                  </Badge>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-slate-400 font-medium block">Clocked In At</span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {formatClockInTime(currentActiveShift?.clockIn)}
                </h2>
                <span className="text-xs font-medium text-slate-400">
                  {formatClockInDate(currentActiveShift?.clockIn)}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">Working Duration</span>
                <div className="text-3xl font-mono font-bold tracking-tight text-emerald-600 flex items-baseline gap-1">
                  {liveDuration}
                  <span className="text-xs font-sans font-medium text-slate-400">hrs</span>
                </div>
              </div>

              <Button 
                onClick={handleClockAction}
                disabled={loading}
                className={`w-full font-bold h-11 tracking-wide shadow-sm gap-2 transition-colors ${
                  isClockedIn 
                    ? "bg-rose-600 hover:bg-rose-700 text-white" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isClockedIn ? (
                  <>
                    <LogOut className="h-4 w-4" /> {loading ? "Ending..." : "Clock Out"}
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> {loading ? "Starting..." : "Clock In"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* BLOCK: HISTORICAL MONTHLY SUMMARY */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Summary</CardTitle>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-55 bg-white h-10 border-slate-200 shadow-sm font-medium">
                  <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {/* 🟢 Meaningful key tokens for the service layer */}
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="current-week">This Week</SelectItem>
                  <SelectItem value="last-week">Previous Week</SelectItem>
                  <SelectItem value="current-month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-sm font-medium">
              <div className="flex justify-between items-center text-slate-500">
                <span>Total Days Worked</span>
                <span className="font-bold text-slate-800">
                  {summaryMetrics.totalDays}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-slate-500">
                <span>Total Hours</span>
                <span className="font-bold text-slate-800">
                  {summaryMetrics.totalHours.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-400">hrs</span>
                </span>
              </div>
              
              <div className="flex justify-between items-center text-slate-500">
                <span>Average Hours/Day</span>
                <span className="font-bold text-slate-800">
                  {summaryMetrics.averageHours.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-400">hrs</span>
                </span>
              </div>
              
              <div className="flex justify-between items-center text-slate-500 pb-2">
                <span>Overtime Hours</span>
                <span className="font-bold text-slate-800">
                  {summaryMetrics.overtimeHours.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-400">hrs</span>
                </span>
              </div>
              
              <Separator className="bg-slate-100" />
              <Button 
                variant="ghost" 
                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 font-bold text-xs gap-1.5 mt-1"
                onClick={() => {
                  toast.success("View full report coming up soon")
                }}
                >
                <Clock className="h-3.5 w-3.5" /> View Full Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── BOTTOM COMPLIANCE FOOTER NOTE ────────────────────────────────── */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-blue-900">Note</h4>
          <p className="text-xs text-blue-700/90 leading-relaxed">
            Please ensure you clock in and out accurately. Contact your manager if you need any corrections.
          </p>
        </div>
      </div>
    </div>
  );
}