"use client";

import React from "react";
import { 
  Printer, 
  Download, 
  Send, 
  MoreHorizontal, 
  Copy, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Clock,
  Edit2
} from "lucide-react";

// Shadcn UI Primitives
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Adjust this import based on your shadcn path

// Mocking the Prisma data structure we finalized (Include Sale + Items + Customer)
const invoiceData = {
  invoiceNo: "INV-2026-000145",
  issuedAt: "May 18, 2026, 10:32 AM",
  dueDate: "May 25, 2026 (7 days)",
  shopName: "Main Branch",
  shopAddress: "45 Anumansa Street, East Legon",
  shopCity: "Accra, Ghana",
  shopPhone: "+233 20 987 6543",
  shopEmail: "mainbranch@kingzmen.com",
  shopTaxId: "P000123456",
  sale: {
    status: "COMPLETED", // Maps to 'Paid' badge
    paymentType: "CASH",
    createdAt: "May 18, 2026, 10:45 AM",
    discountAmount: 0.00,
    totalAmount: 35.60,
    employeeName: "Kwadwo Mensah",
    customer: {
      name: "Nana Kwame Bediako",
      phone: "+233 20 123 4567",
      email: "nana.bediako@email.com",
      address: "East Legon, Accra",
      country: "Ghana"
    },
    items: [
      { id: "1", name: "Coca Cola 500ml", sku: "DRK-001", qty: 2, unitPrice: 6.00, discount: 0.00, tax: 1.20, total: 13.20 },
      { id: "2", name: "FanIce 500ml", sku: "DRK-002", qty: 1, unitPrice: 5.00, discount: 0.00, tax: 1.00, total: 6.00 },
      { id: "3", name: "Indomie Chicken", sku: "FD-015", qty: 2, unitPrice: 4.50, discount: 0.00, tax: 0.90, total: 9.90 },
      { id: "4", name: "Milo Sachet", sku: "FD-030", qty: 1, unitPrice: 2.50, discount: 0.00, tax: 0.50, total: 3.00 },
    ]
  }
};

export default function InvoiceDetailsPage() {
  const subtotal = invoiceData.sale.items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const totalTax = invoiceData.sale.items.reduce((acc, item) => acc + item.tax, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can hook up a shadcn toast here if desired
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 lg:p-8 text-slate-900 antialiased font-sans">
      
      {/* ── ACTION BANNER CONTROL BAR ────────────────────────────── */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-blue-950">Invoice</h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold px-2.5 py-0.5 rounded-md text-xs uppercase tracking-wider">
              {invoiceData.sale.status === "COMPLETED" ? "Paid" : "Unpaid"}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Invoice was created on {invoiceData.issuedAt}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="bg-white border-slate-200 font-bold text-xs text-slate-700 h-9 rounded-xl shadow-sm gap-1.5">
            <Printer className="w-4 h-4 text-slate-400" /> Print
          </Button>
          <Button variant="outline" size="sm" className="bg-white border-slate-200 font-bold text-xs text-slate-700 h-9 rounded-xl shadow-sm gap-1.5">
            <Download className="w-4 h-4 text-slate-400" /> Download
          </Button>
          <Button variant="outline" size="sm" className="bg-white border-slate-200 font-bold text-xs text-slate-700 h-9 rounded-xl shadow-sm gap-1.5">
            <Send className="w-4 h-4 text-slate-400" /> Send
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs h-9 rounded-xl shadow-sm gap-1 ml-auto sm:ml-0">
                More <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white rounded-xl border border-slate-200">
              <DropdownMenuItem className="text-xs font-bold text-rose-600 focus:bg-rose-50 cursor-pointer">
                Void Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-6">

        {/* ── TOP INFORMATION METADATA BLOCK ──────────────────────── */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1: Invoice Details */}
            <div className="space-y-2.5 text-xs font-medium">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block mb-1">Invoice Info</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-blue-950 tracking-tight">{invoiceData.invoiceNo}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400"
                  onClick={() => copyToClipboard(invoiceData.invoiceNo)}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Invoice Date</span><span className="font-bold text-blue-900">{invoiceData.issuedAt}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Due Date</span><span className="font-bold text-blue-900">{invoiceData.dueDate}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-400">Status</span><Badge className="bg-emerald-50 text-emerald-700 border-none shadow-none font-bold text-[10px] h-5 px-2">Paid</Badge></div>
              <div className="flex justify-between"><span className="text-slate-400">Payment Method</span><span className="font-bold text-blue-900">{invoiceData.sale.paymentType}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Payment Date</span><span className="font-bold text-blue-900">{invoiceData.sale.createdAt}</span></div>
            </div>

            {/* Column 2: Customer Identity Profile */}
            <div className="space-y-2.5 text-xs font-medium border-t md:border-t-0 md:border-x border-slate-100 pt-6 md:pt-0 md:px-8">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block mb-2">Customer</span>
              {invoiceData.sale.customer ? (
                <>
                  <div className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-xl border border-blue-100/40 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-black text-blue-900">{invoiceData.sale.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {invoiceData.sale.customer.phone}</div>
                  <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> {invoiceData.sale.customer.email}</div>
                  <div className="flex items-start gap-2 text-slate-600 leading-tight">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" /> 
                    <div>{invoiceData.sale.customer.address}, <br/>{invoiceData.sale.customer.country}</div>
                  </div>
                </>
              ) : (
                <span className="text-slate-400 italic">Walk-in Customer</span>
              )}
            </div>

            {/* Column 3: Corporate Shop Info */}
            <div className="space-y-1.5 text-xs font-medium text-slate-600 pt-6 md:pt-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-blue-950 text-white flex items-center justify-center text-[10px] font-black">KM</div>
                <span className="text-sm font-black text-blue-950">{invoiceData.shopName}</span>
              </div>
              <p className="leading-tight">{invoiceData.shopAddress}<br />{invoiceData.shopCity}</p>
              <p className="pt-1">{invoiceData.shopPhone}</p>
              <p>{invoiceData.shopEmail}</p>
              <div className="pt-2 text-[11px] font-bold text-slate-400">TAX ID: {invoiceData.shopTaxId}</div>
            </div>

          </CardContent>
        </Card>

        {/* ── MIDDLE ROW WORKSPACE: ITEMS & FINANCIALS ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Line Items Table Data */}
          <Card className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100">
              <CardTitle className="text-sm font-black text-blue-950">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-blue-50/50 border-b border-slate-100 text-[10px] font-black tracking-wider text-blue-900/80 uppercase">
                      <th className="p-3.5 text-center w-12">#</th>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">SKU</th>
                      <th className="p-3.5 text-center w-14">Qty</th>
                      <th className="p-3.5 text-right">Unit Price</th>
                      <th className="p-3.5 text-right">Discount</th>
                      <th className="p-3.5 text-right">Tax</th>
                      <th className="p-3.5 text-right pr-5">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoiceData.sale.items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 text-center font-bold text-slate-400">{index + 1}</td>
                        <td className="p-3.5 font-bold text-blue-950">{item.name}</td>
                        <td className="p-3.5 font-mono text-slate-400 text-[11px]">{item.sku}</td>
                        <td className="p-3.5 text-center font-bold">{item.qty}</td>
                        <td className="p-3.5 text-right font-mono">GH₵ {item.unitPrice.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-mono text-slate-400">GH₵ {item.discount.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-mono text-slate-400">GH₵ {item.tax.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-bold font-mono text-blue-950 pr-5">GH₵ {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-5 bg-slate-50/40 border-t border-slate-50 text-xs text-slate-400 font-medium">
                Thank you for your business! 😊 <br />
                If you have any questions, feel free to contact us.
              </div>
            </CardContent>
          </Card>

          {/* Right Core Calculation Balance Block */}
          <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-3.5 text-xs font-medium text-slate-600">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 font-mono">GH₵ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount</span>
                <span className="font-bold text-slate-400 font-mono">- GH₵ {invoiceData.sale.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tax (5%)</span>
                <span className="font-bold text-slate-900 font-mono">GH₵ {totalTax.toFixed(2)}</span>
              </div>
              
              <Separator className="bg-slate-100 my-1" />

              <div className="flex justify-between items-center text-sm font-black text-blue-950 pt-1">
                <span>Total</span>
                <span className="text-base font-black font-mono">GH₵ {invoiceData.sale.totalAmount.toFixed(2)}</span>
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex justify-between items-center bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl text-emerald-800 font-bold">
                  <span>Amount Paid</span>
                  <span className="font-black font-mono">GH₵ {invoiceData.sale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-950 p-3 rounded-xl text-white font-bold">
                  <span className="opacity-90">Balance Due</span>
                  <span className="font-black font-mono">GH₵ 0.00</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── LOWER FOOTER ROW: NOTES & SYSTEM AUDIT TIMELINE ─────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1: Notes Management Box */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-slate-100">
              <CardTitle className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" /> Invoice Notes
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-blue-800 hover:bg-blue-50 border border-blue-100 rounded-lg gap-1 px-2.5">
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="p-5 text-xs font-medium text-slate-600 space-y-1 leading-relaxed">
              <p>This invoice was generated from POS sale.</p>
              <p className="text-slate-400 italic">No additional custom notes appended.</p>
            </CardContent>
          </Card>

          {/* Section 2: Chronological System Activity Trails */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-black text-blue-950">Invoice Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative pl-5 border-l-2 border-blue-100/70 space-y-6 text-xs font-medium">
                
                {/* Milestone Node 1: Payment Checkpoint */}
                <div className="relative">
                  <div className="absolute -left-[26px] top-0.5 bg-white rounded-full p-0.5 z-10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-white" />
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-blue-950">Payment received</h4>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">Cash payment of GH₵ {invoiceData.sale.totalAmount.toFixed(2)} received</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-700 font-bold block">{invoiceData.sale.createdAt}</span>
                      <span className="text-[10px] text-slate-400 font-normal">by {invoiceData.sale.employeeName}</span>
                    </div>
                  </div>
                </div>

                {/* Milestone Node 2: Creation Checkpoint */}
                <div className="relative">
                  <div className="absolute -left-[26px] top-0.5 bg-white rounded-full p-0.5 z-10">
                    <Clock className="w-4 h-4 text-blue-800 fill-white" />
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-blue-950">Invoice created</h4>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">Invoice structural sequence was locked to business register account</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-700 font-bold block">{invoiceData.issuedAt}</span>
                      <span className="text-[10px] text-slate-400 font-normal">by {invoiceData.sale.employeeName}</span>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}