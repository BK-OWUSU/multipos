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
  if (!sale) return null;

  // Status styling map helper
  const statusColors: Record<Sale["status"], string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
    REFUNDED: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="w-full space-y-6 bg-white">
      {/* ─── HEADER SECTION ────────────────────────────────────────── */}
      <div className="pb-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <Receipt className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Transaction Ledger</span>
          </div>
          <Badge className={`border px-2.5 py-0.5 text-xs font-semibold ${statusColors[sale.status]}`}>
            {sale.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900 font-mono">
            {sale.customId}
          </h2>
          {sale.invoice && (
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Inv: {sale.invoice.customId}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatStandardDateTime(sale.createdAt)}
          </div>
          {sale.shop && (
            <div className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-slate-400" />
              <span>{sale.shop.name} ({sale.shop.address})</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── META OVERVIEW SECTION ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Served By</span>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-700 font-medium">
            <User className="h-4 w-4 text-slate-400" />
            {sale.employee ? `${sale.employee.firstName} ${sale.employee.lastName}` : "System Terminal"}
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Customer</span>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-700 font-medium">
            <User className="h-4 w-4 text-slate-400" />
            {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : "Walk-in Customer"}
          </div>
          {sale.customer?.phone && (
            <span className="text-xs text-slate-400 block mt-0.5 ml-5.5 font-mono">{sale.customer.phone}</span>
          )}
        </div>
      </div>

      {/* ─── PURCHASED ITEM MATRIX LIST ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm tracking-tight border-b pb-2">
          <ShoppingCart className="h-4 w-4 text-slate-500" />
          <span>Items Summary ({sale.items?.length || 0})</span>
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
      </div>

      {/* ─── TRANSACTION LEDGER CALCULATION SUMMARY ─────────────────── */}
      <div className="border-t pt-4 space-y-2.5">
        {sale.discount && (
          <div className="flex justify-between text-sm text-slate-500 items-center">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-rose-500" />
              <span>Discount Applied: <strong className="text-slate-700">{sale.discount.name}</strong> ({sale.discount.type})</span>
            </div>
          </div>
        )}
        {sale.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-slate-500">
            <span>Total Markdown Discount</span>
            <span className="text-rose-600 font-medium">
              -<CurrencyFormatter amount={sale.discountAmount} />
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-base font-bold text-slate-900 pt-1 border-t border-dashed">
          <span>Grand Gross Total</span>
          <span className="text-lg tracking-tight">
            <CurrencyFormatter amount={sale.totalAmount} />
          </span>
        </div>
      </div>

      {/* ─── CHANNEL ALLOCATION PAYMENT BREAKDOWN ──────────────────── */}
      <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
          <CreditCard className="h-4 w-4 text-slate-400" />
          <span>Payment Breakdown Channel ({sale.paymentType})</span>
        </div>
        
        <div className="space-y-2">
          {sale.payments && sale.payments.length > 0 ? (
            sale.payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-xs">
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
            <div className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200/60">
              <span className="font-bold text-slate-700 font-mono">{sale.paymentType}</span>
              <span className="font-semibold text-slate-900"><CurrencyFormatter amount={sale.totalAmount} /></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}