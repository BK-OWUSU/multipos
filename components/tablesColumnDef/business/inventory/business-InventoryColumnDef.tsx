"use client";

import { Row, Table, ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Layers, 
  Store, 
  Tag, 
  CircleDollarSign, 
  Activity, 
  Calendar, 
  Edit,
} from "lucide-react";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { FormattedInventoryRow } from "@/types/types/shopInventory.type";
import Image from "next/image";
import { FaEye } from "react-icons/fa";

// 1. Table Meta interface for Inventory Actions
export interface InventoryTableMeta {
  onEditItem?: (item: FormattedInventoryRow) => void;
  onViewDetails?: (item: FormattedInventoryRow) => void;
}

// 2. Action Cell Component
interface InventoryRowActionsProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
}

export function InventoryRowActions<TData extends FormattedInventoryRow>({ 
  row, 
  table 
}: InventoryRowActionsProps<TData>) {
  const item = row.original;
  const meta = table.options.meta as InventoryTableMeta | undefined;

  return (
    <div className="flex items-center justify-end gap-1 pr-2">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        onClick={() => meta?.onEditItem?.(item)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        onClick={() => meta?.onViewDetails?.(item)}
      >
        <FaEye className="h-4 w-4" />
      </Button>
    </div>
  );
}

// 3. Complete Inventory Column Definitions
export const businessInventoryColumnDef: ColumnDef<FormattedInventoryRow>[] = [
  // 1. PRODUCT / VARIANT (Image + Name + SKU)
  {
    accessorKey: "productName",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Package size={16} /> Product / Variant
      </span>
    ),
    filterFn: (row, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const productName = row.original.productName.toLowerCase();
      const sku = row.original.variantSku.toLowerCase();
      return productName.includes(search) || sku.includes(search);
    },
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
            {item.imageUrl ? (
              <Image 
                src={item.imageUrl} 
                alt={item.productName}
                width={40}
                height={40}
                quality={75}
                priority
                placeholder="blur"
                blurDataURL="/images/placeholder.png"
                className="h-full w-full object-cover" 
                />
            ) : (
              <Package className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900 leading-tight">{item.productName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.variantSku}</p>
          </div>
        </div>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (item) => `${item.productName} (${item.variantSku})`
    }
  },

  // 2. SKU
  {
    accessorKey: "variantSku",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Tag size={16} /> SKU
      </span>
    ),
    cell: ({ row }) => {
      return <span className="font-mono text-xs text-slate-600">{row.original.variantSku}</span>;
    },
    meta: {
      filterVariant: "text",
      exportValue: (item) => item.variantSku
    }
  },

  // 3. CATEGORY
  {
    accessorKey: "categoryName",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Layers size={16} /> Category
      </span>
    ),
    filterFn: "equals",
    cell: ({ row }) => {
      return <span className="text-slate-600 text-xs">{row.original.categoryName}</span>;
    },
    meta: {
      filterVariant: "text",
      exportValue: (item) => item.categoryName
    }
  },

  // 4. TOTAL STOCK
  {
    accessorKey: "totalStock",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Activity size={16} /> Total Stock
      </span>
    ),
    cell: ({ row }) => {
      return <div className="font-semibold text-slate-900 text-xs">{row.original.totalStock}</div>;
    },
    meta: {
      filterVariant: "text",
      exportValue: (item) => item.totalStock
    }
  },

  // 5. STOCK VALUE
  {
    accessorKey: "stockValue",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <CircleDollarSign size={16} /> Stock Value
      </span>
    ),
    cell: ({ row }) => {
      const amount = Number(row.original.stockValue);
      return (
        <span className="font-medium text-slate-900 text-xs">
          <CurrencyFormatter amount={amount} />
        </span>
      );
    },
    meta: {
      exportValue: (item) => item.stockValue
    }
  },

  // 6. SHOP BREAKDOWN
  {
    accessorKey: "shopBreakdown",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Store size={16} /> Shop Breakdown
      </span>
    ),
    enableColumnFilter: false,
    cell: ({ row }) => {
      const shopBreakdown = row.original.shopBreakdown;
      return (
        <div className="text-xs text-slate-600 space-y-0.5">
          {shopBreakdown.slice(0, 2).map((shop) => (
            <div key={shop.shopId}>
              <span className="font-medium">{shop.shopName}:</span> {shop.stock}
            </div>
          ))}
          {shopBreakdown.length > 2 && (
            <span className="text-blue-600 font-medium cursor-pointer">
              +{shopBreakdown.length - 2} more
            </span>
          )}
        </div>
      );
    },
    meta: {
      exportValue: (item) => item.shopBreakdown.map((s) => `${s.shopName}: ${s.stock}`).join("; ")
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
        { value: "In Stock", label: "In Stock" },
        { value: "Low Stock", label: "Low Stock" },
        { value: "Out Of Stock", label: "Out Of Stock" }
      ],
      exportValue: (item) => item.status
    },
    cell: ({ row }) => {
      const status = row.original.status;
      const styles = 
        status === "In Stock"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          : status === "Low Stock"
          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50";

      return (
        <Badge variant="outline" className={`font-semibold border text-[10px] ${styles}`}>
          {status}
        </Badge>
      );
    },
  },

  // 8. LAST UPDATED
  {
    accessorKey: "lastUpdated",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Calendar size={16} /> Last Updated
      </span>
    ),
    cell: ({ row }) => {
      const dateVal = row.original.lastUpdated;
      if (!dateVal) return "-";
      const dateObj = new Date(dateVal);
      return (
        <span className="text-xs text-slate-500">
          {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
          {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      );
    },
    meta: {
      filterVariant: "date",
      exportValue: (item) => new Date(item.lastUpdated).toISOString()
    }
  },

  // 9. ACTIONS
  {
    accessorKey: "Actions",
    id: "actions",
    header: () => <div className="text-right pr-4 font-semibold">Actions</div>,
    cell: ({ row, table }) => <InventoryRowActions row={row} table={table} />,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  },
];