// components/business-profile/IntegrationsTab.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/reusables/inputs/FormInput";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Landmark, Printer, MessageSquare } from "lucide-react";

export function IntegrationsTab() {
  const { watch, setValue } = useFormContext();

  // Watch integration specific keys
  const paystackConnected = watch("integrations.paystack") ?? true;
  const stripeConnected = watch("integrations.stripe") ?? false;
  const quickbooksConnected = watch("integrations.quickbooks") ?? false;
  const hardwareTerminal = watch("integrations.hardwareTerminal") ?? true;

  return (
    <CardContent className="p-6 space-y-6">
      
      {/* 1. Payment Gateways Grid Block */}
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-slate-400" /> Payment Gateways</h4>
          <p className="text-[11px] text-slate-400">Route payments through localized API merchant integrations.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border border-slate-100 bg-white rounded-xl shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-800">Paystack Merchant API</p>
              <p className="text-[10px] text-slate-400">Supports Mobile Money (MoMo) & cards.</p>
            </div>
            <Button 
              type="button" 
              variant={paystackConnected ? "destructive" : "outline"} 
              onClick={() => setValue("integrations.paystack", !paystackConnected)}
              className="h-8 text-[11px] font-semibold px-3 shadow-none"
            >
              {paystackConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-100 bg-white rounded-xl shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-800">Stripe Integration</p>
              <p className="text-[10px] text-slate-400">Global credit, debit, and localized wallet support.</p>
            </div>
            <Button 
              type="button" 
              variant={stripeConnected ? "destructive" : "outline"}
              onClick={() => setValue("integrations.stripe", !stripeConnected)}
              className="h-8 text-[11px] font-semibold px-3 shadow-none"
            >
              {stripeConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Accounting Pipelines Section */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5"><Landmark className="w-4 h-4 text-slate-400" /> Accounting Synchronization</h4>
          <p className="text-[11px] text-slate-400">Automatically balance general ledgers against system transactions.</p>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-100 rounded-xl">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold text-slate-700">QuickBooks Online Pipeline</Label>
            <p className="text-[10px] text-slate-400">Streams raw checkout lines into target invoice journals dynamically.</p>
          </div>
          <Switch 
            checked={quickbooksConnected}
            onCheckedChange={(checked) => setValue("integrations.quickbooks", checked)}
            className="data-[state=checked]:bg-[#2563eb]"
          />
        </div>
      </div>

      {/* 3. Hardware Layers Terminal Section */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5"><Printer className="w-4 h-4 text-slate-400" /> Physical Peripherals & Terminals</h4>
          <p className="text-[11px] text-slate-400">Connect cloud signals with mechanical checkout stations.</p>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-100 rounded-xl">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold text-slate-700">ESC/POS Network Receipt Printer</Label>
            <p className="text-[10px] text-slate-400">Listens on network ports to kick out receipts post-checkout.</p>
          </div>
          <Switch 
            checked={hardwareTerminal}
            onCheckedChange={(checked) => setValue("integrations.hardwareTerminal", checked)}
            className="data-[state=checked]:bg-[#2563eb]"
          />
        </div>
      </div>

      {/* 4. SMS Gateway API Configuration */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-slate-400" /> SMS Notification Gateway (Twilio)</h4>
          <p className="text-[11px] text-slate-400">Distributes instant customer notification digital slips via network SMS blocks.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput name="integrations.twilioSid" label="Twilio Account SID" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx" type="password" className="h-10 text-sm border-slate-200" />
          <FormInput name="integrations.twilioAuthToken" label="Twilio Auth Token" placeholder="••••••••••••••••••••••••••••" type="password" className="h-10 text-sm border-slate-200" />
        </div>
      </div>

    </CardContent>
  );
}