"use client";

import { Row, Table, ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Layers, 
  Tag, 
  Activity, 
  Calendar, 
  Edit,
  MoreVertical,
  Scale,
  AlertCircle,
} from "lucide-react";
import { FormattedInventoryRow } from "@/types/types/shopInventory.type";
import Image from "next/image";

// 1. Table Meta interface for Inventory Actions
export interface InventoryTableMeta {
  onEditItem?: (item: FormattedInventoryRow) => void;
  onViewDetails?: (item: FormattedInventoryRow) => void;
}

// 2. Action Cell Component matching the design layout with Edit and More options
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
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}

// 3. Complete Inventory Column Definitions mapping the image layout using the exact fields from FormattedInventoryRow
export const shopInventoryColumnDef: ColumnDef<FormattedInventoryRow>[] = [
  // 1. PRODUCT / VARIANT
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
      exportValue: (item: FormattedInventoryRow) => `${item.productName} (${item.variantSku})`
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
      exportValue: (item: FormattedInventoryRow) => item.variantSku
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
      exportValue: (item: FormattedInventoryRow) => item.categoryName
    }
  },

  // 4. UNIT (Mapped to a static/default display since unit isn't in FormattedInventoryRow, avoiding 'any')
  {
    accessorKey: "unit",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Scale size={16} /> Unit
      </span>
    ),
    cell: () => {
      return <span className="text-slate-600 text-xs">pcs</span>;
    },
    meta: {
      filterVariant: "text",
      exportValue: () => "pcs"
    }
  },

  // 5. AVAILABLE QTY (Mapped from totalStock)
  {
    accessorKey: "totalStock",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Activity size={16} /> Available Qty
      </span>
    ),
    cell: ({ row }) => {
      const item = row.original;
      const qtyNumber = Number(item.totalStock) || 0;
      const qtyColor = 
        qtyNumber === 0 
          ? "text-rose-600 font-bold" 
          : qtyNumber < 15 
          ? "text-amber-600 font-bold" 
          : "text-emerald-600 font-bold";

      return (
        <span className={`text-xs ${qtyColor}`}>
          {item.totalStock}
        </span>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (item: FormattedInventoryRow) => item.totalStock
    }
  },

  // 6. MIN STOCK LEVEL (Derived dynamically from shopBreakdown's lowStockAlert to fit structure cleanly)
  {
    accessorKey: "minStockLevel",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <AlertCircle size={16} /> Min Stock Level
      </span>
    ),
    cell: ({ row }) => {
      const breakdown = row.original.shopBreakdown;
      const minAlert = breakdown.length > 0 ? breakdown[0].lowStockAlert : 20;
      return <span className="text-slate-600 text-xs">{minAlert}</span>;
    },
    meta: {
      filterVariant: "text",
      exportValue: (item: FormattedInventoryRow) => item.shopBreakdown[0]?.lowStockAlert ?? 20
    }
  },

  // 7. STOCK STATUS (Mapped from status)
  {
    accessorKey: "status",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Activity size={16} /> Stock Status
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
      exportValue: (item: FormattedInventoryRow) => item.status
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
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
          {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      );
    },
    meta: {
      filterVariant: "date",
      exportValue: (item: FormattedInventoryRow) => new Date(item.lastUpdated).toISOString()
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