"use client";

import React, { useEffect, useState } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Printer, 
  Coins,
  FileText,
  ShieldAlert,
  CheckCircle,
  Wallet,
  Store,
  Loader2
} from "lucide-react";

// Shadcn UI Primitives
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { useSaleStore } from "@/store/saleStore";
import CashRegisterInterceptor from "@/components/reusables/security/CashRegisterInterceptor";
import TableMain from "@/components/reusables/table/TableMain";
import { cashSessionColumns } from "@/components/tablesColumnDef/business/cashSessionColumnDef";
import { useInvoiceStore } from "@/store/invoiceStore";
import { invoiceSummaryColumns } from "@/components/tablesColumnDef/shop/invoiceSummaryColumnDef";



// Currency Configuration for GHS Denominations
const GH_DENOMINATIONS = [
  { label: "₵200 Note", value: 200 },
  { label: "₵100 Note", value: 100 },
  { label: "₵50 Note", value: 50 },
  { label: "₵20 Note", value: 20 },
  { label: "₵10 Note", value: 10 },
  { label: "₵5 Note", value: 5 },
  { label: "₵2 Note", value: 2 },
  { label: "₵1 Coin", value: 1 },
  { label: "50p Coin", value: 0.5 },
];

export default function CashRegisterPage() {
  // Bind Zustand Store Hooks
  const { 
    activeSession,
    cashSessionSummary,
    fetchActiveCashSession, 
    loading, 
    closeCashSession,
    fetchSummaryCashSessions 
  } = useSaleStore();
  const {fetchInvoices, getInvoiceSummaryList, isLoading} = useInvoiceStore()
  const invoiceSummaryList = getInvoiceSummaryList();
  
  const [tempCounts, setTempCounts] = useState<Record<string, number>>({});
  const [actualCashCount, setActualCashCount] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>("");
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Synchronize state context maps upon mount
  // ── 🟢 SINGLE ROUTE INITIALIZATION CHECK
  useEffect(() => {
    fetchActiveCashSession();
    fetchSummaryCashSessions();
        fetchInvoices({
        period: "current-month",
        shopId: "current-shop",
        page: 1,
        limit: 20
      })
  }, [fetchActiveCashSession, fetchInvoices, fetchSummaryCashSessions]);

  // ── ⏳ LOADING BOUNDARY WHEEL
  if (loading && activeSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading terminal state logs...</p>
        </div>
      </div>
    );
  }

  // If no shift is open, mount the overlay modal and stop execution to protect calculations
  if (!activeSession) {
    return <CashRegisterInterceptor />;
  }

  // Handle live calculation parameters derived from active session balances
  const openingFloat = activeSession ? Number(activeSession.startFloat) : 0;
  
  // Simulated operational sub-metrics (These will bind natively to your SaleService aggregates)
  const cashSales = activeSession ? 1250.00 : 0; 
  const cashIn = activeSession ? 150.00 : 0;
  const cashOut = activeSession ? 100.00 : 0;
  
  // Target balance equation matching backend aggregation architecture
  const expectedCash = openingFloat + cashSales + cashIn - cashOut;
  const variance = actualCashCount > 0 ? actualCashCount - expectedCash : 0;

  // Handle closing transaction sequence submission
  const handleCloseRegister = async () => {
    await closeCashSession({
      cashSessionId: activeSession?.id || "",
      actualCash: actualCashCount,
      notes: closingNotes || undefined,
    });
    // Clear out counter cache lines upon successful closure
    setTempCounts({});
    setActualCashCount(0);
    setClosingNotes("");
  };

  const handleQtyChange = (valStr: string, qtyStr: string) => {
    const qty = qtyStr === "" ? 0 : parseInt(qtyStr, 10);
    setTempCounts(prev => ({ ...prev, [valStr]: qty }));
  };

  const calculateTempTotal = () => {
    return Object.entries(tempCounts).reduce((acc, [valueStr, qty]) => {
      return acc + (parseFloat(valueStr) * qty);
    }, 0);
  };

  const applyCountToRegister = () => {
    setActualCashCount(calculateTempTotal());
    setIsSheetOpen(false);
  };

  // LOADING BOUNDARY WHEEL ──────────────────────────────────────────
  if (loading && !activeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading terminal state logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 lg:p-8 text-slate-900 antialiased font-sans">
 
      {/* 🧾 TITLE HEADER SECTION */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Cash Register</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            Manage your cash register sessions, cash movements and reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <span className="font-semibold text-slate-400">STATUS:</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
              {activeSession?.status || "CLOSED"}
            </span>
          </div>
          <Button variant="outline" size="sm" className="bg-white text-slate-700 border-slate-200 font-bold text-xs h-10 rounded-xl shadow-sm gap-2">
            <Printer className="w-4 h-4 text-slate-400" /> Print X-Report
          </Button>
        </div>
      </header>

      {/* 📊 TOP STREAMING METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50/80 text-blue-600 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opening Float</p>
              <h4 className="text-base font-black text-slate-900 mt-0.5">GHS {openingFloat.toFixed(2)}</h4>
              <p className="text-[10px] text-slate-400 font-medium">Logged on Shift Open</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50/80 text-blue-600 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Sales</p>
              <h4 className="text-base font-black text-slate-900 mt-0.5">GHS {cashSales.toFixed(2)}</h4>
              <p className="text-[10px] text-blue-600 font-bold">Shift Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50/80 text-blue-600 shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash In</p>
              <h4 className="text-base font-black text-slate-900 mt-0.5">GHS {cashIn.toFixed(2)}</h4>
              <p className="text-[10px] text-slate-400 font-medium">Adjustments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50/80 text-orange-600 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Out</p>
              <h4 className="text-base font-black text-slate-900 mt-0.5">GHS {cashOut.toFixed(2)}</h4>
              <p className="text-[10px] text-slate-400 font-medium">Payouts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50/80 text-indigo-600 shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Cash</p>
              <h4 className="text-base font-black text-blue-600 mt-0.5">GHS {expectedCash.toFixed(2)}</h4>
              <p className="text-[9px] text-slate-400 font-medium">(System Calculation)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500 shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actual Cash</p>
              <h4 className="text-base font-black text-slate-900 mt-0.5">
                {actualCashCount > 0 ? `GHS ${actualCashCount.toFixed(2)}` : "GHS 0.00"}
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                {actualCashCount > 0 ? "Counted" : "Not Counted Yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🛒 MAIN BALANCING GRID WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* LEFT COLUMN: LIVE RUNTIME SUMMARY BLOCK */}
        <div className="lg:col-span-4">
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm h-full flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-sm text-slate-900">Cash Register Summary</h3>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div className="flex justify-between"><span className="text-slate-400">Register ID</span><span className="font-mono font-bold text-slate-700 truncate max-w-37.5">{activeSession?.customId || "---"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Opened By Employee ID</span><span className="font-bold text-slate-800">{activeSession?.openedById || "---"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Opened At</span><span className="font-bold text-slate-800">{activeSession ? new Date(activeSession.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "---"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Opening Float</span><span className="font-bold text-slate-900">GHS {openingFloat.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Total Cash Sales</span><span className="font-bold text-slate-900">GHS {cashSales.toFixed(2)}</span></div>
                
                <hr className="border-slate-100 my-2" />
                
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-slate-900 font-bold">Expected Cash</span>
                  <span className="font-black text-blue-600">GHS {expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Actual Cash</span>
                  <span className="font-bold text-slate-800">{actualCashCount > 0 ? `GHS ${actualCashCount.toFixed(2)}` : "-"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Variance</span>
                  <span className={`font-bold ${variance === 0 ? "text-slate-700" : variance > 0 ? "text-indigo-600" : "text-orange-600"}`}>
                    {actualCashCount > 0 ? `GHS ${variance.toFixed(2)}` : "-"}
                  </span>
                </div>
              </div>
            </CardContent>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl">
              <Button 
                onClick={handleCloseRegister}
                disabled={actualCashCount === 0 || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Close Register & Reconcile
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: CASH TRANSACTION ACTIONS TIMELINE */}
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <CardContent className="p-6">
               <div className="overflow-x-auto">
                <TableMain
                  columns={invoiceSummaryColumns}
                  data={invoiceSummaryList || []}
                  loading = {isLoading}
                />
                </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 🗄️ LOWER LEVEL RAILS: REGISTRATION HISTORY & COUNT SHEET CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HISTORY TABLE LIST */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-400" /> Register Status Logs
                </h3>
              </div>

              <div className="overflow-x-auto">
                <TableMain
                  columns={cashSessionColumns}
                  data= {cashSessionSummary || []}
                  loading = {loading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ACTIVE RECONCILIATION ACTION CONSOLE */}
        <div className="lg:col-span-5">
          <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Cash Count (When Closing)
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Expected Cash</span>
                  <span className="text-sm font-black text-slate-900">GHS {expectedCash.toFixed(2)}</span>
                </div>

                {/* COUNT INPUT ROW + DRAWER TRIGGER */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">GHS</span>
                    <Input 
                      type="text" 
                      readOnly
                      placeholder="0.00" 
                      value={actualCashCount > 0 ? actualCashCount.toFixed(2) : ""} 
                      className="pl-11 h-10 rounded-xl border-slate-200 font-bold text-sm bg-slate-50/50 cursor-not-allowed"
                    />
                  </div>

                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="h-10 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl gap-1.5 px-4 shadow-sm">
                        <Coins className="w-4 h-4 text-blue-500" /> Count Cash
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white p-6 font-sans">
                      <SheetHeader className="pb-4 border-b border-slate-100">
                        <SheetTitle className="font-black text-base text-slate-900">Denomination Counter</SheetTitle>
                        <SheetDescription className="text-xs font-medium text-slate-400">
                          Input the quantities of physical notes and coins currently in the drawer vault.
                        </SheetDescription>
                      </SheetHeader>
                      
                      <div className="space-y-3 my-6">
                        {GH_DENOMINATIONS.map((den) => (
                          <div key={den.label} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100/80 gap-4">
                            <span className="text-xs font-bold text-slate-600 w-24 shrink-0">{den.label}</span>
                            <Input 
                              type="number"
                              min="0"
                              placeholder="0"
                              value={tempCounts[den.value.toString()] || ""}
                              onChange={(e) => handleQtyChange(den.value.toString(), e.target.value)}
                              className="w-24 h-8 text-center font-bold text-xs bg-white border-slate-200 rounded-lg focus-visible:ring-blue-600"
                            />
                            <span className="text-xs font-black text-slate-900 text-right min-w-15">
                              ₵{((tempCounts[den.value.toString()] || 0) * den.value).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <SheetFooter className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-sm font-bold text-slate-900 w-full px-1 mb-2">
                          <span>Total Calculated:</span>
                          <span className="text-base font-black text-blue-600">GHS {calculateTempTotal().toFixed(2)}</span>
                        </div>
                        <Button onClick={applyCountToRegister} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md">
                          Apply Count To Drawer
                        </Button>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* DRIFT ACCELERATOR ASSESSMENT LOG PANEL */}
                {actualCashCount > 0 && (
                  <div className={`p-3 rounded-xl border text-xs font-medium ${
                    variance === 0 
                      ? "bg-blue-50/50 border-blue-100 text-blue-800" 
                      : variance > 0 
                      ? "bg-indigo-50/60 border-indigo-100 text-indigo-800" 
                      : "bg-orange-50/50 border-orange-100 text-orange-800"
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      {variance === 0 ? <CheckCircle className="w-4 h-4 text-blue-600" /> : <ShieldAlert className="w-4 h-4 text-orange-600" />}
                      Reconciliation Result: {variance === 0 ? "Balanced" : variance > 0 ? "Overage" : "Shortage"}
                    </div>
                    <p className="text-[11px] opacity-85 mt-0.5">
                      The physical cash drawer variance evaluates to <span className="font-bold">GHS {variance.toFixed(2)}</span>.
                    </p>
                  </div>
                )}

                {/* SHIFT LOG CLOSURE DATA */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Session Notes</label>
                  <textarea 
                    placeholder="Add any note about the closing..." 
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    className="w-full h-20 text-xs font-medium p-3 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}