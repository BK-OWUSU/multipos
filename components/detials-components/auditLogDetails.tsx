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
  Hash,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogDetailsViewProps {
  log: NormalizedLogEntry | null;
}

export function LogDetailsView({ log }: LogDetailsViewProps) {
  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <ShieldCheck className="h-10 w-10 mb-2 stroke-1" />
        <p className="text-sm">No log selected.</p>
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
    <div className="space-y-6 pb-6">
      {/* Header Banner / Title Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400 uppercase">
            <Terminal className="h-3.5 w-3.5" />
            <span>System Audit Record</span>
          </div>
          <Badge className={`border font-semibold px-2.5 py-0.5 text-xs ${getLogTypeBadgeStyle(log.logType)}`}>
            {log.logType?.replace("_", " ")}
          </Badge>
        </div>
        
        <div className="my-3">
          <p className="text-xs text-slate-400 uppercase font-medium tracking-wider mb-1">Log Statement</p>
          <p className="text-sm font-medium text-slate-100 leading-relaxed break-words">
            {log.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            <span className="uppercase font-semibold tracking-wider">{log.action}</span>
          </div>
        </div>
      </div>

      {/* Meta Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card: Actor / Operator */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Operator</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 truncate">
              {log.user || "System User"}
            </p>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md mt-1 shadow-2xs">
              {log.role || "Standard"}
            </span>
          </div>
        </div>

        {/* Card: Module Zone */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Module Zone</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-wider">
              {log.module || "SYSTEM"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {log.branch || "Global Management"}
            </p>
          </div>
        </div>
      </div>

      {/* Network & Environment Details */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Monitor className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Terminal & Network Environment
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">IP Address</span>
            <span className="font-mono text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded select-all shadow-2xs">
              {log.ipAddress || "0.0.0.0"}
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">Subsidiary Branch</span>
            <span className="font-semibold text-slate-800">
              {log.branch || "Global Management"}
            </span>
          </div>
        </div>
      </div>

      {/* Internal Audit Hash Reference */}
      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
          <div className="p-1.5 bg-slate-200/60 text-slate-600 rounded-md">
            <Hash className="h-4 w-4" />
          </div>
          <span>Audit Reference Hash ID</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/60">
          <p className="font-mono text-[11px] text-slate-500 break-all select-all">
            {log.id}
          </p>
        </div>
      </div>
    </div>
  );
}