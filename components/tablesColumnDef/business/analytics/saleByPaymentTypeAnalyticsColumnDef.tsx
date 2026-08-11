import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { ArrowUpRight, ArrowDownRight, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentTableDetailItem } from "@/types/types/sale-by-paymentType-analytics.type";

// 1. Table Meta Interface for Actions
export interface PaymentSalesTableMeta {
  onViewPaymentAnalytics?: (payment: PaymentTableDetailItem) => void;
}

// 2. Action Cell Component
interface PaymentSalesRowActionsProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
}

export function PaymentSalesRowActions<TData extends PaymentTableDetailItem>({ 
  row, 
  table 
}: PaymentSalesRowActionsProps<TData>) {
  const payment = row.original;
  const meta = table.options.meta as PaymentSalesTableMeta | undefined;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        onClick={() => meta?.onViewPaymentAnalytics?.(payment)}
        title="View payment channel performance"
      >
        <BarChart2 className="h-4 w-4" />
        <span className="sr-only">View payment channel performance</span>
      </Button>
    </div>
  );
}

// 3. Complete Payment Sales Column Definitions
export const paymentSalesColumns: ColumnDef<PaymentTableDetailItem>[] = [
  {
    accessorKey: "name",
    header: "Payment Method",
    cell: ({ row }) => {
      const payment = row.original;
      const name = payment.name;
    //   const subtitle = payment.subtitle;

      // Color indicators matching the screenshot badges
      const dotColors = [
        "bg-amber-500",
        "bg-blue-600",
        "bg-emerald-500",
        "bg-pink-500",
        "bg-purple-500",
        "bg-cyan-500",
      ];
      const colorClass = dotColors[row.index % dotColors.length];

      return (
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{name}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "channelType",
    header: "Channel Type",
    cell: ({ row }) => {
      const channelType = row.original.channelType || row.original.subtitle;
      return <div className="text-slate-500">{channelType}</div>;
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
    header: "% Share",
    cell: ({ row }) => {
      const share = parseFloat(row.getValue("percentageShare") || "0");
      return <div className="font-medium text-slate-900">{share.toFixed(1)}%</div>;
    },
  },
  {
    accessorKey: "salesGrowth",
    header: "Growth",
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
    cell: ({ row, table }) => <PaymentSalesRowActions row={row} table={table} />,
  },
];