"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  Coffee, 
  MoreHorizontal, 
  Eye, 
  FileText, 
  HelpCircle,
  Activity
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { TablePinActions } from "@/components/reusables/table/TablePinActions"
import { Decimal } from "@prisma/client/runtime/client";

// Define the exact structural interface for your TimeCard array log objects
export interface TimeCardLog {
  id: string
  clockIn: string | Date
  clockOut: string | Date | null
//   breakHours: number | string string | number | null
 totalHours: number | string | Decimal | null
  status: "ACTIVE" | "COMPLETED" | "MISSED_CLOCK_OUT"
  notes: string | null
}

// --- Sub-component for Row Action Controls ---
const ActionCell = ({ log }: { log: TimeCardLog }) => {
  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Shift Operations</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => toast.info(`Opening transaction logs for shift ${log.id.slice(0,8)}`)}>
            <Eye className="mr-2 h-4 w-4 text-slate-500" /> View Audit Details
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => toast.info(`Dispatched adjustment workflow for entry.`)}>
            <HelpCircle className="mr-2 h-4 w-4 text-slate-500" /> Request Correction
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const timeCardColumns: ColumnDef<TimeCardLog>[] = [
  {
    accessorKey: "clockIn",
    id: "date",
    header: () => <span className="flex items-center"><Calendar className="mr-2" size={16} /> Date</span>,
    cell: ({ row }) => {
      const { clockIn, status } = row.original;
      const isActive = status === "ACTIVE";
      const dateFormatted = new Date(clockIn).toLocaleDateString([], { 
        month: "short", 
        day: "2-digit",
        year: "numeric"
      });
      
      return (
        <span className={`text-sm font-semibold tracking-tight ${isActive ? "text-emerald-600" : "text-slate-800"}`}>
          {dateFormatted}
        </span>
      );
    },
  },
  {
    accessorKey: "clockIn",
    id: "day",
    header: "Day",
    cell: ({ row }) => {
      const dayName = new Date(row.original.clockIn).toLocaleDateString([], { weekday: "short" });
      return <span className="text-sm font-medium text-slate-400">{dayName}</span>;
    },
  },
  {
    accessorKey: "clockIn",
    header: () => <span className="flex items-center"><Clock className="mr-2" size={16} /> Clock In</span>,
    cell: ({ row }) => {
      const isActive = row.original.status === "ACTIVE";
      const timeFormatted = new Date(row.original.clockIn).toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      return (
        <span className={`text-sm font-bold ${isActive ? "text-emerald-600" : "text-slate-700"}`}>
          {timeFormatted}
        </span>
      );
    },
  },
  {
    accessorKey: "clockOut",
    header: () => <span className="flex items-center"><Clock className="mr-2" size={16} /> Clock Out</span>,
    cell: ({ row }) => {
      const { clockOut } = row.original;
      if (!clockOut) return <span className="text-sm font-mono text-slate-400">—</span>;
      
      const timeFormatted = new Date(clockOut).toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      return <span className="text-sm font-bold text-slate-700">{timeFormatted}</span>;
    },
  },
//   {
//     accessorKey: "breakHours",
//     header: () => <span className="flex items-center"><Coffee className="mr-2" size={16} /> Break (hrs)</span>,
//     cell: ({ row }) => {
//       const value = row.original.breakHours;
//       return (
//         <span className="text-sm font-mono text-slate-500 font-medium block text-center">
//           {value ? Number(value).toFixed(2) : "0.00"}
//         </span>
//       );
//     },
//   },
  {
    accessorKey: "totalHours",
    header: () => <span className="flex items-center font-bold ">Total Hours</span>,
    cell: ({ row }) => {
      const { totalHours, status } = row.original;
      const isActive = status === "ACTIVE";
      
      if (isActive) {
        return (
          <span className="text-sm font-black text-emerald-600 font-mono text-center  animate-pulse flex items-center justify-center gap-1">
            <Activity size={12} /> Live
          </span>
        );
      }
      
      return (
        <span className="text-sm font-black text-slate-900 font-mono text-center block">
          {totalHours ? Number(totalHours).toFixed(2) : "0.00"}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equals",
    meta: {
      filterVariant: "select",
    },
    cell: ({ row }) => {
      const status = row.original.status;

      return (
        <div className="flex justify-center">
          <Badge 
            variant="outline"
            className={`font-bold rounded-lg px-2.5 py-0.5 tracking-wide text-[10px] uppercase ${
              status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 animate-pulse" 
                : status === "COMPLETED"
                ? "bg-slate-50 text-slate-700 border-slate-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {status === "MISSED_CLOCK_OUT" ? "Missed Out" : status.toLowerCase()}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: () => <span className="flex items-center"><FileText className="mr-2" size={16} /> Notes</span>,
    cell: ({ row }) => {
      const notes = row.original.notes;
      return (
        <span className="text-xs font-medium text-slate-400 max-w-37.5 truncate block" title={notes || ""}>
          {notes || "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "Actions",
    id: "actions",
    header: () => (
      <div className="flex items-center justify-end w-full gap-2 px-1">
        <TablePinActions.HeaderIcon />
        <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Actions</span>
      </div>
    ),
    cell: ({ row }) => <ActionCell log={row.original} />,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  }
]