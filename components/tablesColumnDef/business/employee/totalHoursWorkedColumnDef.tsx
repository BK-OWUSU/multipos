"use client";

import { Row, Table, ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Store,
  User,
  LogIn,
  LogOut,
  Hourglass,
  Activity,
  FileText,
  Eye,
//   Edit
} from "lucide-react";
import { TimeCard } from "@/types/timecards.type";
import Image from "next/image";

// 1. Table Meta interface for Time Card Actions
export interface TimeCardTableMeta {
  onViewTimeCard?: (timeCard: TimeCard) => void;
//   onEditTimeCard?: (timeCard: TimeCard) => void;
//   onDeleteTimeCard?: (timeCard: TimeCard) => void;
}

// 2. Action Cell Component
interface TimeCardRowActionsProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
}

export function TimeCardRowActions<TData extends TimeCard>({ 
  row, 
  table 
}: TimeCardRowActionsProps<TData>) {
  const timeCard = row.original;
  const meta = table.options.meta as TimeCardTableMeta | undefined;

  return (
    <div className="flex items-center justify-end gap-1 pr-2">
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg" 
        onClick={() => meta?.onViewTimeCard?.(timeCard)}
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </Button>
      {/* <Button 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg" 
        onClick={() => meta?.onEditTimeCard?.(timeCard)}
        title="Edit Time Card"
      >
        <Edit className="h-4 w-4" />
      </Button> */}
    </div>
  );
}

// 3. Complete Time Cards Column Definitions matching your UI mockup
export const totalHoursWorkedColumnDef: ColumnDef<TimeCard>[] = [
  // 1. EMPLOYEE
  {
    accessorKey: "employee",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <User size={16} /> Employee
      </span>
    ),
    filterFn: (row, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const employee = row.original.employee;
      const customId = row.original.customId.toLowerCase();
      if (!employee) return customId.includes(search);
      
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return fullName.includes(search) || customId.includes(search);
    },
    cell: ({ row }) => {
      const employee = row.original.employee;
      const customId = row.original.customId;
      const initials = employee 
        ? `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase() 
        : "EMP";

      return (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
            {employee?.imageUrl ? (
              <Image src={employee.imageUrl} alt={`${employee.firstName} ${employee.lastName}`} width={20} height={20} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-semibold text-xs">
              {employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {customId}
            </span>
          </div>
        </div>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (timeCard) => timeCard.employee ? `${timeCard.employee.firstName} ${timeCard.employee.lastName} (${timeCard.customId})` : timeCard.customId
    }
  },

  // 2. SHOP
  {
    accessorKey: "shop",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Store size={16} /> Shop
      </span>
    ),
    filterFn: (row, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const shop = row.original.shop;
      if (!shop) return "main branch".includes(search);
      return shop.name.toLowerCase().includes(search);
    },
    cell: ({ row }) => {
      const shop = row.original.shop;
      if (!shop) return <span className="text-slate-400 font-medium text-xs">Main Branch</span>;

      return (
        <div className="flex items-center gap-1.5">
          <Store className="text-slate-400 shrink-0" size={13} />
          <span className="text-gray-900 font-medium text-xs truncate max-w-40">{shop.name}</span>
        </div>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (timeCard) => timeCard.shop ? timeCard.shop.name : "Main Branch"
    }
  },

  // 3. DATE
  {
    accessorKey: "date",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Calendar size={16} /> Date
      </span>
    ),
    cell: ({ row }) => {
      const dateStr = row.getValue("date") as string | Date;
      if (!dateStr) return "-";
      return (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-900">
            {new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" })}
          </span>
        </div>
      );
    },
    meta: {
      filterVariant: "date",
      exportValue: (timeCard) => new Date(timeCard.date).toISOString().split("T")[0]
    }
  },

  // 4. CLOCK IN
  {
    accessorKey: "clockIn",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <LogIn size={16} /> Clock In
      </span>
    ),
    cell: ({ row }) => {
      const clockIn = row.getValue("clockIn") as string | Date;
      if (!clockIn) return "-";
      return (
        <span className="text-xs font-mono text-slate-700">
          {new Date(clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
        </span>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (timeCard) => new Date(timeCard.clockIn).toLocaleTimeString()
    }
  },

  // 5. CLOCK OUT
  {
    accessorKey: "clockOut",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <LogOut size={16} /> Clock Out
      </span>
    ),
    cell: ({ row }) => {
      const clockOut = row.original.clockOut;
      if (!clockOut) return <span className="text-slate-400 text-xs italic">Active shift</span>;
      return (
        <span className="text-xs font-mono text-slate-700">
          {new Date(clockOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
        </span>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (timeCard) => timeCard.clockOut ? new Date(timeCard.clockOut).toLocaleTimeString() : "Active"
    }
  },

  // 6. TOTAL HOURS
  {
    accessorKey: "totalHours",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Hourglass size={16} /> Total Hours
      </span>
    ),
    cell: ({ row }) => {
      const hours = row.original.totalHours;
      if (hours === null || hours === undefined) return <span className="text-slate-400 text-xs">-</span>;
      
      const numHours = Number(hours);
      return (
        <span className="font-bold text-xs text-blue-600 font-mono">
          {numHours.toFixed(2)}
        </span>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (timeCard) => timeCard.totalHours ? Number(timeCard.totalHours).toFixed(2) : "0"
    }
  },

  // 7. STATUS
  {
    accessorKey: "status",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Activity size={16} /> Status
      </span>
    ),
    filterFn: "equals",
    meta: {
      filterVariant: "selectArray",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "COMPLETED", label: "Completed" },
        { value: "MISSED_CLOCK_OUT", label: "Missed Clock Out" }
      ],
      exportValue: (timeCard) => timeCard.status
    },
    cell: ({ row }) => {
      const status = row.original.status;
      const styles: Record<string, string> = {
        ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        COMPLETED: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
        MISSED_CLOCK_OUT: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
      };

      return (
        <Badge variant="outline" className={`font-semibold border text-[10px] ${styles[status] || ""}`}>
          {status.replace(/_/g, " ")}
        </Badge>
      );
    },
  },

  // 8. NOTES
  {
    accessorKey: "notes",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <FileText size={16} /> Notes
      </span>
    ),
    cell: ({ row }) => {
      const notes = row.original.notes;
      if (!notes) return <span className="text-slate-300 text-xs">—</span>;
      return (
        <span className="text-slate-600 text-xs truncate max-w-45 block" title={notes}>
          {notes}
        </span>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (timeCard) => timeCard.notes || ""
    }
  },

  // 9. ACTIONS
  {
    accessorKey: "Actions",
    id: "actions",
    header: () => <div className="text-right pr-4 font-semibold">Actions</div>,
    cell: ({ row, table }) => <TimeCardRowActions row={row} table={table} />,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  },
];