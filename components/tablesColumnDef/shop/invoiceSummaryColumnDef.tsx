import { ColumnDef } from "@tanstack/react-table";
import { InvoiceSummaryRow } from "@/store/invoiceStore"; // Adjust this import path
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";


export const invoiceSummaryColumns: ColumnDef<InvoiceSummaryRow>[] = [
  {
    accessorKey: "customId",
    header: "Reference",
    cell: ({ row }) => {
      return (
        <span className="font-mono font-semibold text-gray-900 tracking-tight">
          {row.getValue("customId")}
        </span>
      );
    },
  },
  {
    accessorKey: "paymentType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("paymentType") as string;
      
      const badgeStyles: Record<string, string> = {
        CASH: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
        MOMO: "bg-amber-50 text-amber-700 border-amber-200/60",
        CARD: "bg-blue-50 text-blue-700 border-blue-200/60",
        SPLIT: "bg-purple-50 text-purple-700 border-purple-200/60",
      };

      const currentStyle = badgeStyles[type] || "bg-gray-50 text-gray-700 border-gray-200";

      return (
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md border ${currentStyle}`}>
          {type === "CASH" ? "↓ " : type === "MOMO" ? "📱 " : "💳 "}
          {type}
        </span>
      );
    },
  },
  {
    accessorKey: "toCustomer",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.getValue("toCustomer") as string;
      const isWalkIn = customer === "Walk-in Customer";
      
      return (
        <span className={`font-medium ${isWalkIn ? "text-gray-400 italic" : "text-gray-700"}`}>
          {customer}
        </span>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount"));

      return (
        <div className="text-right font-bold text-gray-900">
          <CurrencyFormatter amount={amount} />
        </div>
      );
    },
  },
  {
    accessorKey: "byEmployee",
    header: "Processed By",
    cell: ({ row }) => (
      <span className="text-gray-600 text-sm">{row.getValue("byEmployee")}</span>
    ),
  },
  {
    id: "timestamp",
    header: "Time",
    cell: ({ row }) => {
      const date = row.original.date;
      const time = row.original.time;

      return (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-gray-700">{time}</span>
          <span className="text-xs text-gray-400 tracking-tight">{date}</span>
        </div>
      );
    },
  },
];