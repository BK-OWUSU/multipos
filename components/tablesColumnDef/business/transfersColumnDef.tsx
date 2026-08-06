import { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransferRecord } from "@/types/types";

export const transfersColumnDef: ColumnDef<TransferRecord>[] = [
  {
    accessorKey: "referenceNo",
    header: "Reference No.",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-blue-950 text-[11px]">
        {row.getValue("referenceNo")}
      </span>
    ),
    // meta: {
    //   exportHeader: "Reference Number",
    // },
  },
  {
    accessorKey: "fromShop",
    header: "From Shop",
    cell: ({ row }) => (
      <span className="font-bold text-slate-800">
        {row.getValue("fromShop")}
      </span>
    ),
  },
  {
    id: "routingArrow",
    header: "",
    cell: () => (
      <div className="text-slate-300 flex justify-center">
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    ),
    // meta: {
    //   // Exclude structural decoration elements from document downloads
    //   exportValue: () => "",
    //   exportHeader: "Direction"
    // }
  },
  {
    accessorKey: "toShop",
    header: "To Shop",
    cell: ({ row }) => (
      <span className="font-bold text-slate-800">
        {row.getValue("toShop")}
      </span>
    ),
  },
  {
    accessorKey: "itemsCount",
    header: "Items",
    cell: ({ row }) => (
      <span className="font-bold">{row.getValue("itemsCount")}</span>
    ),
  },
  {
    accessorKey: "unitsCount",
    header: "Units",
    cell: ({ row }) => (
      <span className="font-bold">{row.getValue("unitsCount")}</span>
    ),
  },
  {
    accessorKey: "totalValue",
    header: "Total Value (GH₵)",
    cell: ({ row }) => {
      const val = parseFloat(row.getValue("totalValue"));
      return (
        <span className="font-mono font-black text-blue-950">
          {val.toFixed(2)}
        </span>
      );
    },
    // meta: {
    //   exportValue: (value) => `GH₵ ${parseFloat(value as string).toFixed(2)}`,
    // },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      const variants: Record<string, string> = {
        "Received": "bg-emerald-50 text-emerald-700",
        "In Transit": "bg-blue-50 text-blue-600",
        "Pending": "bg-amber-50 text-amber-700",
        "Cancelled": "bg-red-50 text-red-700",
      };

      return (
        <Badge className={`shadow-none border-none font-black text-[9px] h-5 px-2 rounded-md ${variants[status] || "bg-slate-50"}`}>
          {status}
        </Badge>
      );
    },
  },  
  {
    accessorKey: "transferPriority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("transferPriority") as string;
      const variants: Record<string, string> = {
        "Normal": "bg-emerald-50 text-emerald-700",
        "Medium": "bg-blue-50 text-blue-600",
        "Urgent": "bg-red-50 text-red-700",
      };

      return (
        <Badge className={`shadow-none border-none font-black text-[9px] h-5 px-2 rounded-md ${variants[priority] || "bg-slate-50"}`}>
          {priority}
        </Badge>
      );
    },
  },
  {
    accessorKey: "transferDate",
    header: "Transfer Date",
    cell: ({ row }) => (
      <span className="text-slate-400 font-bold">
        {row.getValue("transferDate")}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Action",
    cell: () => (
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-7 h-7 border border-slate-200/50 rounded-lg text-slate-400 hover:text-blue-950 hover:bg-slate-50 shadow-none"
      >
        <Eye className="w-3.5 h-3.5" />
      </Button>
    ),
  },
];