import React from "react";
import { format } from "date-fns";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  Gift, 
  User, 
  Store, 
  UserCheck, 
  AlertCircle,
  PlusCircle,
  MinusCircle,
  History
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Prisma } from "@/generated/prisma/client";
import CurrencyFormatter from "../reusables/CurrencyFormter";

// Match your specific prisma/frontend enum definition explicitly
export type LoyaltyActionType = 
  | "EARNED" 
  | "REDEEMED" 
  | "MANUAL_ADD" 
  | "MANUAL_REMOVE" 
  | "EXPIRED" 
  | "REVERSAL";

interface LoyaltyLedgerDetailsProps {
  transaction: {
    type: LoyaltyActionType;
    id: string;
    businessId: string;
    createdAt: Date | string;
    walletId: string;
    customerId: string;
    shopId: string | null;
    saleId: string | null;
    rewardId: string | null;
    performedById: string | null;
    points: number;
    reason: string | null;
    shop: { name: string; id: string } | null;
    customer: { phone: string | null; firstName: string; lastName: string };
    sale: { id: string; createdAt: Date | string; customId: string; totalAmount: Prisma.Decimal | number | null } | null;
    reward: { title: string; rewardType: string } | null;
    performedBy: { firstName: string; lastName: string } | null;
  };
}

export const LoyaltyLedgerDetails: React.FC<LoyaltyLedgerDetailsProps> = ({ transaction }) => {
  const {
    type,
    points,
    createdAt,
    reason,
    customer,
    sale,
    reward,
    shop,
    performedBy,
  } = transaction;

  // Configuration mapping for ALL 6 exact enum variations
  const typeConfig: Record<LoyaltyActionType, { label: string; icon: React.ReactNode; bg: string; isNegative: boolean }> = {
    EARNED: {
      label: "Points Earned",
      icon: <ArrowUpRight className="h-5 w-5 text-emerald-500" />,
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      isNegative: false
    },
    REDEEMED: {
      label: "Points Redeemed",
      icon: <ArrowDownLeft className="h-5 w-5 text-destructive" />,
      bg: "bg-destructive/10",
      isNegative: true
    },
    MANUAL_ADD: {
      label: "Manager Credit Allocation",
      icon: <PlusCircle className="h-5 w-5 text-blue-500" />,
      bg: "bg-blue-50 dark:bg-blue-950/30",
      isNegative: false
    },
    MANUAL_REMOVE: {
      label: "Manager Debit Adjustment",
      icon: <MinusCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />,
      bg: "bg-amber-50 dark:bg-amber-950/20",
      isNegative: true
    },
    EXPIRED: {
      label: "Points Expired",
      icon: <AlertCircle className="h-5 w-5 text-muted-foreground" />,
      bg: "bg-muted",
      isNegative: true
    },
    REVERSAL: {
      label: "Transaction Rollback Void",
      icon: <History className="h-5 w-5 text-purple-500" />,
      bg: "bg-purple-50 dark:bg-purple-950/30",
      isNegative: true // Rollbacks subtract points that were falsely given
    }
  };

  const currentConfig = typeConfig[type];

  return (
    <div className="space-y-6 py-2">
      {/* ── TOP HERO METRIC DISPLAY ── */}
      <div className={`flex items-center justify-between p-4 rounded-xl ${currentConfig.bg}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background rounded-lg shadow-sm border">
            {currentConfig.icon}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {currentConfig.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(createdAt), "PPP p")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${currentConfig.isNegative ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
            {currentConfig.isNegative ? "-" : "+"}{points}
          </span>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tight">Ledger Shift</p>
        </div>
      </div>

      {/* ── REASON / DESCRIPTION TRAIL ── */}
      {reason && (
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-3 text-sm text-muted-foreground flex items-start gap-2">
            <span className="font-semibold text-foreground shrink-0 text-xs mt-0.5">Audit Note:</span>
            <span className="text-xs italic leading-relaxed text-foreground/80">{reason}</span>
          </CardContent>
        </Card>
      )}

      {/* ── SECTION: CUSTOMER SCOPE ── */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> Customer Identity
        </h4>
        <div className="grid grid-cols-2 gap-4 border rounded-lg p-3 bg-card text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="font-medium text-foreground">{customer.firstName} {customer.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mobile Line</p>
            <p className="font-medium font-mono text-foreground">{customer.phone || "No phone linked"}</p>
          </div>
        </div>
      </div>

      {/* ── SECTION: TRANSACTION CONTEXT (SALE OR REWARD) ── */}
      {sale && (
        <div className="space-y-3">
          <Separator />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5" /> Linked POS Checkout Sale
          </h4>
          <div className="border rounded-lg divide-y bg-card text-sm">
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground text-xs">Receipt Reference</span>
              <span className="font-mono font-semibold text-foreground">{sale.customId}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground text-xs">Checkout Volume Amount</span>
              <span className="font-medium text-foreground">
                <CurrencyFormatter.Currency/> {Number(sale.totalAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground text-xs">Placed Timing</span>
              <span className="text-muted-foreground text-xs">
                {format(new Date(sale.createdAt), "dd MMM yyyy, p")}
              </span>
            </div>
          </div>
        </div>
      )}

      {reward && (
        <div className="space-y-3">
          <Separator />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" /> Redeemed Reward Details
          </h4>
          <div className="border rounded-lg divide-y bg-card text-sm">
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground text-xs">Reward Title</span>
              <span className="font-medium text-foreground">{reward.title}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground text-xs">Classification Group</span>
              <Badge variant="outline" className="text-xs capitalize">
                {reward.rewardType.toLowerCase().replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: METADATA SYSTEM ORIGINS ── */}
      <div className="space-y-3">
        <Separator />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5" /> Operation Metrics Location
        </h4>
        <div className="border rounded-lg divide-y bg-card text-xs text-muted-foreground">
          <div className="flex justify-between p-2.5">
            <span>Branch/Shop Name</span>
            <span className="text-foreground font-medium">{shop?.name || "Global / Main Office"}</span>
          </div>
          <div className="flex justify-between p-2.5">
            <span className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Processed Actor
            </span>
            <span className="text-foreground font-medium">
              {performedBy ? `${performedBy.firstName} ${performedBy.lastName}` : "Automated System Engine"}
            </span>
          </div>
          <div className="flex justify-between p-2.5">
            <span>Ledger Reference Unique ID</span>
            <span className="font-mono text-[10px] select-all">{transaction.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};