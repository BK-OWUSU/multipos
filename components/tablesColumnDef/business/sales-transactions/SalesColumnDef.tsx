"use client";

import { Row, Table, ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Hash, 
  ShieldAlert, 
  User, 
  UserCheck, 
  CreditCard, 
  Coins, 
  Smartphone, 
  GitFork, 
  CircleDollarSign, 
  Activity, 
  Store,
  Eye, 
  Printer
} from "lucide-react";
import { Sale } from "@/types/sale.type";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { formatStandardDateTime } from "@/lib/utils";

// 1. Table Meta interface for Sales Actions
export interface SalesTableMeta {
  onViewSale?: (sale: Sale) => void;
  onPrintReceipt?: (sale: Sale) => void;
}

// 2. Action Cell Component
interface SalesRowActionsProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
}

export function SalesRowActions<TData extends Sale>({ 
  row, 
  table 
}: SalesRowActionsProps<TData>) {
  const sale = row.original;
  const meta = table.options.meta as SalesTableMeta | undefined;

  return (
    <div className="flex items-center justify-end gap-2 pr-2">
      {/* Print Receipt Button */}
        {sale.status === "COMPLETED" && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium"
          onClick={() => meta?.onPrintReceipt?.(sale)}
        >
          <Printer className="h-4 w-4 text-slate-400" />
          Print
        </Button>   
        )}
    
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium"
          onClick={() => meta?.onViewSale?.(sale)}
        >
          <Eye className="h-4 w-4 text-slate-400" />
          View Sale
        </Button>
      </div>
  );
}

// 3. Complete Sales Column Definitions
export const saleTransactionsColumnDef: ColumnDef<Sale>[] = [
  // 1. DATE & TIME
  {
    accessorKey: "createdAt",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Calendar size={16} /> Date & Time
      </span>
    ),
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      if (!dateStr) return "-";
      return formatStandardDateTime(dateStr);
    },
    meta: {
      filterVariant: "date",
      exportValue: (sale) => formatStandardDateTime(sale.createdAt) 
    }
  },

  // 2. TRANSACTION ID
  {
    accessorKey: "customId",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Hash size={16} /> Transaction ID
      </span>
    ),
    filterFn: (row, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const invoiceId = row.original.invoice?.customId?.toLowerCase() || "";
      const fallbackId = row.original.customId.toLowerCase();
      return invoiceId.includes(search) || fallbackId.includes(search);
    },
    cell: ({ row }) => {
      const transactionId = row.original.invoice?.customId || row.original.customId;
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 font-mono text-xs">{transactionId}</span>
        </div>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (sale) => sale.invoice?.customId || sale.customId
    }
  },

  // 3. TRANSACTION TYPE
  {
    accessorKey: "status",
    id: "transactionType",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <ShieldAlert size={16} /> Type
      </span>
    ),
    filterFn: "equals",
    meta: {
      filterVariant: "selectArray",
      options: [
        { value: "SALE", label: "Sale" },
        { value: "RETURN", label: "Return" }
      ],
      exportValue: (sale) => (sale.totalAmount < 0 || sale.status === "REFUNDED" ? "Return" : "Sale")
    },
    cell: ({ row }) => {
      const isReturn = row.original.totalAmount < 0 || row.original.status === "REFUNDED";
      return isReturn ? (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
          Return
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
          Sale
        </Badge>
      );
    }
  },

  // 4. SHOP (Name + Address if available)
  {
    accessorKey: "shop",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Store size={16} /> Shop
      </span>
    ),
    filterFn: (row, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const shop = row.original.shop;
      if (!shop) return "main branch".includes(search);
      const shopInfo = `${shop.name} ${shop.address}`.toLowerCase();
      return shopInfo.includes(search);
    },
    cell: ({ row }) => {
      const shop = row.original.shop;
      if (!shop) return <span className="text-slate-400 font-medium text-xs">Main Branch</span>;

      return (
        <div className="flex flex-col">
          <span className="text-gray-900 font-medium text-xs">{shop.name}</span>
          {shop.address && <span className="text-[10px] text-slate-400 truncate max-w-40">{shop.address}</span>}
        </div>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (sale) => sale.shop ? `${sale.shop.name} - ${sale.shop.address || ""}` : "Main Branch"
    }
  },

  // 5. CUSTOMER & PHONE COMBINED
  {
    accessorKey: "customer",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <User size={16} /> Customer
      </span>
    ),
    filterFn: (row, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const customer = row.original.customer;
      if (!customer) return "walk-in customer".includes(search);
      
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const phone = customer.phone?.toLowerCase() || "";
      return fullName.includes(search) || phone.includes(search);
    },
    cell: ({ row }) => {
      const customer = row.original.customer;
      if (!customer) return <span className="text-muted-foreground font-medium text-xs">Walk-in Customer</span>;
      
      return (
        <div className="flex flex-col">
          <span className="text-gray-900 font-medium text-xs">
            {`${customer.firstName} ${customer.lastName}`}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {customer.phone || "—"}
          </span>
        </div>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (sale) => sale.customer 
        ? `${sale.customer.firstName} ${sale.customer.lastName} (${sale.customer.phone || "No Phone"})` 
        : "Walk-in Customer"
    }
  },

  // 6. CASHIER / STAFF
  {
    accessorKey: "employee",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <UserCheck size={16} /> Cashier / Staff
      </span>
    ),
    filterFn: (row, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const employee = row.original.employee;
      if (!employee) return false;
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return fullName.includes(search);
    },
    cell: ({ row }) => {
      const employee = row.original.employee;
      if (!employee) return <span className="text-gray-400 text-xs">-</span>;
      return <span className="text-gray-900 font-medium text-xs">{`${employee.firstName} ${employee.lastName}`}</span>;
    },
    meta: {
      filterVariant: "text",
      exportValue: (sale) => sale.employee ? `${sale.employee.firstName} ${sale.employee.lastName}` : "System"
    }
  },

  // 7. PAYMENT CHANNEL
  {
    accessorKey: "paymentType",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <CreditCard size={16} /> Channel
      </span>
    ),
    filterFn: "equals",
    meta: {
      filterVariant: "selectArray",
      options: [
        { value: "CASH", label: "Cash" },
        { value: "MOMO", label: "Mobile Money" },
        { value: "CARD", label: "Card" },
        { value: "SPLIT", label: "Split Payment" }
      ],
      exportValue: (sale) => sale.paymentType
    },
    cell: ({ row }) => {
      const type = row.original.paymentType;
      const channelConfig: Record<
        string, 
        { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; styles: string }
      > = {
        CASH: { 
          label: "Cash", 
          icon: Coins, 
          styles: "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
        },
        MOMO: { 
          label: "Mobile Money", 
          icon: Smartphone, 
          styles: "bg-amber-50 text-amber-700 border-amber-200/60" 
        },
        CARD: { 
          label: "Card", 
          icon: CreditCard, 
          styles: "bg-blue-50 text-blue-700 border-blue-200/60" 
        },
        SPLIT: { 
          label: "Split Payment", 
          icon: GitFork, 
          styles: "bg-purple-50 text-purple-700 border-purple-200/60" 
        },
      };

      const config = channelConfig[type] || { label: type, icon: CreditCard, styles: "bg-slate-50 text-slate-700 border-slate-200" };
      const IconComponent = config.icon;

      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold tracking-tight shadow-xs ${config.styles}`}>
          <IconComponent size={13} className="shrink-0" />
          <span>{config.label}</span>
        </div>
      );
    },
  },

  // 8. TOTAL AMOUNT
  {
    accessorKey: "totalAmount",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <CircleDollarSign size={16} /> Total Amount
      </span>
    ),
    cell: ({ row }) => {
      const amount = Number(row.original.totalAmount);
      const isNegative = amount < 0;

      return (
        <span className={`font-bold text-xs ${isNegative ? "text-red-600" : "text-slate-900"}`}>
          {isNegative ? `-${Math.abs(amount)}` : <CurrencyFormatter amount={amount}/>}
        </span>
      );
    },
    meta: {
      filterVariant: "text",
      exportValue: (sale) => sale.totalAmount
    } 
  },
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
        { value: "COMPLETED", label: "Completed" },
        { value: "PENDING", label: "Pending" },
        { value: "CANCELLED", label: "Cancelled" },
        { value: "REFUNDED", label: "Refunded" }
      ],
      exportValue: (sale) => sale.status
    },
    cell: ({ row }) => {
      const status = row.original.status;
      const styles: Record<string, string> = {
        COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        PENDING: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
        CANCELLED: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100",
        REFUNDED: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
      };

      return (
        <Badge variant="outline" className={`font-semibold border text-[10px] ${styles[status] || ""}`}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      );
    },
  },

  {
    accessorKey: "Actions",
    id: "actions",
    header: () => <div className="text-right pr-4 font-semibold">Actions</div>,
    cell: ({ row, table }) => <SalesRowActions row={row} table={table} />,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  },
];