"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { 
  Briefcase, 
  Clock, 
  LogOut, 
  History 
} from "lucide-react"

interface SidebarStateProps {
  isExpanded?: boolean; // 🟢 Pass down your sidebar state to handle collapsing layouts
}

// --- REUSABLE PARENT CONTAINER ---
export function QuickActionsGroup({ children, isExpanded = true }: { children: React.ReactNode } & SidebarStateProps) {
  return (
    // 🟢 Clean container transitioning: removes padding and title text when collapsed
    <div className={cn(
      "flex flex-col gap-4 w-full bg-blue-950 transition-all duration-200",
      isExpanded ? "p-4" : "p-2 items-center"
    )}>
      {isExpanded && (
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-50 px-1 animate-in fade-in duration-200">
          Quick Actions
        </h3>
      )}
      
      {/* 🟢 Changes grid from double columns into a single column icon stack when collapsed */}
      <div className={cn(
        "w-full transition-all duration-200",
        isExpanded ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3 items-center"
      )}>
        {children}
      </div>
    </div>
  )
}

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, SidebarStateProps {
  className?: string
}

// ─── 1. OPEN REGISTER BUTTON ─────────────────────────────────────
export const OpenRegisterButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, isExpanded = true, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center rounded-xl font-semibold text-sm transition-all duration-200",
          "bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/25 active:scale-[0.99]",
          isExpanded ? "col-span-2 gap-3 w-full h-10 px-3" : "w-10 h-10 justify-center px-0",
          className
        )}
        title={!isExpanded ? "Open Register" : undefined} // Tooltip when collapsed
        {...props}
      >
        <div className="flex items-center justify-center p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shrink-0">
          <Briefcase size={14} strokeWidth={2.5} />
        </div>
        {isExpanded && <span className="animate-in fade-in zoom-in-95 duration-200 truncate">Open Register</span>}
      </button>
    )
  }
)
OpenRegisterButton.displayName = "OpenRegisterButton"


// ─── 2. CLOCK IN BUTTON ───────────────────────────────────────────
export const ClockInButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, isExpanded = true, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center rounded-xl font-semibold text-sm transition-all duration-200",
          "bg-blue-800/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 active:scale-[0.98]",
          isExpanded ? "gap-2 h-10 px-2 w-full justify-start" : "w-10 h-10 justify-center px-0",
          className
        )}
        title={!isExpanded ? "Clock In" : undefined}
        {...props}
      >
        <div className="flex items-center justify-center p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/10 shrink-0">
          <Clock size={14} strokeWidth={2.5} />
        </div>
        {isExpanded && <span className="animate-in fade-in zoom-in-95 duration-200 truncate">Clock In</span>}
      </button>
    )
  }
)
ClockInButton.displayName = "ClockInButton"


// ─── 3. CLOCK OUT BUTTON ──────────────────────────────────────────
export const ClockOutButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, isExpanded = true, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center rounded-xl font-semibold text-sm transition-all duration-200",
          "bg-orange-600/10 border border-orange-500/20 text-orange-400 hover:bg-orange-600/20 active:scale-[0.98]",
          isExpanded ? "gap-2 h-10 px-2 w-full justify-start" : "w-10 h-10 justify-center px-0",
          className
        )}
        title={!isExpanded ? "Clock Out" : undefined}
        {...props}
      >
        <div className="flex items-center justify-center p-1.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/10 shrink-0">
          <LogOut size={14} strokeWidth={2.5} />
        </div>
        {isExpanded && <span className="animate-in fade-in zoom-in-95 duration-200 truncate">Clock Out</span>}
      </button>
    )
  }
)
ClockOutButton.displayName = "ClockOutButton"


// ─── 4. VIEW ALL SESSIONS BUTTON ─────────────────────────────────────
export const ViewAllSessionsButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, isExpanded = true, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center rounded-xl font-semibold text-sm transition-all duration-200",
          "bg-zinc-800/40 border border-zinc-700/30 text-zinc-300 hover:bg-zinc-800/70 active:scale-[0.99]",
          isExpanded ? "col-span-2 gap-3 w-full h-12 px-4" : "w-10 h-10 justify-center px-0",
          className
        )}
        title={!isExpanded ? "View All Sessions" : undefined}
        {...props}
      >
        <div className="flex items-center justify-center p-1.5 rounded-lg bg-zinc-700/20 text-zinc-400 border border-zinc-700/20 shrink-0">
          <History size={16} strokeWidth={2.5} />
        </div>
        {isExpanded && <span className="animate-in fade-in zoom-in-95 duration-200 truncate">View All Sessions</span>}
      </button>
    )
  }
)
ViewAllSessionsButton.displayName = "ViewAllSessionsButton"