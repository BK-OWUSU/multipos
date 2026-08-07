"use client";

import React, { useEffect } from "react";
import { FileText, Clock, CheckCircle2, DollarSign, Plus, Search, Filter } from "lucide-react";
import { useInvoiceStore } from "@/store/invoiceStore";

// Shadcn UI Component Imports from your attached project tree
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Assuming you have a reusable TanStack wrapper, or write the primitive inline
import TableMain from "@/components/reusables/table/TableMain";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { invoiceSummaryColumns } from "@/components/tablesColumnDef/shop/invoiceSummaryColumnDef";

export default function InvoicesDashboardPage() {
  const { filters, updateFiltersLocal, fetchInvoices, isLoading, getInvoiceSummaryList } = useInvoiceStore();
  const summaryList = getInvoiceSummaryList();

  // Trigger data pull immediately on filter dependency updates
  useEffect(() => {
    fetchInvoices();
  }, [filters.period, filters.status, filters.shopId, filters.page, filters.paymentType, fetchInvoices]);

  // Static metric calculation derived from your store list to replace breaking float points safely
  const totalInvoicesCount = summaryList?.length || 0;
  const pendingInvoicesCount = summaryList?.filter((i) => i.status === "PENDING").length || 0;
  const completedInvoicesCount = summaryList?.filter((i) => i.status === "COMPLETED").length || 0;
  const macroGrossSalesSum = summaryList?.reduce((acc, current) => acc + current.totalAmount, 0) || 0;

  return (
    <div className="w-full space-y-6 p-4 md:p-8 bg-gray-50/50 min-h-screen">
      
      {/* ── HEADER NAVIGATION SUB-SECTION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage all multi-tenant branch invoices.</p>
        </div>
        <Button className="bg-[#063970] hover:bg-[#063970]/90 text-white self-start sm:self-auto gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> New Invoice
        </Button>
      </div>

      {/* ── 1. METRIC SUMMARY CARDS GRID (RESPONSIVE CLAMPING) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Invoices</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalInvoicesCount}</h3>
              <p className="text-xs text-muted-foreground">All time log data</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending</p>
              <h3 className="text-2xl font-bold text-amber-600">{pendingInvoicesCount}</h3>
              <p className="text-xs text-muted-foreground">Due client payments</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid</p>
              <h3 className="text-2xl font-bold text-emerald-600">{completedInvoicesCount}</h3>
              <p className="text-xs text-muted-foreground">Settled invoices</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Amount</p>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900">
                {/* Fixed numeric parsing logic prevents system visual breaks */}
                <CurrencyFormatter amount={macroGrossSalesSum} />
              </div>
              <p className="text-xs text-muted-foreground">Enterprise gross pipeline</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. DYNAMIC INPUT CONTROLS / FILTER BAR ROUTER ── */}
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-4 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          
          {/* Main Context Search Field */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by invoice ID, sale ID or customer..." 
              className="pl-9 bg-gray-50/50 border-gray-200 focus-visible:bg-white"
            />
          </div>

          {/* Filtering Dropdown Group Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-3 w-full xl:w-auto">
            
            {/* Shop context selector */}
            <div className="flex flex-col gap-1.5 md:w-44">
              <Select 
                value={filters.shopId} 
                onValueChange={(val) => updateFiltersLocal({ shopId: val })}
              >
                <SelectTrigger className="bg-white border-gray-200 text-sm">
                  <SelectValue placeholder="Shop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  <SelectItem value="current-shop">Current Shop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status selector */}
            <div className="flex flex-col gap-1.5 md:w-44">
              <Select
                value={filters.status || "all-statuses"}
                onValueChange={(val) => updateFiltersLocal({ status: val === "all-statuses" ? "" : val as unknown as "COMPLETED" | "PENDING" | "CANCELLED" | "REFUNDED" })}
              >
                <SelectTrigger className="bg-white border-gray-200 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calendar Range Picker Trigger */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal bg-white border-gray-200 md:w-56 gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Select date range</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="range" initialFocus />
              </PopoverContent>
            </Popover>

            {/* Clear-down Actions Trigger */}
            <Button variant="outline" className="border-dashed border-gray-200 text-gray-600 gap-1.5 hover:bg-gray-50">
              <Filter className="w-3.5 h-3.5" /> Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. DATA LAYOUT WRAPPER SHEET ── */}
      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground animate-pulse font-medium">
              Synchronizing multi-tenant ledger states...
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              {/* TanStack configuration table executing rows mapped over customId records */}
              <div className="min-w-225 h-full">
                <TableMain
                columns={invoiceSummaryColumns}
                data = {summaryList || []}
                loading = {isLoading}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}