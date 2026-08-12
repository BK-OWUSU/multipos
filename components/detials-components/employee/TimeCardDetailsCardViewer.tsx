"use client";

import * as React from "react";
import { 
  Clock, 
  Calendar, 
  Store, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Timer,
  User
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { TimeCard, TimeCardStatus } from "@/types/timecards.type";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface TimeCardDetailsCardProps {
  timeCard: TimeCard;
}

const statusConfig: Record<TimeCardStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  ACTIVE: {
    label: "Active Shift",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    icon: <Clock className="h-3.5 w-3.5 text-blue-600 animate-pulse" />,
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
  },
  MISSED_CLOCK_OUT: {
    label: "Missed Clock Out",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    icon: <AlertCircle className="h-3.5 w-3.5 text-amber-600" />,
  },
};

export default function TimeCardDetailsCard({ timeCard }: TimeCardDetailsCardProps) {
  const currentStatus = statusConfig[timeCard.status] || statusConfig.COMPLETED;

  const formatDate = (dateInput: Date | string) => {
    try {
      return new Date(dateInput).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatTime = (dateInput: Date | string | null) => {
    if (!dateInput) return "---";
    try {
      return new Date(dateInput).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "---";
    }
  };

  return (
    <div className="space-y-6 pb-6 font-sans">
      
      {/* 1. Header Banner / Title Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400 uppercase">
            <Clock className="h-3.5 w-3.5" />
            <span>Timecard Ledger</span>
          </div>
          <Badge className={`border font-semibold px-2.5 py-0.5 text-xs ${currentStatus.bg} ${currentStatus.text}`}>
            {currentStatus.label}
          </Badge>
        </div>
        
        {/* Employee Profile Section in Header */}
        <div className="flex items-center gap-3.5 my-3">
          {timeCard.employee?.imageUrl ? (
            <Image 
              src={timeCard.employee.imageUrl} 
              alt={`${timeCard.employee.firstName} ${timeCard.employee.lastName}`}
              width={44}
              height={44}
              className="w-11 h-11 rounded-xl object-cover border border-slate-700 shadow-sm"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-bold text-sm shadow-sm">
              {timeCard.employee?.firstName?.[0] || "E"}
              {timeCard.employee?.lastName?.[0] || ""}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {timeCard.employee ? `${timeCard.employee.firstName} ${timeCard.employee.lastName}` : "Unknown Employee"}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span>{timeCard.employee?.designation || "Staff Member"}</span>
              <span>•</span>
              <span className="text-blue-400">{timeCard.customId}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            <span>{formatDate(timeCard.date)}</span>
          </div>
          {timeCard.shop && (
            <div className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-blue-400" />
              <span>{timeCard.shop.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Total Hours Card */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Hours</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Timer className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 tracking-tight">
              {timeCard.totalHours ? String(timeCard.totalHours) : "0.00"} <span className="text-xs font-normal text-slate-500">hrs</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Shift duration</p>
          </div>
        </div>

        {/* Work Date Card */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Work Date</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 truncate">
              {formatDate(timeCard.date)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Recorded timeline</p>
          </div>
        </div>
      </div>

      {/* 3. Shift Timeline Breakdown */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Clock Activity Metrics
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
            <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Clock In Time</span>
            <span className="font-bold text-slate-800 text-sm font-mono">{formatTime(timeCard.clockIn)}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
            <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Clock Out Time</span>
            <span className="font-bold text-slate-800 text-sm font-mono">{formatTime(timeCard.clockOut)}</span>
          </div>
        </div>
      </div>

      {/* 4. Shift Notes & Branch Details */}
      {timeCard.notes && (
        <div className="bg-blue-50/50 border border-blue-100/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-blue-900">
            <FileText className="h-4 w-4 text-blue-600" /> Shift Notes
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {timeCard.notes}
          </p>
        </div>
      )}

      {/* 5. Footer Timestamps */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 px-1">
        <span>Created: <strong className="text-slate-500 font-medium">{formatDate(timeCard.createdAt)}</strong></span>
        <span>Updated: <strong className="text-slate-500 font-medium">{formatDate(timeCard.updatedAt)}</strong></span>
      </div>

    </div>
  );
}