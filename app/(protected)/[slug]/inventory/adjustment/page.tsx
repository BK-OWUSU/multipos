"use client";

import React, { useState } from "react";
import {
  History,
  Plus,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  Search,
  Scan,
  Trash2,
  X,
  FileText,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Initial items state directly reflecting the data configuration of image_2c7e24.jpg
const initialItems = [
  { id: "1", name: "Coca Cola 33cl (Can)", category: "Beverages", sku: "CC-33CL-CAN", currentStock: 120, countedStock: 110, unitCost: 1.50, imageUrl: "/api/placeholder/32/32" },
  { id: "2", name: "Milo Sachet 20g", category: "Beverages", sku: "MILO-20G", currentStock: 200, countedStock: 205, unitCost: 1.20, imageUrl: "/api/placeholder/32/32" },
  { id: "3", name: "FanMilk Vanilla 500ml", category: "Dairy", sku: "FM-VAN-500", currentStock: 80, countedStock: 80, unitCost: 3.80, imageUrl: "/api/placeholder/32/32" },
  { id: "4", name: "Indomie Chicken 70g", category: "Groceries", sku: "IND-CH-70G", currentStock: 150, countedStock: 140, unitCost: 0.85, imageUrl: "/api/placeholder/32/32" },
];

export default function CreateStockAdjustment() {
  const [items, setItems] = useState(initialItems);
  const [requiresApproval, setRequiresApproval] = useState(true);

  // Math processors mapping inputs dynamically to line-card values
  const handleCountChange = (id: string, val: string) => {
    const numVal = parseInt(val) || 0;
    setItems(items.map(item => item.id === id ? { ...item, countedStock: numVal } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Aggregated Summary Statistics Calculations
  const computedSummary = items.reduce((acc, item) => {
    const adjQty = item.countedStock - item.currentStock;
    const lineValue = adjQty * item.unitCost;
    
    acc.totalItems += 1;
    if (adjQty < 0) {
      acc.totalNegative += adjQty;
    } else if (adjQty > 0) {
      acc.totalPositive += adjQty;
    }
    acc.netQty += adjQty;
    acc.netValue += lineValue;
    return acc;
  }, { totalItems: 0, totalNegative: 0, totalPositive: 0, netQty: 0, netValue: 0 });

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen text-slate-900">
      
      {/* ── HEADER NAVIGATION PANEL ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Create Stock Adjustment</h1>
          <p className="text-sm text-slate-500">Adjust your inventory to correct discrepancies</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white border-slate-200 text-slate-700 font-medium shadow-sm">
            <History className="h-4 w-4" /> View Adjustment History
          </Button>
          <Button className="gap-2 bg-[#2563EB] hover:bg-blue-700 font-medium shadow-sm">
            <Plus className="h-4 w-4" /> New Adjustment
          </Button>
        </div>
      </div>

      {/* ── HIGH-LEVEL METRICS CARDS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Adjustments */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-400">Total Adjustments (This Month)</p>
              <h3 className="text-2xl font-bold text-slate-800">18</h3>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> ↑ 12% <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Value Adjusted */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-400">Total Value Adjusted</p>
              <h3 className="text-2xl font-bold text-slate-800">GH₵ 12,450.00</h3>
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" /> ↓ 8% <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Approved Adjustments */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-400">Approved Adjustments</p>
              <h3 className="text-2xl font-bold text-slate-800">16</h3>
              <p className="text-xs text-emerald-600 font-semibold">88.9% <span className="text-slate-400 font-normal">of total</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Adjustments */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-400">Pending Adjustments</p>
              <h3 className="text-2xl font-bold text-slate-800">2</h3>
              <p className="text-xs text-amber-600 font-semibold">Awaiting approval</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── METADATA & CONTROL ENTRY MESH ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT WORKSPACE PANEL: FIELDS & PRIMARY ADJUSTMENT TABLE */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Form Meta Field Definitions */}
          <Card className="bg-white border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 text-sm mb-4 tracking-tight">Adjustment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Adjustment Type <span className="text-rose-500">*</span></Label>
                <Select defaultValue="physical-count">
                  <SelectTrigger className="bg-white text-xs h-9 border-slate-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical-count" className="text-xs">Physical Count Adjustment</SelectItem>
                    <SelectItem value="damaged" className="text-xs">Damaged Goods</SelectItem>
                    <SelectItem value="theft" className="text-xs">Theft/Shrinkage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Adjustment Date <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Input defaultValue="20/05/2025" className="text-xs h-9 bg-white pr-8 border-slate-200" />
                  <CalendarIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Reference No.</Label>
                <Input defaultValue="ADJ-2025-05-001" disabled className="text-xs h-9 bg-slate-50 border-slate-200 font-medium text-slate-500" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Adjustment Reason <span className="text-rose-500">*</span></Label>
                <Select defaultValue="variance">
                  <SelectTrigger className="bg-white text-xs h-9 border-slate-200">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="variance" className="text-xs">Stock Count Variance</SelectItem>
                    <SelectItem value="expired" className="text-xs">Expired Product Lifecycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Adjustment Location <span className="text-rose-500">*</span></Label>
                <Select defaultValue="all-shops">
                  <SelectTrigger className="bg-white text-xs h-9 border-slate-200">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-shops" className="text-xs">All Shops (Business Level)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Notes (Optional)</Label>
                <Textarea placeholder="Provide additional details about this adjustment..." className="text-xs min-h-[36px] h-9 resize-none border-slate-200" />
              </div>

            </div>
          </Card>

          {/* Core Multi-Item Discrepancy Reconciliation Table Component */}
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-bold text-slate-800 text-sm tracking-tight">Items to Adjust</h2>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-[260px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search by product name, SKU or barcode..." className="pl-9 text-xs h-9 bg-white border-slate-200" />
                </div>
                <Button variant="outline" className="gap-1.5 text-xs h-9 border-slate-200 bg-white font-medium text-slate-700">
                  <Scan className="h-3.5 w-3.5 text-blue-600" /> Scan Barcode
                </Button>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[140px] text-xs h-9 bg-white border-slate-200">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 w-10 text-center">#</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-center">Current Stock<br/><span className="text-[9px] lowercase font-normal text-slate-400">(System)</span></th>
                    <th className="py-3 px-4 text-center">Counted Stock<br/><span className="text-[9px] lowercase font-normal text-slate-400">(Actual)</span></th>
                    <th className="py-3 px-4 text-center">Adjustment Qty</th>
                    <th className="py-3 px-4 text-right">Unit Cost (GH₵)</th>
                    <th className="py-3 px-4 text-right">Adjustment Value (GH₵)</th>
                    <th className="py-3 px-4 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {items.map((item, index) => {
                    const adjustmentQty = item.countedStock - item.currentStock;
                    const adjustmentValue = adjustmentQty * item.unitCost;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-normal">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={item.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover bg-slate-100 border border-slate-100" />
                            <div>
                              <div className="font-bold text-slate-800">{item.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{item.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{item.sku}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{item.currentStock}</td>
                        <td className="py-3 px-4 text-center">
                          <Input 
                            type="number" 
                            value={item.countedStock} 
                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                            className="w-16 h-8 text-xs font-bold text-center mx-auto bg-white border-slate-200 focus-visible:ring-1" 
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          {adjustmentQty < 0 ? (
                            <Badge className="bg-rose-50 border-rose-100 hover:bg-rose-50 text-rose-600 rounded font-bold px-2 py-0.5 text-xs">{adjustmentQty}</Badge>
                          ) : adjustmentQty > 0 ? (
                            <Badge className="bg-emerald-50 border-emerald-100 hover:bg-emerald-50 text-emerald-600 rounded font-bold px-2 py-0.5 text-xs">+{adjustmentQty}</Badge>
                          ) : (
                            <span className="text-slate-400 font-bold">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-500">{item.unitCost.toFixed(2)}</td>
                        <td className={`py-3 px-4 text-right font-bold ${adjustmentValue < 0 ? 'text-rose-600' : adjustmentValue > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {adjustmentValue === 0 ? "0.00" : adjustmentValue.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 text-slate-300 hover:text-rose-600 hover:bg-rose-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/20">
              <Button variant="ghost" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 gap-1 h-8 px-2.5">
                <Plus className="h-3.5 w-3.5" /> Add Another Item
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT HAND CONTROLLER: BALANCES SUMMARIES & APPROVAL GATE PIPELINE */}
        <div className="space-y-6">
          
          {/* Macro Calculations Ledger Widget */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Adjustment Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs font-bold text-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Items</span>
                <span className="text-slate-900 font-extrabold text-sm">{computedSummary.totalItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Negative Adjustment</span>
                <span className="text-rose-600 text-sm font-extrabold">{computedSummary.totalNegative || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Positive Adjustment</span>
                <span className="text-emerald-600 text-sm font-extrabold">+{computedSummary.totalPositive || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Net Adjustment Qty</span>
                <span className={`text-sm font-extrabold ${computedSummary.netQty < 0 ? 'text-rose-600' : computedSummary.netQty > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {computedSummary.netQty}
                </span>
              </div>
              <Separator className="bg-slate-100 my-1" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-900 font-extrabold text-sm">Total Adjustment Value</span>
                <span className={`text-sm font-black ${computedSummary.netValue < 0 ? 'text-rose-600' : computedSummary.netValue > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {computedSummary.netValue === 0 ? "0.00" : computedSummary.netValue.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Approval Sign-off Conditional Panel */}
          <Card className="bg-white border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-col space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Approval (Optional)</h3>
            </div>
            
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <Label htmlFor="requires-approval" className="text-xs font-bold text-slate-600">Requires Approval</Label>
              <Switch 
                id="requires-approval" 
                checked={requiresApproval} 
                onCheckedChange={setRequiresApproval}
                className="data-[state=checked]:bg-blue-600" 
              />
            </div>

            {requiresApproval && (
              <div className="space-y-3 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Approver <span className="text-rose-500">*</span></Label>
                  <Select>
                    <SelectTrigger className="bg-white text-xs h-9 border-slate-200">
                      <SelectValue placeholder="Select Approver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager-1" className="text-xs">Store Manager</SelectItem>
                      <SelectItem value="ops-director" className="text-xs">Operations Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Approval Note</Label>
                  <Textarea placeholder="Add a note for the approver..." className="text-xs min-h-[60px] resize-none border-slate-200" />
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>

      {/* ── FOOTER ACTIONS CONTROL BOARD ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-end items-center gap-3 pt-4 border-t border-slate-200/60">
        <Button variant="outline" className="w-full sm:w-auto font-semibold text-slate-600 h-10 border-slate-200 bg-white shadow-sm px-5 gap-1.5">
          <X className="h-4 w-4" /> Cancel
        </Button>
        <Button variant="outline" className="w-full sm:w-auto font-semibold text-slate-700 h-10 border-slate-200 bg-white shadow-sm px-5 gap-1.5">
          <FileText className="h-4 w-4" /> Save as Draft
        </Button>
        <Button className="w-full sm:w-auto font-semibold h-10 bg-[#2563EB] hover:bg-blue-700 shadow-sm px-6 gap-1.5">
          <Send className="h-4 w-4" /> Submit for Approval
        </Button>
      </div>

    </div>
  );
}