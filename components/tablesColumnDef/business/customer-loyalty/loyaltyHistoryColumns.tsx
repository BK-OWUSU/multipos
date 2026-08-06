import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LoyaltyHistoryLedgerResponse } from "@/types/loyalty";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal } from "lucide-react";

// Type definition for a single transaction object from the ledger array
export type LoyaltyHistoryTransaction = LoyaltyHistoryLedgerResponse["transactions"][number];

export interface LoyaltyHistoryTableMeta {
  onViewLoyaltyHistory?:(loyaltyHistory: LoyaltyHistoryTransaction)=> void;
}

export const loyaltyHistoryColumns: ColumnDef<LoyaltyHistoryTransaction>[] = [
  {
    id: "createdAt.date",
    header: "Date",
    accessorFn: (row) => row.createdAt,
    cell: ({ getValue }) => {
      const date = getValue<Date>();
      return (
        <div className="flex flex-col text-sm">
          <span className="text-gray-900 font-medium">
            {new Date(date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      );
    },
  }, 
  {
    id: "createdAt.time",
    header: "Time",
    accessorFn: (row) => row.createdAt,
    cell: ({ getValue }) => {
      const date = getValue<Date>();
      return (
        <div className="flex flex-col text-sm">
          <span className="text-xs text-gray-800">
            {new Date(date).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      );
    },
  },
  {
    id: "customer",
    header: "Customer",
    accessorFn: (row) => `${row.customer.firstName} ${row.customer.lastName}`,
    cell: ({ row }) => {
      const { customer } = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {`${customer.firstName} ${customer.lastName}`}
          </span>
          {customer.phone && (
            <span className="text-xs text-gray-500">{customer.phone}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Action Type",
    cell: ({ getValue, row }) => {
      const type = getValue<string>();
      const reward = row.original.reward;
      
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 uppercase tracking-wider w-fit">
            {type.replace(/_/g, " ")}
          </span>
          {reward && (
            <span className="text-xs text-gray-500 line-clamp-1 max-w-50" title={reward.title}>
              {reward.title} ({reward.rewardType.toLowerCase()})
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "points",
    header: "Points Change",
    cell: ({ getValue, row }) => {
      const points = getValue<number>();
      
      // Determine direction. Deductions typically happen during redemption actions.
      // If your backend records redemptions as negative numbers, change the test to `points > 0`.
      const isDeduction = row.original.type.includes("REDEEM") || row.original.type.includes("DEDUCT");
      
      return (
        <span
          className={`text-sm font-bold ${
            isDeduction ? "text-red-600" : "text-green-600"
          }`}
        >
          {isDeduction ? "-" : "+"}
          {Math.abs(points).toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ getValue, row }) => {
      const reason = getValue<string | null>();
      const { saleId } = row.original;

      if (!reason && !saleId) return <span className="text-gray-400">—</span>;

      return (
        <div className="flex flex-col text-sm max-w-55">
          {reason && <span className="text-gray-700 truncate">{reason}</span>}
          {saleId && (
            <span className="text-xs font-mono text-gray-400">
              Sale ID: {row.original.sale?.customId|| saleId}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "performedBy",
    header: "Handled By",
    accessorFn: (row) => row.performedBy ? `${row.performedBy.firstName} ${row.performedBy.lastName}` : "",
    cell: ({ row }) => {
      const operator = row.original.performedBy;
      if (!operator) return <span className="text-xs text-gray-400 italic">System Auto</span>;

      return (
        <span className="text-sm text-gray-600">
          {`${operator.firstName} ${operator.lastName}`}
        </span>
      );
    },
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row, table }) => {
      const loyaltyHistory = row.original;  
      // Access meta handlers safely from the table config parent instance
      const meta = table.options.meta as LoyaltyHistoryTableMeta | undefined;
      return (
        <DropdownMenu>
           <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onViewLoyaltyHistory?.(loyaltyHistory)}>
              <Eye className="mr-2 h-4 w-4" /> View History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];