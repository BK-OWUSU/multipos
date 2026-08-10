import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { ArrowUpRight, ArrowDownRight, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeTableDetailItem } from "@/types/types/sale-by-employee-analytics.types";


// 1. Table Meta Interface for Actions
export interface EmployeeSalesTableMeta {
  onViewEmployeeAnalytics?: (employee: EmployeeTableDetailItem) => void;
}

// 2. Action Cell Component
interface EmployeeSalesRowActionsProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
}

export function EmployeeSalesRowActions<TData extends EmployeeTableDetailItem>({ 
  row, 
  table 
}: EmployeeSalesRowActionsProps<TData>) {
  const employee = row.original;
  const meta = table.options.meta as EmployeeSalesTableMeta | undefined;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        onClick={() => meta?.onViewEmployeeAnalytics?.(employee)}
        title="View employee performance"
      >
        <BarChart2 className="h-4 w-4" />
        <span className="sr-only">View employee performance</span>
      </Button>
    </div>
  );
}

// Helper to extract initials for avatar fallback
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

// 3. Complete Employee Sales Column Definitions
export const employeeSalesColumns: ColumnDef<EmployeeTableDetailItem>[] = [
  {
    accessorKey: "name",
    header: "Employee",
    cell: ({ row }) => {
      const employee = row.original;
      const name = employee.name;
      const subtitle = employee.subtitle;
      const imageUrl = employee.imageUrl;
      const initials = getInitials(name);

      const avatarColors = [
        "bg-blue-100 text-blue-700",
        "bg-emerald-100 text-emerald-700",
        "bg-amber-100 text-amber-700",
        "bg-purple-100 text-purple-700",
        "bg-cyan-100 text-cyan-700",
        "bg-pink-100 text-pink-700",
      ];
      const colorClass = avatarColors[row.index % avatarColors.length];

      return (
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name} 
              className="h-9 w-9 rounded-full object-cover border border-slate-200" 
            />
          ) : (
            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold text-xs ${colorClass}`}>
              {initials}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{name}</span>
            {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
          </div>
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
    accessorKey: "discounts",
    header: "Discounts",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("discounts") || "0");
      const formatted = new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        currencyDisplay: "code",
      }).format(amount).replace("GHS", "GH₵");

      return <div className="text-slate-700">{formatted}</div>;
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
    cell: ({ row, table }) => <EmployeeSalesRowActions row={row} table={table} />,
  },
];