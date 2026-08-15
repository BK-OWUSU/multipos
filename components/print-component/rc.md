"use client";

import React, { useRef } from "react";
import { Printer} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaleReceipt } from "@/types/types/sale.receipt.type";

interface PrintReceiptProps {
sale: SaleReceipt;
  onClose?: () => void;
}

export function ReceiptPrintView({ sale, onClose }: PrintReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const windowPrint = window.open("", "", "left=0,top=0,width=400,height=600,toolbar=0,scrollbars=0,status=0");
    if (!windowPrint) return;

    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale.customId}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 10px;
              width: 80mm; /* Standard thermal receipt width */
              font-size: 12px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .border-t { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 4px 0; font-size: 11px; }
            th { border-bottom: 1px solid #000; }
            .no-print { display: none; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
  };

 const currencySymbol = sale.business?.currencySymbol || "₵";

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between w-full max-w-sm bg-slate-100 p-3 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-700">Receipt Preview</span>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Close
            </Button>
          )}
          <Button size="sm" onClick={handlePrint} className="h-8 text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white">
            <Printer className="h-3.5 w-3.5" /> Print Receipt
          </Button>
        </div>
      </div>

      {/* Thermal Receipt Canvas Preview */}
      <div 
        ref={receiptRef}
        className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm font-mono text-xs space-y-4"
      >
        {/* Header Metadata */}
       {/* Header Metadata */}
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
          <h2 className="text-base font-bold uppercase tracking-tight">{sale.business?.name || "Store Receipt"}</h2>
          <p className="text-[11px] font-semibold text-slate-700">{sale.shop?.name}</p>
          {sale.shop?.address && <p className="text-[10px] text-slate-500">{sale.shop?.address}</p>}
          {sale.shop?.city && <p className="text-[10px] text-slate-500">{sale.shop?.city}</p>}
          {sale.business?.phone && <p className="text-[10px] text-slate-500">Tel: {sale.business?.phone}</p>}
        </div>

        {/* Transaction Meta */}
        <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">Receipt ID:</span>
            <span className="font-bold">{sale.customId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date:</span>
            <span>{new Date(sale.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cashier:</span>
            <span>{sale.employee.firstName} {sale.employee.lastName}</span>
          </div>
          {sale.customer && (
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span>{sale.customer.firstName} {sale.customer.lastName}</span>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="pb-3 border-b border-dashed border-slate-300">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                <th className="pb-1">Item</th>
                <th className="text-center pb-1">Qty</th>
                <th className="text-right pb-1">Price</th>
                <th className="text-right pb-1">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item) => (
                <tr key={item.id} className="text-[11px]">
                  <td className="py-1.5 pr-1 font-medium truncate max-w-27.5">
                    {item.variant.product.name}
                    <div className="text-[9px] text-slate-400 font-mono">{item.variant.sku}</div>
                  </td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-1.5 text-right font-semibold">{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Totals */}
        <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300 text-[11px]">
          {Number(sale.discountAmount) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount Applied:</span>
              <span>-{currencySymbol}{Number(sale.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold pt-1">
            <span>TOTAL DUE:</span>
            <span>{currencySymbol}{Number(sale.totalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
            <span>Payment Method:</span>
            <span className="uppercase font-semibold text-slate-700">{sale.paymentType}</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center space-y-1 pt-1 text-[10px] text-slate-500">
          <p className="font-semibold text-slate-700">Thank you for your patronage!</p>
          <p>Please come again.</p>
        </div>
      </div>
    </div>
  );
}