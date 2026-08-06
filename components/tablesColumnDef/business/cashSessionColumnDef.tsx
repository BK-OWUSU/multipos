"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatBusinessCurrency, formatTime12Hours } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"
import { useSaleStore } from "@/store/saleStore"
import { 
  MoreHorizontal, 
  Eye, 
  Lock, 
  Terminal, 
  User, 
  Clock, 
  DollarSign
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { TablePinActions } from "@/components/reusables/table/TablePinActions"
import { CashSessionSummary } from "@/types/sale.type"

// --- Sub-component for Row Actions ---
// const ActionCell = ({ session }: { session: CashSessionSummary }) => {
//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" className="h-8 w-8 p-0">
//           <MoreHorizontal className="h-4 w-4" />
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end" className="w-52">
//         <DropdownMenuLabel>Session Operations</DropdownMenuLabel>
        
//         <DropdownMenuItem onClick={() => toast.info(`Viewing transaction registry for ${session.customId}`)}>
//           <Eye className="mr-2 h-4 w-4" /> Audit Audit Logs
//         </DropdownMenuItem>

//         {session.status === "OPEN" && (
//           <>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem 
//               className="text-destructive focus:bg-destructive/10"
//               onClick={() => toast.info("Trigger close session modal flow")}
//             >
//               <Lock className="mr-2 h-4 w-4" /> Fast-Close Register
//             </DropdownMenuItem>
//           </>
//         )}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// };

export const cashSessionColumns: ColumnDef<CashSessionSummary>[] = [
  {
    accessorKey: "customId",
    header: () => <span className="flex items-center"><Terminal className="mr-2" size={16} />Session ID</span>,
    cell: ({ row }) => {
      const { customId, status } = row.original;
      const isOpen = status === "OPEN";
      return (
        <span className={`text-sm font-black tracking-tight ${isOpen ? "text-emerald-600" : "text-slate-500"}`}>
          {customId}
        </span>
      );
    },
  },
  {
  accessorKey: "openedBy.firstName",
  header: () => <span className="flex items-center"><User className="mr-2" size={16} /> Opened By</span>,
  cell: ({ row }) => {
    // 🟢 Extract the correct structural parameters cleanly
    const openedBy = row.original.openedBy;
    const isOpen = row.original.status === "OPEN";
    
    return (
      <span className={`text-sm font-bold capitalize ${isOpen ? "text-emerald-600" : "text-slate-900"}`}>
        {openedBy}
      </span>
    );
  },
 },
  {
    accessorKey: "openedAt",
    header: () => <span className="flex items-center"><Clock className="mr-2" size={16} /> Opened At</span>,
    cell: ({ row }) => {
      const isOpen = row.original.status === "OPEN";
      return (
        <span className={`text-sm font-bold ${isOpen ? "text-emerald-600" : "text-slate-500"}`}>
          {formatTime12Hours(row.original.openedAt)}
        </span>
      );
    },
  },
  {
    accessorKey: "closedAt",
    header: "Closed At",
    cell: ({ row }) => {
      const closedTime = row.original.closedAt;
      return (
        <span className="text-sm font-medium text-slate-500">
          {closedTime ? formatTime12Hours(closedTime) : "-"}
        </span>
      );
    },
  },
  {
    accessorKey: "startFloat",
    header: () => <span className="flex items-center"><DollarSign className="mr-2" size={16} /> Opening Float</span>,
    cell: ({ row }) => {
      const amount = row.original.startFloat;
      const user = useAuthStore.getState().user;
      return (
        <span className="text-sm font-black text-slate-900">
          {formatBusinessCurrency(amount, user?.business?.currencyCode || "GHS")}
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
      trueLabel: "Open Sessions",
      falseLabel: "Archived Shifts"
    },
    cell: ({ row }) => {
      const status = row.original.status;
      const isOpen = status === "OPEN";

      return (
        <Badge 
          variant={isOpen ? "default" : "secondary"} 
          className={`font-bold rounded-lg px-2.5 py-0.5 tracking-wide text-[10px] ${
            isOpen 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50" 
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          {status}
        </Badge>
      );
    },
  },
//   {
//     accessorKey: "Actions",
//     id: "actions",
//     header: () => (
//       <div className="flex items-center justify-end w-full gap-2 px-1">
//         <TablePinActions.HeaderIcon />
//         <span className="font-semibold text-white">Actions</span>
//       </div>
//     ),
//     cell: ({ row }) => <ActionCell session={row.original} />,
//     enableHiding: false, 
//     enableSorting: false,
//     enableResizing: false,
//     enableColumnFilter: false
//   }
]