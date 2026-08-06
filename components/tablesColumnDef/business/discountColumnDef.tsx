"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Edit2 } from "lucide-react";
import { format } from "date-fns";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Discount } from "@/types/schema/inventory";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";

// Helper function to safely parse and display dates
const formatTableDate = (dateVal: string | Date | null) => {
  if (!dateVal) return "—";
  try {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    return format(d, "MMM d, yyyy");
  } catch (e) {
    return "—";
  }
};

export const discountColumnDef: ColumnDef<Discount>[] = [
  {
    accessorKey: "name",
    header: "DISCOUNT NAME",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const description = row.original.description || `${row.original.type === "PERCENTAGE" ? `${row.original.value}%` : `Flat GH¢ ${row.original.value}`} off`;

      return (
        <div className="flex flex-col space-y-1 py-1 max-w-70">
          <span className="font-bold text-blue-950 text-sm tracking-tight hover:text-blue-800 cursor-pointer transition-colors">
            {name}
          </span>
          <span className="text-xs text-slate-400 font-medium truncate">
            {description}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "TYPE",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <span className="text-xs font-semibold text-slate-500 tracking-normal">
          {type}
        </span>
      );
    },
  },
  {
    accessorKey: "value",
    header: "VALUE",
    cell: ({ row }) => {
      const type = row.original.type;
      const value = row.getValue("value") as number;

      return (
        <span className="text-sm font-extrabold text-blue-950 tracking-tight">
          {type === "PERCENTAGE" ? `${value}%` : <CurrencyFormatter amount={value}/>}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ row }) => {
      const status = row.getValue("status") as Discount["status"];

      // State variations matching layout badges exactly
      const variants: Record<Discount["status"], string> = {
        ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50/80",
        SCHEDULED: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50/80",
        EXPIRED: "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-50/80",
        INACTIVE: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50/80",
      };

      return (
        <Badge 
          variant="outline" 
          className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider border uppercase transition-none shadow-none ${variants[status] || variants.INACTIVE}`}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: "START DATE",
    cell: ({ row }) => {
      return (
        <span className="text-xs font-medium text-slate-600">
          {formatTableDate(row.original.startDate)}
        </span>
      );
    },
  },
  {
    accessorKey: "endDate",
    header: "END DATE",
    cell: ({ row }) => {
      return (
        <span className="text-xs font-medium text-slate-600">
          {formatTableDate(row.original.endDate)}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "CREATED AT",
    cell: ({ row }) => {
      const dateVal = row.getValue("createdAt");
      if (!dateVal) return "—";
      
      try {
        const d = typeof dateVal === "string" ? new Date(dateVal) : (dateVal as Date);
        return (
          <div className="flex flex-col space-y-0.5 text-xs font-medium">
            <span className="text-slate-700">{format(d, "MMM d, yyyy")}</span>
            <span className="text-[10px] text-slate-400 font-normal">{format(d, "hh:mm a")}</span>
          </div>
        );
      } catch (e) {
        return "—";
      }
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-3">ACTIONS</div>,
    cell: ({ row }) => {
      const discount = row.original;

      return (
        <div className="flex items-center justify-end gap-2 pr-1">
          {/* Direct Edit Pencil Shortcut Icon Button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-900 hover:bg-slate-50 border border-transparent hover:border-slate-100"
            onClick={() => console.log("Edit action clicked for target row ID:", discount.id)}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>

          {/* Context Options Multi-Action Dropdown Menu Container */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 data-[state=open]:bg-slate-50"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 shadow-md border-slate-100 rounded-xl p-1 text-slate-700">
              <DropdownMenuItem 
                className="text-xs font-semibold rounded-lg cursor-pointer px-2.5 py-2 hover:bg-slate-50 focus:bg-slate-50 text-slate-700"
                onClick={() => console.log("Deep view profile analytics schema data target ID:", discount.id)}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-xs font-semibold rounded-lg cursor-pointer px-2.5 py-2 hover:bg-slate-50 focus:bg-slate-50 text-rose-600 focus:text-rose-600"
                onClick={() => console.log("Trigger deletion pipeline for element payload context:", discount.id)}
              >
                Delete Discount
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];