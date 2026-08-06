"use client"
import React, { useState } from "react";
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  FileText, 
  HelpCircle, 
  History, 
  Package, 
  PackageCheck, 
  Printer, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Truck, 
  UploadCloud, 
  User 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

// Mock Initial Items structured around your schema
const initialItems = [
  { id: "1", name: "Coca Cola 33cl (24 Pack)", sku: "CC-33CL-24", category: "Beverages", expected: 24, received: 24, unitValue: 35.00 },
  { id: "2", name: "Milo Sachet 20g", sku: "MILO-20G", category: "Beverages", expected: 50, received: 48, unitValue: 1.20 },
  { id: "3", name: "FanMilk Vanilla 500ml", sku: "FM-VAN-500", category: "Dairy", expected: 20, received: 20, unitValue: 3.80 },
  { id: "4", name: "Verna Water 500ml", sku: "VERNA-500", category: "Beverages", expected: 40, received: 40, unitValue: 1.00 },
  { id: "5", name: "Indomie Chicken 70g", sku: "IND-CH-70G", category: "Groceries", expected: 30, received: 28, unitValue: 0.85 },
];

export default function ReceiveStockPage() {
  const [items, setItems] = useState(initialItems);
  const [receiverNotes, setReceiverNotes] = useState("");

  // Calculations
  const totalItemsCount = items.length;
  const totalExpectedQty = items.reduce((acc, item) => acc + item.expected, 0);
  const totalReceivedQty = items.reduce((acc, item) => acc + item.received, 0);
  const totalVarianceQty = totalReceivedQty - totalExpectedQty;
  
  const totalExpectedValue = items.reduce((acc, item) => acc + (item.expected * item.unitValue), 0);
  const totalReceivedValue = items.reduce((acc, item) => acc + (item.received * item.unitValue), 0);

  const handleQtyChange = (id: string, value: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, received: Math.max(0, value) } : item));
  };

  return (
    <div className="space-y-6 p-6 max-w-400 mx-auto bg-slate-50/50 min-h-screen text-slate-900">
      
      {/* ── HEADER NAVIGATION ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receive Stock</h1>
          <p className="text-sm text-slate-500">Receive incoming stock transfer into this shop</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <History className="h-4 w-4" /> Transfer History
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <Printer className="h-4 w-4" /> Print Slip
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── METRIC CARDS ROW (Borrowed from Image 1) ────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><Truck className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pending</p>
              <h3 className="text-lg font-bold tracking-tight">8</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><RefreshCw className="h-5 w-5 animate-spin-slow" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">In Transit</p>
              <h3 className="text-lg font-bold tracking-tight">3</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><PackageCheck className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Completed Today</p>
              <h3 className="text-lg font-bold tracking-tight">12</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><Package className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Items Received</p>
              <h3 className="text-lg font-bold tracking-tight">156</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><span className="font-bold text-sm">GH₵</span></div>
            <div>
              <p className="text-xs font-medium text-slate-500">Value Received</p>
              <h3 className="text-lg font-bold tracking-tight">4,870.00</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── TRANSFER IDENTITY STRIP (Strict Read-Only Status Context) ───── */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50/70 items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 font-semibold border-amber-200 px-2.5 py-1 gap-1.5 uppercase tracking-wider text-[11px]">
              <Clock className="h-3 w-3" /> Pending
            </Badge>
            <div>
              <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider text-[10px]">Transfer Reference</span>
              <span className="font-mono font-bold text-slate-800">STF-TRF-000124</span>
            </div>
          </div>
          <div className="flex items-center gap-4 col-span-1 md:col-span-2 justify-start md:justify-center">
            <div className="text-left md:text-right">
              <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider text-[10px]">From Shop</span>
              <span className="font-semibold text-slate-700">Airport City Branch</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><ArrowRight className="h-4 w-4" /></div>
            <div>
              <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider text-[10px]">To Shop (Receiving)</span>
              <span className="font-semibold text-slate-700">East Legon Branch</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider text-[10px]">Created By</span>
            <span className="text-sm font-medium text-slate-700 block">Kwadwo Asante</span>
            <span className="text-xs text-slate-400">20 May 2026, 09:30 AM</span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider text-[10px]">Priority</span>
            <Badge variant="outline" className="mt-0.5 bg-slate-100 text-slate-700 border-slate-300 px-2">NORMAL</Badge>
          </div>
        </div>

        {/* METADATA SUMMARY FIELDS */}
        <div className="p-4 grid grid-cols-2 md:grid-cols-6 gap-4 text-sm border-b border-slate-100">
          <div>
            <span className="text-slate-400 block text-xs">Transfer Date</span>
            <span className="font-medium flex items-center gap-1.5 mt-0.5 text-slate-700"><Calendar className="h-3.5 w-3.5 text-slate-400" /> 20 May 2026</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Expected Arrival</span>
            <span className="font-medium flex items-center gap-1.5 mt-0.5 text-slate-700"><Calendar className="h-3.5 w-3.5 text-slate-400" /> 20 May 2026</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 block text-xs">Notes from Sender</span>
            <p className="text-slate-600 italic mt-0.5 text-xs truncate">&quot;Regular restock for fast moving items.&quot;</p>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Total Items / Value</span>
            <span className="font-medium block mt-0.5 text-slate-700">{totalItemsCount} Items ({totalExpectedQty} units)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Expected Valuation</span>
            <span className="font-bold block mt-0.5 text-slate-800">GH₵ {totalExpectedValue.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* ── MAIN WORKSPACE CONTENT ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE ITEMS MANAGEMENT TABLE */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800">Items in This Transfer</h2>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-bold px-2">{totalItemsCount} items</Badge>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50">
                <Plus className="h-3.5 w-3.5" /> Add Item (Discrepancy / Missing Item)
              </Button>
            </div>

            {/* RESPONSIVE TABLE LAYER */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-center">Expected Qty <span className="text-[9px] text-slate-400 block font-normal">(Dispatched)</span></th>
                    <th className="py-3 px-4 text-center w-32">Received Qty <span className="text-[9px] text-blue-500 block font-normal">(Enter Actual)</span></th>
                    <th className="py-3 px-4 text-right">Unit Value</th>
                    <th className="py-3 px-4 text-right">Total Value</th>
                    <th className="py-3 px-4 text-center">Variance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((item, index) => {
                    const variance = item.received - item.expected;
                    const totalCost = item.received * item.unitValue;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block leading-tight">{item.name}</span>
                          <span className="text-xs text-slate-400">{item.category}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{item.sku}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{item.expected}</td>
                        <td className="py-3.5 px-4 text-center">
                          <Input 
                            type="number" 
                            className="h-8 text-center font-bold border-slate-200 focus-visible:ring-blue-500"
                            value={item.received}
                            onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-600">GH₵ {item.unitValue.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">GH₵ {totalCost.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-center">
                          {variance === 0 ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 font-mono font-bold">0</Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200 font-mono font-bold">{variance}</Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {variance === 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 rounded-md text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">Complete</Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 rounded-md text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">Short</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* LOWER SECTION LOGISTICS INPUT NOTES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receiver-notes" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Receiver Notes / Remarks</Label>
              <Textarea 
                id="receiver-notes"
                placeholder="Enter any specific observations regarding this stock reception (e.g. broken casing elements, missing logistics pallets, or quality concerns)..."
                className="min-h-27.5 bg-white border-slate-200 resize-none"
                value={receiverNotes}
                onChange={(e) => setReceiverNotes(e.target.value)}
                maxLength={250}
              />
              <div className="text-right text-[11px] text-slate-400 font-medium">
                {receiverNotes.length}/250 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Attachments <span className="text-slate-400 lowercase font-normal">(optional)</span></Label>
              <div className="border-2 border-dashed border-slate-200 bg-white rounded-lg p-5 text-center flex flex-col items-center justify-center h-[110px] hover:border-blue-400 transition-colors cursor-pointer group">
                <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors mb-1.5" />
                <span className="text-xs font-semibold text-slate-600 block">Click to upload or drag & drop file</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">PDF, JPG, PNG (Max. 5MB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION PANEL & VERIFICATION SUMMARY */}
        <div className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Receiving Summary</h2>
            </div>
            <CardContent className="p-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-2"><Package className="h-4 w-4 text-slate-400" /> Total Distinct Items</span>
                <span className="font-bold text-slate-800">{totalItemsCount}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /> Expected Total Qty</span>
                <span className="font-bold text-slate-800">{totalExpectedQty}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-blue-500" /> Total Received Qty</span>
                <span className="font-bold text-blue-600">{totalReceivedQty}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-slate-400" /> Total Variance Units</span>
                {totalVarianceQty === 0 ? (
                  <span className="font-bold text-emerald-600">0</span>
                ) : (
                  <span className="font-bold text-rose-600">{totalVarianceQty}</span>
                )}
              </div>

              <div className="flex justify-between items-center text-slate-600 pt-1">
                <span>Expected Value</span>
                <span className="font-semibold text-slate-700">GH₵ {totalExpectedValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 border-b border-slate-100 pb-3.5">
                <span>Received Value</span>
                <span className="font-bold text-slate-800">GH₵ {totalReceivedValue.toFixed(2)}</span>
              </div>

              {/* DYNAMIC PIPELINE COUNTS */}
              <div className="space-y-2 pt-1 text-xs font-medium">
                <div className="flex justify-between items-center p-2 bg-emerald-50/50 border border-emerald-100 rounded-md text-emerald-800">
                  <span>Items Fully Accounted Complete</span>
                  <span className="font-bold">{items.filter(i => i.received === i.expected).length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-rose-50/50 border border-rose-100 rounded-md text-rose-800">
                  <span>Items Shorted / Missing</span>
                  <span className="font-bold">{items.filter(i => i.received < i.expected).length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50/50 border border-blue-100 rounded-md text-blue-800">
                  <span>Over-delivered Quantities</span>
                  <span className="font-bold">{items.filter(i => i.received > i.expected).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ATTRIBUTED ACTION METADATA CONTROLS */}
          <Card className="bg-white border-slate-200 shadow-sm p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs">Received By *</Label>
              <Select defaultValue="abena">
                <SelectTrigger className="w-full bg-slate-50 border-slate-200 font-medium">
                  <SelectValue placeholder="Select staff identity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abena" className="font-medium">Abena Mensah (Inventory Clerk)</SelectItem>
                  <SelectItem value="kofi">Kofi Owusu (Store Manager)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs">Received At *</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  readOnly 
                  value="11/06/2026 09:59 AM" 
                  className="bg-slate-50 border-slate-200 font-mono text-xs text-slate-600 pl-8"
                />
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* ACTION TRIGGERS AREA */}
            <div className="space-y-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 tracking-wide shadow-sm transition-colors">
                Mark as Received
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full text-slate-600 border-slate-200 hover:bg-slate-50 h-9 text-xs font-semibold">
                  Save Draft
                </Button>
                <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-9 text-xs font-semibold">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}