import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LoyaltyTiersConfigResponse } from "@/types/loyalty";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, MoreHorizontal } from "lucide-react";

// Type definition for an individual tier object from your payload array
export type LoyaltyTierConfigItem = LoyaltyTiersConfigResponse[number];

export interface LoyaltyTierTableMeta {
  onViewLoyaltyTierDetails?: (tier: LoyaltyTierConfigItem) => void;
  onEditLoyaltyTier?: (tier: LoyaltyTierConfigItem) => void;
}


export const loyaltyTiersColumns: ColumnDef<LoyaltyTierConfigItem>[] = [
  {
    id: "tierInfo",
    header: "Tier Name",
    accessorFn: (row) => row.name,
    cell: ({ row }) => {
      const { name, color, description, isDefault } = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {/* Visual indicator dot showing the tier color */}
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: color || "#D1D5DB" }}
            />
            <span className="font-semibold text-gray-900">{name}</span>
            {isDefault && (
              <span className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium border border-blue-200">
                Default
              </span>
            )}
          </div>
          {description && (
            <span className="text-xs text-gray-500 line-clamp-1 max-w-60">
              {description}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "minimumLifetimePoints",
    header: "Requirement",
    cell: ({ getValue }) => {
      const points = getValue<number>();
      return (
        <span className="text-sm font-medium text-gray-700">
          {points === 0 ? "Entry Level" : `${points.toLocaleString()} pts`}
        </span>
      );
    },
  },
  {
    accessorKey: "earnMultiplier",
    header: "Earn Rate",
    cell: ({ getValue }) => {
      const multiplier = getValue<unknown>();
      
      // Safe type guard check for objects carrying a toString method (like Prisma.Decimal)
      const value = multiplier && typeof multiplier === "object" && "toString" in multiplier
        ? String(multiplier)
        : String(multiplier ?? "0");

      return <span className="text-sm font-medium text-gray-900">{value}x</span>;
    },
  },
  {
    accessorKey: "redemptionMultiplier",
    header: "Redeem Rate",
    cell: ({ getValue }) => {
      const multiplier = getValue<unknown>();
      
      const value = multiplier && typeof multiplier === "object" && "toString" in multiplier
        ? String(multiplier)
        : String(multiplier ?? "0");

      return <span className="text-sm text-gray-600">{value}x</span>;
    },
  },
  {
    id: "memberCount",
    header: "Members",
    accessorFn: (row) => row._count?.customers,
    cell: ({ getValue }) => {
      const count = getValue<number | undefined>();
      return (
        <span className="font-semibold text-gray-900">
          {count !== undefined ? count.toLocaleString() : "0"}
        </span>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => {
      const isActive = getValue<boolean>();
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isActive
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row, table }) => {
      const loyaltyTier = row.original;  
      // Access meta handlers safely from the table config parent instance
      const meta = table.options.meta as LoyaltyTierTableMeta | undefined;
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
            <DropdownMenuItem onClick={() => meta?.onEditLoyaltyTier?.(loyaltyTier)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.onViewLoyaltyTierDetails?.(loyaltyTier)}>
              <Eye className="mr-2 h-4 w-4" /> View History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];