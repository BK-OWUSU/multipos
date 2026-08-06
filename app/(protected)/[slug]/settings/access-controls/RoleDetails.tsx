"use client";

import React from "react";
import { 
  ShieldCheck, 
  LayoutGrid, 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle,

  Briefcase,
  History,
  ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn, formatSessionDate, formatStandardDateTime } from "@/lib/utils";
import { RolesWithRelations } from "@/types/auth/role.type";
import { accessLength, permissionLength } from "@/lib/accessPermissionSecurity";

export default function RoleDetails({ role }: { role: RolesWithRelations | null }) {
  console.log(role)
  // Guard against unselected or null role profiles
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl bg-slate-50/40 p-6 animate-in fade-in duration-300">
        <ShieldAlert className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm font-medium text-slate-500">No role profile selected</p>
        <p className="text-xs text-slate-400 max-w-60 mt-0.5">Select a security profile role from the list feed to audit parameters.</p>
      </div>
    );
  }

  const creatorName = role.creator?.employee 
    ? `${role.creator.employee.firstName} ${role.creator.employee.lastName}`
    : "System Engine";

  const updaterName = role.updater?.employee 
    ? `${role.updater.employee.firstName} ${role.updater.employee.lastName}`
    : "System Engine";

  return (
    <div className="space-y-6 animate-in fade-in duration-300 py-1">
      {/* ── SECTION 1: STATISTICS HIGHLIGHT GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard 
          icon={<ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={16} />} 
          bg="bg-indigo-50 dark:bg-indigo-950/30"
          label="Total Access Routes" 
          value={accessLength(role.access || [])} 
          subtext="Assigned action tags"
        />
        <StatCard 
          icon={<LayoutGrid className="text-blue-600 dark:text-blue-400" size={16} />} 
          bg="bg-blue-50 dark:bg-blue-950/30"
          label="Total Matrix" 
          value={permissionLength(role.permissions)} 
          subtext="Operational boundaries"
        />
        <StatCard 
          icon={<Users className="text-purple-600 dark:text-purple-400" size={16} />} 
          bg="bg-purple-50 dark:bg-purple-950/30"
          label="Active Users" 
          value={role._count?.employee || 0} 
          subtext="Staff assigned this role"
        />
        <StatCard 
          icon={<Calendar className="text-sky-600 dark:text-sky-400" size={16} />} 
          bg="bg-sky-50 dark:bg-sky-950/30"
          label="Last Structural Shift" 
          value={formatSessionDate(role.updatedAt).relative} 
          subtext={formatSessionDate(role.updatedAt).precise}
        />
      </div>

      {/* ── SECTION 2: METADATA INFORMATION BLOCK ── */}
      <Card className="bg-white border shadow-sm rounded-xl">
        <CardContent className="p-5 space-y-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Identity & Structural Classification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 border rounded-lg bg-slate-50/30 divide-y md:divide-y-0 md:divide-x p-1">
              <div className="divide-y divide-slate-100 p-3 space-y-3">
                <InfoRow label="Security Role Name" value={role.name} />
                <InfoRow 
                  label="Classification Type" 
                  value={
                    role.type === "SYSTEM" 
                      ? <StatusBadge active label="System Immutable" /> 
                      : role.type === "CUSTOM" 
                        ? <StatusBadge altActive label="Custom Modifiable" /> 
                        : <StatusBadge active={false} label="Temporary Session" />
                  } 
                />
              </div>
              <div className="divide-y divide-slate-100 p-3 space-y-3">
                <InfoRow 
                  label="Lifecycle Status" 
                  value={
                    <Badge variant="outline" className={cn(
                      "font-semibold text-xs px-2 py-0.5 rounded-md border",
                      role.isDeleted 
                        ? "bg-rose-50 text-rose-700 border-rose-200" 
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      {role.isDeleted ? "Archived / Void" : "Active Pool"}
                    </Badge>
                  } 
                />
                <InfoRow label="Lifespan Expiry Date" value={role.expiresAt ? formatStandardDateTime(role.expiresAt) : "Permanent Policy Locked"} />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="pt-2">
            <span className="text-xs text-slate-400 font-medium block mb-1">Functional Operational Description</span>
            <div className="p-3 bg-slate-50/50 border rounded-lg text-sm text-slate-600 leading-relaxed font-medium italic">
              {role.description || "No supplemental description rules established for this specific access profile."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 3: SYSTEM AUDIT FOOTPRINT TRAIL ── */}
      <div className="space-y-3">
        <Separator />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" /> Security System Audit Log
        </h4>
        <div className="border rounded-xl p-4 bg-slate-50/30 text-xs text-slate-500 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="font-medium">System Initial Allocation Date</span>
            <span className="text-slate-900 font-semibold">{formatStandardDateTime(role.createdAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Operational Actor Identity Origin (Creator)</span>
            <span className="text-slate-900 font-semibold">{creatorName}</span>
          </div>
          <Separator className="my-1 border-dashed" />
          <div className="flex justify-between items-center">
            <span className="font-medium">Parameter Modification Timestamp</span>
            <span className="text-slate-900 font-semibold">{formatStandardDateTime(role.updatedAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Authorizing Modification Actor (Updater)</span>
            <span className="text-slate-900 font-semibold">{updaterName}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 font-mono text-[10px] text-slate-400 select-all tracking-tight">
            <span>ROLE CORE REF COMPONENT NODE ID</span>
            <span>{role.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── OPTIMIZED HELPER COMPONENTS ─────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-sm">
      <span className="text-slate-400 font-medium text-xs">{label}</span>
      <div className="text-slate-900 font-semibold text-right">
        {value || <span className="text-slate-300">—</span>}
      </div>
    </div>
  );
}

function StatusBadge({ altActive, active, label }: { altActive?: boolean; active?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      {active ? (
        <CheckCircle2 className="text-emerald-500 shrink-0" size={13} />
      ) : altActive ? (
        <CheckCircle2 className="text-orange-400 shrink-0" size={13} />
      ) : (
        <XCircle className="text-blue-400 shrink-0" size={13} />
      )}
      <span className={cn(
        "text-xs font-semibold",
        active && "text-emerald-600",
        altActive && "text-orange-600",
        !active && !altActive && "text-blue-600"
      )}>
        {label}
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, bg }: { icon: React.ReactNode; label: string; value: string | number; subtext: string; bg: string }) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between min-h-24 gap-2">
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={cn("p-1.5 rounded-md shrink-0", bg)}>
          {icon}
        </div>
      </div>
      <div>
        <span className="text-lg font-bold text-slate-900 block tracking-tight leading-none mb-1">{value}</span>
        <span className="text-[10px] text-slate-400 font-medium block truncate">{subtext}</span>
      </div>
    </div>
  );
}