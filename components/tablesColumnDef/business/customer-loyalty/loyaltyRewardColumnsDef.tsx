import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge"; // Adjust paths based on your UI library
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { LoyaltyRewardsCatalogResponse } from "@/types/loyalty";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";

export interface LoyaltyRewardTableMeta {
  onEditLoyaltyReward?:(reward: RewardRow)=> void;
  onDeleteLoyaltyReward?:(id: string)=> void;
}

export type RewardRow = LoyaltyRewardsCatalogResponse[number];



export const loyaltyRewardColumn: ColumnDef<RewardRow>[] = [
  {
    accessorKey: "title",
    header: "Reward Name",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      const description = row.original.description;
      return (
        <div className="flex flex-col max-w-62.5">
          <span className="font-medium text-sm text-foreground">{title}</span>
          {description && (
            <span className="text-xs text-muted-foreground truncate" title={description}>
              {description}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "rewardType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("rewardType") as string;
      
      const variants: Record<string, { label: string; className: string }> = {
        PRODUCT: { label: "Free Product", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400" },
        FIXED_AMOUNT: { label: "Cash Discount", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400" },
        PERCENTAGE: { label: "Percent Off", className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400" },
        FREE_SERVICE: { label: "Free Service", className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400" },
      };

      const config = variants[type] || { label: type, className: "" };

      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "rewardValue",
    header: "Reward Value",
    cell: ({ row }) => {
      const type = row.original.rewardType;
      const val = row.original.rewardValue;
      
      // Fixed TS2339 by casting row context to access schema extension fields cleanly
      const rewardRaw = row.original as Record<string, unknown>;
      const sku = rewardRaw.applicableSku as string | undefined;

      if (type === "PERCENTAGE" && val) return <span className="font-medium">{String(val)}% Off</span>;
      if (type === "FIXED_AMOUNT" && val) return <span className="font-medium">{<CurrencyFormatter amount={Number(val)}/>} Off</span>;
      if (type === "PRODUCT" && sku) {
        return (
          <span className="text-sm text-muted-foreground truncate max-w-30" title={`SKU: ${sku}`}>
            SKU: {sku}
          </span>
        );
      }
      
      return <span className="text-muted-foreground text-xs">—</span>;
    },
  },
  {
    accessorKey: "pointsRequired",
    header: "Points Cost",
    cell: ({ row }) => {
      const points = row.getValue("pointsRequired") as number;
      return (
        <Badge variant="secondary" className="font-bold tracking-wide">
          {points.toLocaleString()} pts
        </Badge>
      );
    },
  },
  {
    id: "redemptions",
    header: "Total Redeemed",
    cell: ({ row }) => {
      const count = row.original._count?.histories ?? 0;
      return <span className="font-medium text-sm">{count.toLocaleString()} times</span>;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <Badge variant={isActive ? "default" : "destructive"} className="capitalize">
          {isActive ? "Active" : "Disabled"}
        </Badge>
      );
    },
  },
  { 
    header: "Actions",
    id: "actions",
    cell: ({ row, table }) => {
      const reward = row.original;
      
      // 👇 Access meta handlers safely from the table config parent instance
      const meta = table.options.meta as LoyaltyRewardTableMeta| undefined;

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
            <DropdownMenuItem onClick={() => meta?.onEditLoyaltyReward?.(reward)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => meta?.onDeleteLoyaltyReward?.(reward.id)} 
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Reward
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];