"use client";

import { Badge } from "@/components/ui/badge";
import { Receipt, Calendar, User, CreditCard, ShoppingCart, Store, Tag } from "lucide-react";
import { Sale } from "@/types/sale.type";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { formatStandardDateTime } from "@/lib/utils";

interface SaleDetailsProps {
  sale: Sale | null;
}

export default function SaleDetails({ sale }: SaleDetailsProps) {
  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Receipt className="h-10 w-10 mb-2 stroke-1" />
        <p className="text-sm">No transaction selected.</p>
      </div>
    );
  }

  // Status styling map helper
  const statusColors: Record<Sale["status"], string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
    REFUNDED: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header Banner / Title Card */}
      <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400 uppercase">
            <Receipt className="h-3.5 w-3.5" />
            <span>Transaction Ledger</span>
          </div>
          <Badge className={`border font-semibold px-2.5 py-0.5 text-xs ${statusColors[sale.status]}`}>
            {sale.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between my-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
              {sale.customId}
            </h2>
            {sale.invoice && (
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Inv: {sale.invoice.customId}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Grand Total</p>
            <p className="text-xl font-bold text-emerald-400">
              <CurrencyFormatter amount={sale.totalAmount} />
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            <span>{formatStandardDateTime(sale.createdAt)}</span>
          </div>
          {sale.shop && (
            <div className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-blue-400" />
              <span>{sale.shop.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Meta Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card: Served By */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Served By</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 truncate">
              {sale.employee ? `${sale.employee.firstName} ${sale.employee.lastName}` : "System Terminal"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Terminal operator</p>
          </div>
        </div>

        {/* Card: Customer */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Customer</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 truncate">
              {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : "Walk-in Customer"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {sale.customer?.phone || "No phone record"}
            </p>
          </div>
        </div>
      </div>

      {/* Purchased Item Matrix List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Items Summary ({sale.items?.length || 0})
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {sale.items?.map((item) => (
            <div key={item.id} className="py-3 flex justify-between items-start gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {item.variant?.name || "Unlinked Product Variant Line"}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {item.variant?.sku || "No SKU"} • {item.quantity} x <CurrencyFormatter amount={item.unitPrice} />
                </p>
              </div>
              <div className="text-sm font-bold text-slate-900 tracking-tight shrink-0 pt-0.5">
                <CurrencyFormatter amount={item.subtotal} />
              </div>
            </div>
          ))}
        </div>

        {/* Transaction Ledger Calculation Summary */}
        <div className="border-t pt-3 space-y-2.5">
          {sale.discount && (
            <div className="flex justify-between text-xs text-slate-500 items-center">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-rose-500" />
                <span>Discount Applied: <strong className="text-slate-700">{sale.discount.name}</strong> ({sale.discount.type})</span>
              </div>
            </div>
          )}
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Total Markdown Discount</span>
              <span className="text-rose-600 font-medium">
                -<CurrencyFormatter amount={sale.discountAmount} />
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t">
            <span>Grand Gross Total</span>
            <span className="text-base text-emerald-600 tracking-tight">
              <CurrencyFormatter amount={sale.totalAmount} />
            </span>
          </div>
        </div>
      </div>

      {/* Channel Allocation Payment Breakdown */}
      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
            <CreditCard className="h-4 w-4" />
          </div>
          <span>Payment Breakdown Channel ({sale.paymentType})</span>
        </div>
        
        <div className="space-y-2">
          {sale.payments && sale.payments.length > 0 ? (
            sale.payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 font-mono">{payment.method}</span>
                  {payment.reference && <span className="text-slate-400 truncate max-w-35">Ref: {payment.reference}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900"><CurrencyFormatter amount={payment.amount} /></span>
                  <span className={`text-[10px] font-bold uppercase tracking-normal ${payment.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-500'}`}>
                    ({payment.status})
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-700 font-mono">{sale.paymentType}</span>
              <span className="font-semibold text-slate-900"><CurrencyFormatter amount={sale.totalAmount} /></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}