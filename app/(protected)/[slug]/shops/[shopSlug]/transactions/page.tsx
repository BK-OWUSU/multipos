"use client"

import React, { useEffect, useMemo, useState } from "react"
import { 
  ArrowUpRight, 
  Download, 
  ShoppingBag,
  RotateCcw,
  Coins,
  AlertTriangle,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSaleStore } from "@/store/saleStore"
import TableMain from "@/components/reusables/table/TableMain"
import { shopTransactionColumnDef } from "@/components/tablesColumnDef/shop/shopTransactionColumnDef"
import { Sale } from "@/types/sale.type"
import CurrencyFormatter from "@/components/reusables/CurrencyFormter"
import SaleDetailsDrawer from "@/components/detials-components/SaleDetailsDrawer"
import { useAuthStore } from "@/store/useAuthStore"
import { AppSheet } from "@/components/reusables/AppSheet"


export default function ShopTransactionsPage() {
  const { sales, fetchSales, loading } = useSaleStore();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const currentShopId  = useAuthStore((state)=> state.user?.currentShop?.id);
  
  useEffect(() => {
    fetchSales({ 
      period: "current-week",
      shopId: currentShopId, 
      limit: 400 
    })
  }, [currentShopId, fetchSales])

  // ─── DYNAMIC METRIC CALCULATIONS ───────────────────────────
  const stats = useMemo(() => {
    const saleItems = sales || [];
    
    // 1. Total Transactions Count
    const totalTransactions = saleItems.length;

    // 2. Gross Sales (Sum of all transactions where status is COMPLETED and totalAmount > 0)
   const grossSalesToday = saleItems
  .filter(s => s.status === "COMPLETED" && Number(s.totalAmount) > 0)
  .reduce((sum, s) => sum + Number(s.totalAmount), 0);


// 3. Refunds & Returns (Do the same here just to be safe!)
const totalRefunds = saleItems
  .filter(s => s.status === "REFUNDED" || Number(s.totalAmount) < 0)
  .reduce((sum, s) => sum + Math.abs(Number(s.totalAmount)), 0);

// 4. Expected Cash in Drawer
const expectedCash = saleItems
  .filter(s => s.status === "COMPLETED")
  .reduce((sum, s) => {
    const totalAmt = Number(s.totalAmount);
    
    if (s.paymentType === "CASH") {
      return sum + totalAmt;
    }
    if (s.paymentType === "SPLIT" && s.payments) {
      const cashPortion = s.payments
        .filter(p => p.method === "CASH" && p.status === "COMPLETED")
        .reduce((pSum, p) => pSum + Number(p.amount), 0);
      return sum + cashPortion;
    }
    return sum;
  }, 0);

    // 5. Voided / Cancelled Transaction Flags count
    const voidedCount = saleItems.filter(s => s.status === "CANCELLED").length;

    return [
      { 
        title: "Total Transactions", 
        count: totalTransactions.toLocaleString(), 
        trend: "Live Records", 
        isPositive: true, 
        icon: ShoppingBag, 
        color: "text-blue-800 bg-blue-50 border-blue-100" 
      },
      { 
        title: "Gross Sales", 
        count: <CurrencyFormatter amount={grossSalesToday}/>, 
        trend: "Completed Transactions", 
        isPositive: true, 
        icon: ArrowUpRight, 
        color: "text-emerald-600 bg-emerald-50 border-emerald-100" 
      },
      { 
        title: "Refunds & Returns", 
        count: <CurrencyFormatter amount={totalRefunds}/>, 
        trend: "Returned Assets", 
        isPositive: false, 
        icon: RotateCcw, 
        color: "text-amber-600 bg-amber-50 border-amber-100" 
      },
      { 
        title: "Expected Cash in Drawer", 
        count: <CurrencyFormatter amount={expectedCash}/>, 
        trend: "Matches Register", 
        isPositive: true, 
        icon: Coins, 
        color: "text-purple-600 bg-purple-50 border-purple-100" 
      },
      { 
        title: "Voided Transactions", 
        count: `${voidedCount} Flags`, 
        trend: "Review Session", 
        isPositive: false, 
        icon: AlertTriangle, 
        color: "text-rose-600 bg-rose-50 border-rose-100" 
      },
    ];
  }, [sales]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 bg-slate-50/50 min-h-screen w-full">
      
      {/* ─── HEADER PANEL ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 tracking-tight">Shop Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Counter-level real-time operations, shifts, and register balances.</p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex items-center gap-2 border-slate-200 text-slate-700 h-9 bg-white text-xs">
            <Download size={15} />
            <span>Export Transactions</span>
          </Button>
        </div>
      </div>

      {/* ─── DYNAMIC SHOP ANALYTICS CARDS ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
        {stats.map((stat, i) => {
          const IconComp = stat.icon;
          return (
            <Card key={i} className="border border-slate-200/60 shadow-sm bg-white">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold text-slate-400 tracking-normal uppercase">{stat.title}</span>
                  <div className={`p-2 rounded-lg border ${stat.color}`}>
                    <IconComp size={15} />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-bold text-slate-800 tracking-tight">{stat.count}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold ${stat.isPositive ? "text-emerald-600" : "text-amber-600"}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ─── DATA TABLE VIEWPORT CONTAINER ─────────────────────── */}
      <Card className="border border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white w-full">
        <div className="w-full overflow-x-auto">
          <TableMain
            columns={shopTransactionColumnDef}
            data={sales || []}
            columnVisibilityFilter={true}
            tableFilterButtonVisible={true}
            tableExportButtonVisible={true}
            searchKey="customId"
            placeholder="Search by name, SKU or barcode..."
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
            }
          }}
          />
        </div>
      </Card>
  
    <AppSheet
      title = ""
      isOpen = {isDetailsOpen}
      maxWidth="xl"
      onClose={()=> setIsDetailsOpen(false)}
    >
     {selectedSale && (
      <SaleDetailsDrawer
        sale={selectedSale}
      />
     )}  
    </AppSheet>
    </div>
  )
}