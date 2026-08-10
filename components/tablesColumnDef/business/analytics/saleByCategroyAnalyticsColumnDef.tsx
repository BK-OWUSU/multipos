import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { ArrowUpRight, ArrowDownRight, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTableDetailItem } from "@/types/types/sale-by-category-analytics.type";

// 1. Table Meta Interface for Actions
export interface CategorySalesTableMeta {
  onViewCategoryAnalytics?: (category: CategoryTableDetailItem) => void;
}

// 2. Action Cell Component
interface CategorySalesRowActionsProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
}

export function CategorySalesRowActions<TData extends CategoryTableDetailItem>({ 
  row, 
  table 
}: CategorySalesRowActionsProps<TData>) {
  const category = row.original;
  const meta = table.options.meta as CategorySalesTableMeta | undefined;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        onClick={() => meta?.onViewCategoryAnalytics?.(category)}
        title="View category performance"
      >
        <BarChart2 className="h-4 w-4" />
        <span className="sr-only">View category performance</span>
      </Button>
    </div>
  );
}

// 3. Complete Category Sales Column Definitions
export const categorySalesColumns: ColumnDef<CategoryTableDetailItem>[] = [
  {
    accessorKey: "categoryName",
    header: "Category",
    cell: ({ row }) => {
      const categoryName: string = row.getValue("categoryName");
      
      const colors = [
        "bg-blue-500",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-purple-500",
        "bg-cyan-500",
        "bg-pink-500",
      ];
      const index = row.index % colors.length;
      const dotColor = colors[index];

      return (
        <div className="flex items-center gap-2 font-medium text-slate-900">
          <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
          <span>{categoryName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalSales",
    header: "Total Sales",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalSales") || "0");
      const formatted = new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        currencyDisplay: "code",
      }).format(amount).replace("GHS", "GH₵");

      return <div className="font-semibold text-slate-900">{formatted}</div>;
    },
  },
  {
    accessorKey: "transactions",
    header: "Transactions",
    cell: ({ row }) => {
      const count: number = row.getValue("transactions");
      return <div className="text-slate-700">{count.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "averageOrderValue",
    header: "Avg Order Value",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("averageOrderValue") || "0");
      const formatted = new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        currencyDisplay: "code",
      }).format(amount).replace("GHS", "GH₵");

      return <div className="text-slate-700">{formatted}</div>;
    },
  },
  {
    accessorKey: "itemsSold",
    header: "Items Sold",
    cell: ({ row }) => {
      const items: number = row.getValue("itemsSold");
      return <div className="text-slate-700">{items.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "refunds",
    header: "Refunds",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("refunds") || "0");
      const formatted = new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        currencyDisplay: "code",
      }).format(amount).replace("GHS", "GH₵");

      return <div className="text-slate-700">{formatted}</div>;
    },
  },
  {
    accessorKey: "percentageShare",
    header: "% of Total Sales",
    cell: ({ row }) => {
      const percentage = parseFloat(row.getValue("percentageShare") || "0");
      return <div className="text-slate-700">{percentage.toFixed(1)}%</div>;
    },
  },
  {
    accessorKey: "salesGrowth",
    header: "Sales Growth",
    cell: ({ row }) => {
      const growth = parseFloat(row.getValue("salesGrowth") || "0");
      const isPositive = growth >= 0;

      return (
        <div className={`flex items-center gap-1 font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
          {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          <span>{isPositive ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => <CategorySalesRowActions row={row} table={table} />,
  },
];