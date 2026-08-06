// components/business-profile/BillingTab.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldCheck, CreditCard, ArrowDownToLine } from "lucide-react";

export function BillingTab() {
  const { watch, setValue } = useFormContext();
  
  const isAnnual = watch("billing.isAnnualSharing") ?? false;

  const mockInvoices = [
    { id: "INV-0042", date: "May 12, 2025", tier: "Pro Plan (Monthly)", amount: "$49.00", status: "Paid" },
    { id: "INV-0039", date: "Apr 12, 2025", tier: "Pro Plan (Monthly)", amount: "$49.00", status: "Paid" },
    { id: "INV-0031", date: "Mar 12, 2025", tier: "Pro Plan (Monthly)", amount: "$49.00", status: "Paid" },
  ];

  return (
    <CardContent className="p-6 space-y-6">
      
      {/* Top Split Layout: Active Framework Plan vs Credit Card Mask */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tier Card Component */}
        <div className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Subscription Tier</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563eb] bg-blue-50 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Pro Operations
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-[#0f172a] tracking-tight">$49.00 <span className="text-xs font-medium text-slate-400">/ month</span></h3>
            <p className="text-[11px] text-slate-400 leading-normal">Unlocks advanced localized metrics, secondary storage pipelines, and cross-branch inventory sync.</p>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
            <Button type="button" className="h-8 bg-[#2563eb] hover:bg-blue-700 text-white font-medium text-[11px] px-3 shadow-none">Upgrade Plan</Button>
            <Button type="button" variant="outline" className="h-8 border-slate-200 text-slate-600 font-medium text-[11px] px-3 bg-white hover:bg-slate-50">Cancel Subscription</Button>
          </div>
        </div>

        {/* Masked Card Vault Module */}
        <div className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Wallet Token</span>
            <div className="flex items-center gap-3 bg-slate-50/60 p-3 rounded-lg border border-slate-100/80">
              <div className="w-10 h-7 bg-[#0f172a] rounded flex items-center justify-center text-white shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Visa ending in •••• 4242</p>
                <p className="text-[10px] text-slate-400">Expires: 12 / 2028</p>
              </div>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-8 border-slate-200 text-slate-600 font-semibold text-[11px] px-3 bg-white hover:bg-slate-50 w-full mt-4">
            Update Payment Method
          </Button>
        </div>
      </div>

      {/* Subscription Intervals Rhythm Control Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-100 rounded-xl pt-2">
        <div className="space-y-0.5">
          <Label className="text-xs font-bold text-slate-700">Billing Rhythm Frequency</Label>
          <p className="text-[10px] text-slate-400">Transition configuration settings to Annual tracking to capture up to 20% platform price breaks.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${!isAnnual ? 'text-[#2563eb]' : 'text-slate-400'}`}>Monthly</span>
          <Switch 
            checked={isAnnual}
            onCheckedChange={(checked) => setValue("billing.isAnnualSharing", checked)}
            className="data-[state=checked]:bg-[#2563eb]"
          />
          <span className={`text-[11px] font-semibold ${isAnnual ? 'text-[#2563eb]' : 'text-slate-400'}`}>Annually</span>
        </div>
      </div>

      {/* Invoice Ledger Ledger Grid Elements */}
      <div className="space-y-2 pt-4 border-t border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-[#0f172a]">Historical Platform Ledger Invoices</h4>
          <p className="text-[11px] text-slate-400">View and download historical platform statements.</p>
        </div>

        <div className="border border-slate-100 bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Reference Token</th>
                  <th className="p-3">Date Printed</th>
                  <th className="p-3">Coverage Tier</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Execution Status</th>
                  <th className="p-3 text-right">Receipt File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                {mockInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-700 font-semibold">{invoice.id}</td>
                    <td className="p-3 text-slate-400">{invoice.date}</td>
                    <td className="p-3 font-semibold text-slate-800">{invoice.tier}</td>
                    <td className="p-3 text-slate-900 font-bold">{invoice.amount}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button type="button" className="inline-flex items-center gap-1 text-[#2563eb] hover:text-blue-700 font-semibold text-[11px]">
                        <ArrowDownToLine className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </CardContent>
  );
}