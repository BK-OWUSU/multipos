"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  CreditCard, 
  RotateCcw, 
  FileSpreadsheet, 
  Download,
  ChevronDown,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import TableMain from "@/components/reusables/table/TableMain";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { useSaleStore } from "@/store/saleStore";
import { Sale } from "@/types/sale.type";
import { saleTransactionsColumnDef } from "@/components/tablesColumnDef/business/sales-transactions/SalesColumnDef";
import { AppSheet } from "@/components/reusables/AppSheet";
import SaleDetailsDrawer from "@/components/detials-components/SaleDetailsDrawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToExcel, exportToPDF } from "@/lib/exports/exportUtils";
import { toast } from "sonner";

export default function SalesManagementView() {
  const { sales, fetchSales, loading } = useSaleStore();

  // Local states for filtering and drawer selection
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [period, setPeriod] = useState<string>("current-week");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  const [isExporting, startExportTransition] = useTransition();

  // Fetch sales on mount or filter changes if store supports parameters
  useEffect(() => {
    fetchSales?.({
      period: period,
      startDate: startDate,
      endDate: endDate
    });
  }, [endDate, fetchSales, period, startDate]);

  // Compute real stats dynamically from the actual sales array
  const totalTransactionsCount = sales?.length || 0;
  
  const grossSalesToday = sales?.reduce((acc, sale) => {
    if (sale.status !== "CANCELLED" && sale.status !== "REFUNDED") {
      return acc + Number(sale.totalAmount || 0);
    }
    return acc;
  }, 0) || 0;

  const averageOrderValue = totalTransactionsCount > 0 ? grossSalesToday / totalTransactionsCount : 0;

  const paymentsCollected = sales?.reduce((acc, sale) => {
    if (sale.status === "COMPLETED") {
      return acc + Number(sale.totalAmount || 0);
    }
    return acc;
  }, 0) || 0;

  const refundsTotal = sales?.reduce((acc, sale) => {
    if (sale.status === "REFUNDED" || Number(sale.totalAmount) < 0) {
      return acc + Math.abs(Number(sale.totalAmount || 0));
    }
    return acc;
  }, 0) || 0;

  // Handle period changes (automatically shifts to custom when dates are adjusted)
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setPeriod("custom");
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setPeriod("custom");
  };

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    if (val !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

const handleExport = (type: "excel" | "pdf") => {
  if (!sales || sales.length === 0) {
    toast.error("No sales records available to export.");
    return;
  }

  startExportTransition(async () => {
    const exportPromise = async () => {
      // Flatten the nested database objects into a clean tabular structure
      const formattedData = sales.map((sale) => {
        // Flatten nested relation names safely
        const customerName = sale.customer 
          ? `${sale.customer.firstName} ${sale.customer.lastName}`.trim()
          : "Walk-in Customer";
          
        const employeeName = sale.employee 
          ? `${sale.employee.firstName} ${sale.employee.lastName}`.trim()
          : "N/A";

        return {
          "Receipt / Sale ID": sale.customId || sale.id,
          "Date": new Date(sale.createdAt).toLocaleDateString(),
          "Shop": sale.shop?.name || "N/A",
          "Employee": employeeName,
          "Customer": customerName,
          "Payment Method": sale.paymentType,
          "Status": sale.status,
          "Total Amount": sale.totalAmount,
          "Discount": sale.discountAmount || 0,
        };
      });

      // Configuration for filename and report titles
      const dateString = new Date().toISOString().slice(0, 10);
      const config = {
        filename: `sales_report_${dateString}`,
        sheetName: "Sales Overview",
        title: `Sales Overview Report - Generated ${new Date().toLocaleDateString()}`,
      };

      // Route parameters to the utility tools
      if (type === "excel") {
        exportToExcel(formattedData, config);
        return "Sales Excel report downloaded successfully!";
      }

      if (type === "pdf") {
        exportToPDF(formattedData, config);
        return "Sales PDF report downloaded successfully!";
      }

      throw new Error("Invalid export configuration variant selected.");
    };

    toast.promise(exportPromise(), {
      loading: `Processing sales data for ${type.toUpperCase()}...`,
      success: (message) => message,
      error: (err) => err.message || `Failed to generate sales ${type.toUpperCase()} file.`,
    });
  });
};

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50/30 min-h-screen">
      
      {/* ─── PAGE HEADER & TOP CONTROLS ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">All Sale Transactions</h1>
          <p className="text-sm text-slate-500">View and manage all sale transactions across all shops in your business.</p>
        </div>
        
        <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-white" disabled={isExporting}>
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export Report</span>
              <ChevronDown className="h-4 w-4 text-slate-400 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => handleExport("excel")} 
              className="gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export as Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport("pdf")} 
              className="gap-2 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-rose-600" />
              <span>Export as PDF</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

          {/* Date Range Inputs & Period Selector */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="h-8 w-32.5 text-xs font-medium border-none bg-slate-50">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-week">Current Week</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="h-8 text-xs border-slate-200 w-31.25"
              />
              <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="h-8 text-xs border-slate-200 w-31.25"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── METRICS STATS CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Sales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            <CurrencyFormatter amount={grossSalesToday} />
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Active dataset metrics
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Transactions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {totalTransactionsCount.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Recorded receipts
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Order Value</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            <CurrencyFormatter amount={averageOrderValue} />
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Per transaction average
          </div>
        </div>

        {/* Payments Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Payments Collected</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            <CurrencyFormatter amount={paymentsCollected} />
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Successfully completed
          </div>
        </div>

        {/* Refunds */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Refunds</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            <CurrencyFormatter amount={refundsTotal} />
          </div>
          <div className="text-xs text-rose-600 font-medium">
            Returned or refunded
          </div>
        </div>
      </div>

      {/* ─── TABLE CONTAINER & DETAILS DRAWER ────────────────────────── */}
      <Card className="border border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white w-full">
        <div className="w-full overflow-x-auto">
          <TableMain
            columns={saleTransactionsColumnDef}
            data={sales || []}
            columnVisibilityFilter={true}
            tableFilterButtonVisible={true}
            tableExportButtonVisible={true}
            searchKey="customId"
            placeholder="Search by invoice, customer, or payment type..."
            loading={loading}
            globalFilterFn={(row, filterValue) => {
              const search = filterValue.toLowerCase();
              const sale = row.original as Sale; 
              
              const customerMatch = sale.customer 
                ? `${sale.customer.firstName} ${sale.customer.lastName} ${sale.customer.phone || ""}`.toLowerCase().includes(search)
                : "walk-in customer".includes(search);

              const invoiceMatch = sale.invoice?.customId?.toLowerCase().includes(search) ?? false;
              const rootCustomId = sale.customId.toLowerCase().includes(search);
              const paymentType = sale.paymentType.toLowerCase().includes(search);

              return customerMatch || invoiceMatch || rootCustomId || paymentType;
            }}
            meta={{
              onViewSaleDetails: (sale: Sale) => {
                setSelectedSale(sale);
                setIsDetailsOpen(true);
              },
              onViewSale: (sale: Sale) => {
                setSelectedSale(sale);
                setIsDetailsOpen(true);
              }
            }}
          />
        </div>
      </Card>

      <AppSheet
        title=""
        isOpen={isDetailsOpen}
        maxWidth="xl"
        onClose={() => setIsDetailsOpen(false)}
      >
        {selectedSale && (
          <SaleDetailsDrawer
            sale={selectedSale}
          />
        )}  
      </AppSheet>

    </div>
  );
}