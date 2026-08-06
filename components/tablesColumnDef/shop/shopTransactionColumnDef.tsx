import { ColumnDef, Row, Table } from "@tanstack/react-table";
// Adjust path to your sale types definition
import { MoreHorizontal,  Calendar, Hash, ShieldAlert, User,
    Coins, Smartphone, GitFork, 
    UserCheck, CreditCard, CircleDollarSign, Activity 
} from "lucide-react"; 
import { Button } from "@/components/ui/button"; // Adjust according to your UI kit components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sale } from "@/types/sale.type";
import { TablePinActions } from "@/components/reusables/table/TablePinActions";
import { Badge } from "@/components/ui/badge";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import {formatStandardDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { verifyOnlinePayment } from "@/lib/actions/business/sale-actions";
import { useSaleStore } from "@/store/saleStore";

export const shopTransactionColumnDef: ColumnDef<Sale>[] = [
    
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
      return new Date(dateStr).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    },
      meta: {
      exportValue: (sale) => formatStandardDateTime(sale.createdAt) 
    }
  },

  // 2. TRANSACTION ID (Supports nested structural searching)
  {
    accessorKey: "customId",
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Hash size={16} /> Transaction ID
      </span>
    ),
    // Allows filter search inputs to match against invoice codes OR fallback customIds
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
          <span className="font-semibold text-gray-900">{transactionId}</span>
        </div>
      );
    },
  },
  
  // 3. TRANSACTION TYPE (Calculated conditionally via row records)
  {
    accessorKey: "status",
    id: "transactionType", // Explicit custom ID since we're using status conditionally
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
      ]
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
 // 4. CUSTOMER SEARCH (Faceted search matching sub-properties)
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
      if (!customer) return <span className="text-muted-foreground font-medium">Walk-in Customer</span>;
      
      return (
        <div className="flex flex-col">
          <span className="text-gray-900 font-medium">
            {`${customer.firstName} ${customer.lastName}`}
          </span>
          {customer.phone && <span className="text-xs text-gray-400">{customer.phone}</span>}
        </div>
      );
    },
    meta: {
      exportValue: (sale) => sale.customer 
        ? `${sale.customer.firstName} ${sale.customer.lastName}` 
        : "Walk-in Customer"
    }
  },
  // 2. DEDICATED CUSTOMER PHONE COLUMN
  {
    id: "customerPhone",
    header: "Customer Phone",
    accessorFn: (row) => row.customer?.phone || "—",
    cell: ({ getValue }) => <span className="text-xs text-slate-500">{getValue() as string}</span>,
    meta: {
      // Formats the export cleanly for Excel sheets
      exportValue: (sale) => sale.customer?.phone || "—"
    }
  },
  // 5. CASHIER / STAFF (Faceted search matching names)
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
      if (!employee) return <span className="text-gray-400">-</span>;
      return <span className="text-gray-900 font-medium">{`${employee.firstName} ${employee.lastName}`}</span>;
    },
     meta: {
      exportValue: (sale) => `${sale.employee?.firstName} ${sale.employee?.lastName}` 
    }
  },
// ─── 6. PAYMENT CHANNEL (With Visual Badge & Icon Mapping) ───────
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
        // Clean string export for your Excel spreadsheet builder
        exportValue: (sale) => sale.paymentType
    },
    cell: ({ row }) => {
        const type = row.original.paymentType;

        // Map each channel configuration to a specific icon, text, and design styling
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
  // 7. TOTAL AMOUNT (Numeric rendering)
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
        <span className={`font-bold ${isNegative ? "text-red-600" : "text-emerald-600"}`}>
          {isNegative ? `-${<CurrencyFormatter amount={amount}/>}` : <CurrencyFormatter amount={amount}/> }
        </span>
      );
    },
   meta: {
      exportValue: (sale) => sale.totalAmount
    } 
  },
  // 8. LIFECYCLE STATUS (Select Badge matching)
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
      ]
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
        <Badge variant="outline" className={`font-semibold border ${styles[status] || ""}`}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "Actions",
    id: "actions",
    header: () => (
      <div className="flex items-center justify-end w-full gap-2 px-1">
        <TablePinActions.HeaderIcon />
        <span className="font-semibold text-white">Actions</span>
      </div>
    ),
   cell: ({ row, table }) => <ActionCell row={row} table={table} />,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  },
];


interface ActionCellProps {
  row: Row<Sale>;
  table: Table<Sale>;
}

const ActionCell = ({ row, table }: ActionCellProps) => {
  const sale = row.original;
  const statusIsPending = sale.status === "PENDING";
  
  // 🟢 Extract the verification action directly from your store
  const { verifyOnlinePayment } = useSaleStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open Menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => {
          navigator.clipboard.writeText(sale.customId);
          toast.success("Sale ID copied to clipboard");
        }}>
          Copy Receipt ID
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => {
            const meta = table.options.meta as { onViewSaleDetails?: (sale: Sale) => void } | undefined;
            if (meta?.onViewSaleDetails) {
              meta.onViewSaleDetails(sale);
            }
          }}
        >
          View Details
        </DropdownMenuItem>
        
        <DropdownMenuItem>Print Receipt</DropdownMenuItem>
        
        {statusIsPending && (
          <DropdownMenuItem
            onClick={async () => {
              const momoReference = sale.payments?.find(
                (payment) => payment.method === "MOMO"
              )?.reference;

              if (!momoReference) {
                toast.error("No mobile money tracking reference found on this transaction record.");
                return;
              }

              // 🟢 The promise now cleanly depends entirely on the store execution block
              toast.promise(verifyOnlinePayment(momoReference), {
                loading: "Verifying Payment...",
                success: (res) => {
                  if (res.success) {
                    // Removed updateSaleStatusLocal because store.fetchSales() handles synchronization
                    return res.message || "Verification successful";
                  } else {
                    throw new Error(res.error || "Verification failed");
                  }
                },
                error: (err) => err.message
              });
            }}
          >
            Verify Payment
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};