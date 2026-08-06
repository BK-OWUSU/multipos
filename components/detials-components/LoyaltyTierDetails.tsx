import React from "react";
import { format } from "date-fns";
import { 
  Crown, 
  Users, 
  TrendingUp, 
  Layers, 
  Calendar, 
  Info,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Prisma } from "@/generated/prisma/client";

interface LoyaltyTierDetailsProps {
  tier: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    minimumLifetimePoints: number;
    earnMultiplier: Prisma.Decimal | number | string;
    redemptionMultiplier: Prisma.Decimal | number | string;
    priority: number;
    isDefault: boolean;
    isActive: boolean;
    businessId: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    _count: {
      customers: number;
    };
  };
}

export const LoyaltyTierDetails: React.FC<LoyaltyTierDetailsProps> = ({ tier }) => {
  const {
    id,
    name,
    description,
    color,
    minimumLifetimePoints,
    earnMultiplier,
    redemptionMultiplier,
    priority,
    isDefault,
    isActive,
    createdAt,
    updatedAt,
    _count,
  } = tier;

  // Safe Hex Color Parser fallback for visual tag identifiers
  const accentColor = color || "#64748b"; 

  return (
    <div className="space-y-6 py-2">
      {/* ── TOP HERO CONFIG DISPLAY ── */}
      <div 
        className="p-4 rounded-xl text-white relative overflow-hidden flex flex-col justify-between h-fit shadow-sm"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
        }}
      >
        {/* Subtle Decorative Background Layer */}
        <div className="absolute -right-2.5 -bottom-5 opacity-10">
          <Crown className="h-32 w-32" />
        </div>

        <div className="flex justify-between items-start z-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight">{name}</h3>
              {isDefault && (
                <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-none text-[10px] px-2 py-0">
                  Base Default
                </Badge>
              )}
            </div>
            <p className="text-xs text-white/80 mt-1 max-w-70 line-clamp-2 italic">
              {description || "No description configured for this reward program tier."}
            </p>
          </div>
          
          <Badge className={`border-none text-xs font-semibold ${isActive ? "bg-emerald-500/20 text-emerald-100" : "bg-rose-500/20 text-rose-100"}`}>
            {isActive ? "Active" : "Archived"}
          </Badge>
        </div>

        <div className="flex justify-between items-end z-10 border-t border-white/10 pt-2">
          <div>
            <span className="text-xs text-white/70 block uppercase tracking-wider text-[10px]">Milestone Requirement</span>
            <span className="text-lg font-bold font-mono">{minimumLifetimePoints.toLocaleString()} Points</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/70 block uppercase tracking-wider text-[10px]">Priority Level</span>
            <span className="text-sm font-semibold">Rank #{priority}</span>
          </div>
        </div>
      </div>

      {/* ── SECTION: TIER SYSTEM METRICS ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-background rounded-lg border text-muted-foreground shadow-sm">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">Active Members</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{_count.customers.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-background rounded-lg border text-muted-foreground shadow-sm">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">System Priority</p>
              <p className="text-xl font-bold tracking-tight text-foreground">LVL {priority}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION: MULTIPLIERS ENGINE ── */}
      <div className="space-y-3">
        <Separator />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" /> Program Rules & Multipliers
        </h4>
        <div className="border rounded-lg divide-y bg-card text-sm">
          <div className="flex justify-between p-3.5 items-center">
            <div className="flex flex-col">
              <span className="font-medium text-foreground">Point Accumulation Multiplier</span>
              <span className="text-xs text-muted-foreground max-w-65">Boosts points issued to the client during POS checkout transactions.</span>
            </div>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md text-sm border border-emerald-100 dark:border-emerald-900/50">
              {Number(earnMultiplier).toFixed(2)}x
            </span>
          </div>
          <div className="flex justify-between p-3.5 items-center">
            <div className="flex flex-col">
              <span className="font-medium text-foreground">Redemption Discount Multiplier</span>
              <span className="text-xs text-muted-foreground max-w-65">Modulates internal validation rates when swapping points for catalog incentives.</span>
            </div>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md text-sm border border-blue-100 dark:border-blue-900/50">
              {Number(redemptionMultiplier).toFixed(2)}x
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION: STRUCTURAL RULES ── */}
      <div className="space-y-3">
        <Separator />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" /> Behavioral System Configuration
        </h4>
        <div className="border rounded-lg divide-y bg-card text-sm">
          <div className="flex justify-between items-center p-3">
            <span className="text-muted-foreground text-xs">Default Fallback Configuration</span>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {isDefault ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600">Catch-all Baseline Tier</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground/60" />
                  <span className="text-muted-foreground">Milestone Milestone Only</span>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center p-3">
            <span className="text-muted-foreground text-xs">Evaluation Execution Engine</span>
            <span className="text-xs font-medium text-foreground">
              Priority Hierarchy Rank {priority}
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION: AUDIT TIMESTAMPS ── */}
      <div className="space-y-3">
        <Separator />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> Registry Timestamps
        </h4>
        <div className="border rounded-lg p-3 bg-card text-xs text-muted-foreground space-y-2">
          <div className="flex justify-between">
            <span>Configured Allocation Date</span>
            <span className="text-foreground font-medium">{format(new Date(createdAt), "PPP p")}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Parameter Modification</span>
            <span className="text-foreground font-medium">{format(new Date(updatedAt), "PPP p")}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2 border-dashed">
            <span>System Node Reference ID</span>
            <span className="font-mono text-[10px] select-all tracking-tight text-foreground">{id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};