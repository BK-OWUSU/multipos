"use client";

import React from "react";
import { NormalizedLogEntry } from "@/types/auth/auditLogs";
import { 
  Calendar, 
  User, 
  Activity, 
  Layers, 
  ShieldAlert, 
  Terminal, 
  Monitor, 
  GitBranch, 
  Hash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface LogDetailsViewProps {
  log: NormalizedLogEntry | null;
}

export function LogDetailsView({ log }: LogDetailsViewProps) {
  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
        No log selected.
      </div>
    );
  }

  // Action badge color styling matching your column definition logic
  const getActionBadgeStyle = (action: string) => {
    const actionUpper = action?.toUpperCase() || "";
    if (actionUpper.includes("CREATE")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (actionUpper.includes("DELETE")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (actionUpper.includes("LOGIN")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  // Log Type color styling matching your column definition logic
  const getLogTypeBadgeStyle = (logType: string) => {
    const typeUpper = logType?.toUpperCase() || "";
    if (typeUpper === "SECURITY") return "bg-red-50 text-red-700 border-red-200";
    if (typeUpper === "DATA_CHANGE" || typeUpper === "DATA CHANGE") return "bg-amber-50 text-amber-700 border-amber-200";
    if (typeUpper === "STOCK_INVENTORY" || typeUpper === "STOCK LOG") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const formattedDate = new Date(log.createdAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex flex-col gap-5 text-xs">
      
      {/* ─── DESCRIPTION BANNER ───────────────────────────────────── */}
      <Card className="border border-slate-100 shadow-sm bg-slate-50/50">
        <CardContent className="p-4 flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal size={12} /> Log Statement
          </span>
          <p className="text-sm font-medium text-slate-800 leading-relaxed wrap-break-word">
            {log.description}
          </p>
        </CardContent>
      </Card>

      {/* ─── TAXONOMY BADGES ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Activity size={13} /> Action Profile
          </span>
          <Badge variant="outline" className={`font-bold uppercase py-1 justify-center border ${getActionBadgeStyle(log.action)}`}>
            {log.action}
          </Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <ShieldAlert size={13} /> Classification
          </span>
          <Badge variant="outline" className={`font-bold uppercase py-1 justify-center border ${getLogTypeBadgeStyle(log.logType)}`}>
            {log.logType?.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <hr className="border-slate-100 my-1" />

      {/* ─── METADATA GRID SECTION ───────────────────────────────── */}
      <div className="flex flex-col gap-4">
        
        {/* User context info */}
        <div className="flex items-start gap-3 p-1">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-600 shrink-0">
            <User size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Actor / Operator</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5">{log.user}</span>
            <span className="text-[10px] font-semibold text-slate-500 capitalize mt-0.5 bg-slate-100 border border-slate-200 px-1.5 py-px rounded-md w-max">
              {log.role?.toLowerCase()}
            </span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-start gap-3 p-1">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-600 shrink-0">
            <Calendar size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Execution Context Timeline</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5">{formattedDate}</span>
          </div>
        </div>

        {/* Structural Context location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-1">
            <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-600 shrink-0">
              <Layers size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium">Module Zone</span>
              <span className="font-bold text-slate-800 mt-1 uppercase tracking-wider">{log.module || "SYSTEM"}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-1">
            <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-600 shrink-0">
              <GitBranch size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium">Subsidiary Branch</span>
              <span className="font-semibold text-slate-800 mt-1">{log.branch || "Global Management"}</span>
            </div>
          </div>
        </div>

        {/* Network Profile */}
        <div className="flex items-start gap-3 p-1">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-600 shrink-0">
            <Monitor size={16} />
          </div>
          <div className="flex flex-col w-full">
            <span className="text-slate-400 font-medium">Remote Terminal IP Address</span>
            <span className="font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 mt-1 w-max select-all">
              {log.ipAddress || "0.0.0.0"}
            </span>
          </div>
        </div>

        {/* Unique Hash Identifier Reference */}
        <div className="flex items-start gap-3 p-1">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-600 shrink-0">
            <Hash size={16} />
          </div>
          <div className="flex flex-col w-full">
            <span className="text-slate-400 font-medium">Internal Audit Hash ID</span>
            <span className="font-mono text-[11px] text-slate-400 break-all select-all mt-1">
              {log.id}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}