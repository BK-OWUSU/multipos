"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Trash2,
  Calendar,
  FileText,
  User,
  Activity,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowLeftRight
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TransferRecord } from "@/types/types";
import TableMain from "@/components/reusables/table/TableMain";
import { transfersColumnDef } from "@/components/tablesColumnDef/business/transfersColumnDef";

// --- MOCK CONSTANTS / STATES FOR THE TERMINAL ---
const mockSourceProducts = [
  { id: "p1", name: "Coca-Cola 500ml", sku: "DRK-001", available: 120, minLevel: 50 },
  { id: "p2", name: "Fanta 500ml", sku: "DRK-002", available: 80, minLevel: 30 },
  { id: "p3", name: "Milo (400g)", sku: "FD-030", available: 45, minLevel: 20 },
  { id: "p4", name: "Peak Milk (Tin)", sku: "FD-020", available: 60, minLevel: 15 },
  { id: "p5", name: "Dettol Soap (70g)", sku: "HBTL-S002", available: 200, minLevel: 50 },
  { id: "p6", name: "Toilet Tissue (Pack)", sku: "HS-001", available: 150, minLevel: 50 },
];

const mockHistoricalTransfers = [
  { ref: "TRF-2026-0610-003", from: "Osu Branch", to: "Airport Branch", items: 3, units: 45, value: 450.00, status: "Received", date: "May 17, 2026 10:30 AM" },
  { ref: "TRF-2026-0610-002", from: "East Legon Branch", to: "Madina Branch", items: 4, units: 60, value: 620.00, status: "In Transit", date: "May 17, 2026 09:15 AM" },
  { ref: "TRF-2026-0610-001", from: "Airport Branch", to: "Osu Branch", items: 2, units: 25, value: 180.00, status: "Pending", date: "May 16, 2026 04:45 AM" },
];

const transferTableData: TransferRecord[] = [
  {
    id: "tx-007",
    referenceNo: "TRF-2026-0518-007",
    fromShop: "East Legon Branch",
    toShop: "Tema Branch",
    itemsCount: 5,
    unitsCount: 85,
    totalValue: 920.00,
    status: "Received",
    transferPriority: "Medium",
    transferDate: "May 18, 2026 03:10 PM",
  },
  {
    id: "tx-006",
    referenceNo: "TRF-2026-0518-006",
    fromShop: "Madina Branch",
    toShop: "Osu Branch",
    itemsCount: 3,
    unitsCount: 40,
    totalValue: 350.00,
    status: "Pending",
    transferPriority: "Normal",
    transferDate: "May 18, 2026 01:25 PM",
  },
  {
    id: "tx-005",
    referenceNo: "TRF-2026-0518-005",
    fromShop: "Airport Branch",
    toShop: "East Legon Branch",
    itemsCount: 6,
    unitsCount: 95,
    totalValue: 1_250.00,
    status: "In Transit",
    transferPriority: "Urgent",
    transferDate: "May 18, 2026 11:40 AM",
  },
  {
    id: "tx-004",
    referenceNo: "TRF-2026-0517-004",
    fromShop: "Tema Branch",
    toShop: "Madina Branch",
    itemsCount: 2,
    unitsCount: 30,
    totalValue: 275.00,
    status: "Cancelled",
    transferPriority: "Normal",
    transferDate: "May 17, 2026 02:20 PM",
  },
  {
    id: "tx-003",
    referenceNo: "TRF-2026-0517-003",
    fromShop: "Osu Branch",
    toShop: "Airport Branch",
    itemsCount: 3,
    unitsCount: 45,
    totalValue: 450.00,
    status: "Received",
    transferPriority: "Normal",
    transferDate: "May 17, 2026 10:30 AM",
  },
  {
    id: "tx-002",
    referenceNo: "TRF-2026-0517-002",
    fromShop: "East Legon Branch",
    toShop: "Madina Branch",
    itemsCount: 4,
    unitsCount: 60,
    totalValue: 620.00,
    status: "In Transit",
    transferPriority: "Medium",
    transferDate: "May 17, 2026 09:15 AM",
  },
  {
    id: "tx-001",
    referenceNo: "TRF-2026-0516-001",
    fromShop: "Airport Branch",
    toShop: "Osu Branch",
    itemsCount: 2,
    unitsCount: 25,
    totalValue: 180.00,
    status: "Pending",
    transferPriority: "Urgent",
    transferDate: "May 16, 2026 04:45 PM",
  },
];

export default function StockTransferTerminal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [priority, setPriority] = useState("normal");

  // Local cart state for items currently staged for transfer
  const [transferCart, setTransferCart] = useState([
    { id: "p1", name: "Coca-Cola 500ml", sku: "DRK-001", available: 120, qty: 20, unitValue: 12.00 },
    { id: "p2", name: "Fanta 500ml", sku: "DRK-002", available: 80, qty: 10, unitValue: 5.00 },
  ]);

  const updateCartQty = (id: string, delta: number) => {
    setTransferCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const nextQty = Math.max(1, Math.min(item.available, item.qty + delta));
      return { ...item, qty: nextQty };
    }));
  };

  const removeCartItem = (id: string) => {
    setTransferCart(prev => prev.filter(item => item.id !== id));
  };

  // Automated cart aggregate mathematics
  const totalItemsCount = transferCart.length;
  const totalUnitsCount = transferCart.reduce((sum, item) => sum + item.qty, 0);
  const totalTransferValue = transferCart.reduce((sum, item) => sum + (item.qty * item.unitValue), 0);

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 lg:p-8 text-slate-900 antialiased font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── TOP SECTION HEADER PANEL CONTROL STRIP ────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-950">Transfer Stock</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">Move stock from one shop to another within your business.</p>
          </div>
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
            <Button variant="outline" size="sm" className="h-10 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl bg-white px-5">
              Cancel
            </Button>
            <Button size="sm" className="h-10 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 shadow-sm">
              Create Transfer
            </Button>
          </div>
        </div>

        {/* ── METADATA CONFIGURATION BLOCKS (SOURCE, DEST, PARAMETERS) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Source Entity Selection */}
          <Card className="lg:col-span-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm relative">
            <span className="text-[10px] font-black tracking-wide text-blue-600 uppercase block mb-2">From Shop <span className="text-slate-400 font-medium">(Source)</span></span>
            <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-slate-900">East Legon Branch</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-[11px] font-semibold text-slate-400">Current Stock Value: <span className="font-mono font-bold text-blue-950">GH₵ 18,450.00</span></span>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none rounded font-bold text-[9px] px-1.5 h-4 shadow-none">Active</Badge>
            </div>
          </Card>

          {/* Visual Grid Routing Indicator */}
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Destination Entity Selection */}
          <Card className="lg:col-span-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm relative">
            <span className="text-[10px] font-black tracking-wide text-emerald-600 uppercase block mb-2">To Shop <span className="text-slate-400 font-medium">(Destination)</span></span>
            <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-slate-900">Airport Branch</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-[11px] font-semibold text-slate-400">Current Stock Value: <span className="font-mono font-bold text-emerald-700">GH₵ 6,230.00</span></span>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none rounded font-bold text-[9px] px-1.5 h-4 shadow-none">Active</Badge>
            </div>
          </Card>

          {/* Core System Identity Attributes Row Box */}
          <Card className="lg:col-span-3 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm flex flex-col justify-between text-[11px] font-semibold text-slate-600 gap-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Transfer Date</span>
              <span className="font-bold text-slate-800">May 18, 2026</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> Reference No.</span>
              <span className="font-mono font-bold text-slate-800">TRF-2026-0518-001</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Created By</span>
              <span className="font-bold text-blue-950">Kwame Mensah</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-slate-400" /> Status</span>
              <Badge className="bg-amber-50 text-amber-700 border-none font-bold font-sans rounded-md text-[9px] h-4.5 px-2 tracking-wide shadow-none">Pending</Badge>
            </div>
          </Card>
        </div>

        {/* ── MAIN INTERACTIVE SPLIT TERMINAL ROW BUILDER ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SUB-COLUMN: Catalog Sourcing Grid List Block (1) */}
          <Card className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center gap-2 shrink-0">
              <div className="w-5 h-5 rounded-full bg-blue-800 text-white flex items-center justify-center font-black text-[10px]">1</div>
              <CardTitle className="text-xs font-black text-blue-950 tracking-tight uppercase pt-0.5">Select Products from East Legon Branch</CardTitle>
            </CardHeader>
            
            {/* Embedded Search and Filters strip */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/40 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400 stroke-[2.2]" />
                <Input
                  placeholder="Search product by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 bg-white border-slate-200 text-xs font-semibold rounded-xl focus-visible:ring-blue-100 shadow-none placeholder:text-slate-300"
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl gap-1 shadow-none bg-white">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
              </Button>
            </div>

            <CardContent className="p-3 space-y-2 h-95 overflow-y-auto">
              {mockSourceProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/40 transition-colors gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 bg-slate-100 border rounded-lg flex items-center justify-center font-bold text-[10px] text-slate-400 shrink-0">
                      {product.name.charAt(0)}
                    </div>
                    <div className="text-xs font-semibold truncate">
                      <h4 className="text-blue-950 font-black truncate leading-tight">{product.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">SKU: {product.sku}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0 text-right text-[10px] font-bold text-slate-400 leading-normal">
                    <div>
                      <p>Available: <span className="text-slate-800 font-black">{product.available}</span></p>
                      <p className="mt-0.5">Min. Level: {product.minLevel}</p>
                    </div>
                    <Button size="sm" className="h-7 text-[10px] font-black bg-blue-50 hover:bg-blue-100 text-blue-700 border-none rounded-lg gap-1 px-2.5 shadow-none">
                      <ShoppingCart className="w-3 h-3 stroke-[2.5]" /> Add
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>

            {/* Pagination controls footer shell block */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 shrink-0">
              <span>Showing 1 to 6 of 56 products</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" className="w-6 h-6 p-0 border-slate-200 text-slate-400 rounded-md" disabled><ChevronLeft className="w-3.5 h-3.5" /></Button>
                <Button variant="outline" className="w-6 h-6 p-0 border-blue-600 bg-blue-50/40 text-blue-700 font-black rounded-md text-xs">1</Button>
                <Button variant="outline" className="w-6 h-6 p-0 border-transparent text-slate-500 rounded-md text-xs">2</Button>
                <Button variant="outline" className="w-6 h-6 p-0 border-slate-200 text-slate-600 rounded-md"><ChevronRight className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </Card>

          {/* RIGHT SUB-COLUMN: Output Staged Compilation Workspace (2) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center gap-2 shrink-0">
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-[10px]">2</div>
                <CardTitle className="text-xs font-black text-blue-950 tracking-tight uppercase pt-0.5">Products to Transfer to Airport Branch</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-medium">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                        <th className="p-3 pl-5">Product</th>
                        <th className="p-3 text-center">Available</th>
                        <th className="p-3 text-center w-32">Qty to Transfer</th>
                        <th className="p-3 text-right">Total Value (GH₵)</th>
                        <th className="p-3 text-center pr-5 w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {transferCart.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="p-3 pl-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-400 shrink-0">
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-black text-blue-950 leading-tight">{item.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">SKU: {item.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-500">{item.available}</td>
                          <td className="p-3">
                            {/* Counter adjustment inline group widget */}
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl h-8 px-1.5 max-w-[110px] mx-auto">
                              <button onClick={() => updateCartQty(item.id, -1)} className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-950 hover:bg-white transition-colors"><Minus className="w-3 h-3" /></button>
                              <span className="font-mono font-black text-slate-900 text-xs">{item.qty}</span>
                              <button onClick={() => updateCartQty(item.id, 1)} className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-950 hover:bg-white transition-colors"><Plus className="w-3 h-3" /></button>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-blue-950">{(item.qty * item.unitValue).toFixed(2)}</td>
                          <td className="p-3 text-center pr-5">
                            <Button onClick={() => removeCartItem(item.id)} variant="ghost" size="icon" className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 shadow-none"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t border-slate-50 text-center bg-slate-50/20 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors">
                  + Add more products
                </div>
              </CardContent>
            </Card>

            {/* Calculations Balance Sheet Form Row Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              {/* Optional Text Notes Entry box field */}
              <div className="md:col-span-7 flex flex-col">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Transfer Notes <span className="text-slate-300 font-normal lowercase">(Optional)</span></Label>
                <Textarea
                  placeholder="Add notes or reason for this transfer..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  maxLength={250}
                  className="bg-white border-slate-200 text-xs rounded-xl shadow-none focus-visible:ring-blue-100 min-h-[95px] flex-1 placeholder:text-slate-300 resize-none"
                />
                <span className="text-[9px] text-right text-slate-300 font-bold mt-1">{transferNotes.length}/250</span>
              </div>

              {/* Aggregated Totals and Shift Priority Box */}
              <Card className="md:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col justify-between gap-3 text-xs font-semibold text-slate-600">
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span>Total Items</span><span className="font-bold text-slate-900">{totalItemsCount}</span></div>
                  <div className="flex justify-between"><span>Total Units</span><span className="font-bold text-slate-900">{totalUnitsCount}</span></div>
                  <Separator className="bg-slate-100" />
                  <div className="flex justify-between items-center text-blue-950 font-black">
                    <span>Total Value</span>
                    <span className="font-mono text-sm text-blue-600">GH₵ {totalTransferValue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-50">
                  <span className="text-[10px] font-black tracking-wide text-slate-400 uppercase block">Priority</span>
                  <RadioGroup value={priority} onValueChange={setPriority} className="flex gap-4">
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="normal" id="r-normal" className="text-blue-600 border-slate-300 focus-visible:ring-blue-100" />
                      <Label htmlFor="r-normal" className="text-[11px] font-bold text-slate-700 cursor-pointer">Normal</Label>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="medium" id="r-medium" className="text-blue-600 border-slate-300 focus-visible:ring-blue-100" />
                      <Label htmlFor="r-medium" className="text-[11px] font-bold text-slate-700 cursor-pointer">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="urgent" id="r-urgent" className="text-blue-600 border-slate-300 focus-visible:ring-blue-100" />
                      <Label htmlFor="r-urgent" className="text-[11px] font-bold text-slate-700 cursor-pointer">Urgent</Label>
                    </div>
                  </RadioGroup>
                </div>
              </Card>
            </div>
          </div>

        </div>

        {/* ── LOWER ROW FRAME: RECENT HISTORICAL AUDIT TRAILS ────────── */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/40 shrink-0">
            <CardTitle className="text-xs font-black text-blue-950 uppercase tracking-wide pt-0.5">Recent Transfers</CardTitle>
            <Button variant="ghost" size="sm" className="text-[11px] font-black text-blue-600 hover:bg-blue-50 h-7 rounded-lg">
              View All Transfers
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <TableMain
              columns={transfersColumnDef}
              data={transferTableData}
              searchKey="referenceNo"
              placeholder="Search by reference number..."
              columnVisibilityFilter={true}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}