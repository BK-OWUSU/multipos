"use client";

import * as React from "react";
import { 
  Clock, 
  Calendar, 
  Store, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Timer
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { TimeCard, TimeCardStatus } from "@/types/timecards.type";
import Image from "next/image";

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
    <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-6 space-y-6 w-full font-sans">
      
      {/* 1. Header Profile & Status */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          {timeCard.employee?.imageUrl ? (
            <Image 
              src={timeCard.employee.imageUrl} 
              alt={`${timeCard.employee.firstName} ${timeCard.employee.lastName}`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200/80 shadow-xs"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100/60 shadow-xs">
              {timeCard.employee?.firstName?.[0] || "E"}
              {timeCard.employee?.lastName?.[0] || ""}
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {timeCard.employee ? `${timeCard.employee.firstName} ${timeCard.employee.lastName}` : "Unknown Employee"}
            </h3>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              <span>{timeCard.employee?.designation || "Staff Member"}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-semibold">{timeCard.customId}</span>
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs shrink-0 ${currentStatus.bg} ${currentStatus.text}`}>
          {currentStatus.icon}
          <span>{currentStatus.label}</span>
        </div>
      </div>

      {/* 2. Main 2x2 Clean Metrics Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* Date Card */}
        <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 rounded-2xl p-4 transition-all space-y-1.5">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-100 text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            Work Date
          </div>
          <div className="text-sm font-bold text-slate-900 pt-0.5">
            {formatDate(timeCard.date)}
          </div>
        </div>

        {/* Total Hours Card */}
        <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 rounded-2xl p-4 transition-all space-y-1.5">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-100 text-emerald-600">
              <Timer className="h-3.5 w-3.5" />
            </div>
            Total Hours
          </div>
          <div className="text-sm font-bold text-slate-900 pt-0.5">
            {timeCard.totalHours ? String(timeCard.totalHours) : "0.00"} <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
        </div>

        {/* Clock In Card */}
        <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 rounded-2xl p-4 transition-all space-y-1.5">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-100 text-blue-600">
              <Clock className="h-3.5 w-3.5" />
            </div>
            Clock In Time
          </div>
          <div className="text-sm font-bold text-slate-900 pt-0.5">
            {formatTime(timeCard.clockIn)}
          </div>
        </div>

        {/* Clock Out Card */}
        <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 rounded-2xl p-4 transition-all space-y-1.5">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-100 text-amber-600">
              <Clock className="h-3.5 w-3.5" />
            </div>
            Clock Out Time
          </div>
          <div className="text-sm font-bold text-slate-900 pt-0.5">
            {formatTime(timeCard.clockOut)}
          </div>
        </div>

      </div>

      {/* 3. Shop & Shift Notes Info Box */}
      <div className="space-y-3">
        
        <div className="flex items-center justify-between text-xs px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100/80">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-100 text-slate-500">
              <Store className="h-4 w-4" />
            </div>
            Assigned Branch
          </div>
          <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200/60 shadow-xs">
            {timeCard.shop?.name || "Main Branch / Unassigned"}
          </span>
        </div>

        {timeCard.notes && (
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/80 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-blue-900">
              <FileText className="h-4 w-4 text-blue-600" /> Shift Notes
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {timeCard.notes}
            </p>
          </div>
        )}

      </div>

      {/* 4. Footer Metadata */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-100">
        <span>Created: <strong className="text-slate-500 font-medium">{formatDate(timeCard.createdAt)}</strong></span>
        <span>Updated: <strong className="text-slate-500 font-medium">{formatDate(timeCard.updatedAt)}</strong></span>
      </div>

    </Card>
  );
}