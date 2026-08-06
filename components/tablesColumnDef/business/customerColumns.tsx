"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Customer } from "@/types/auth/auth" 
import { formatBusinessCurrency, formatDate } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"
import { 
  MoreHorizontal, 
  Phone, 
  Trash2, 
  Edit,
  UserCircle,
  Eye,
  MapPin,
  IdCard,
  MailIcon,
  Trophy,
  ShoppingBag
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Reusables
import AlertWithDialogue from "@/components/reusables/AlertWithDialogue"
import { GenericModal } from "@/components/reusables/GenericModal"
import { useCustomerStore } from "@/store/customerStore" 
import { TablePinActions } from "../../reusables/table/TablePinActions"

// --- Sub-component for Actions ---
const ActionCell = ({ customer }: { customer: Customer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fetchCustomers } = useCustomerStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => toast.info("Profile view coming soon")}>
          <Eye className="mr-2 h-4 w-4" /> View Profile
        </DropdownMenuItem>

        <GenericModal
          header="Edit Customer"
          description={`Update details for ${customer.firstName}`}
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          triggerBtn={
            <DropdownMenuItem onSelect={(e) => {
              e.preventDefault();
              setIsModalOpen(true);
            }}>
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
          }
        >
           {/* Add your Customer Form here - passing customer as initialData */}
           <div className="p-8 text-center text-muted-foreground">
              Customer Form Integration Pending
           </div>
        </GenericModal>

        <DropdownMenuSeparator />

        <AlertWithDialogue
          button={
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Archive Customer
            </DropdownMenuItem>
          }
          buttonText="Archive"
          buttonVariant="destructive"
          title="Are you sure?"
          confirmText={`This will move ${customer.firstName} ${customer.lastName} to the archives.`}
          confirmFunction={async () => {
            // await softDeleteCustomer(customer.id);
            fetchCustomers(); // Refresh list after delete
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const customerColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "customId",
    header: () => (<span className='flex items-center'><IdCard className="mr-2" size={16}/>ID</span>),
    cell: ({row}) => <span className="text-sm">{row.original.customId}</span>,
    enableGlobalFilter: true,
  },
  {
    accessorKey: "fullName",
    header: () => <span className="flex items-center"><UserCircle className="mr-2" size={16} /> Customer</span>,
    cell: ({ row }) => {
      const { firstName, lastName, email } = row.original
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-sm capitalize">{`${firstName} ${lastName}`}</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MailIcon size={12} className="shrink-0" />
            <span className="truncate">{email || "---"}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Contact",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm">
        <Phone size={14} className="text-muted-foreground" />
        {row.original.phone || "---"}
      </div>
    ),
  },
  {
    accessorKey: "isCreditCustomer",
    header: "Financials",
    filterFn: "equals",
    meta: {
      filterVariant: "select",
      trueLabel: "Credit Active",
      falseLabel: "Cash Only"
    },
    cell: ({ row }) => {
      const isCredit = row.original.isCreditCustomer
      const limit = row.original.creditLimit
      const user = useAuthStore.getState().user

      return (
        <div className="flex flex-col gap-1">
          <Badge variant={isCredit ? "default" : "secondary"} className="w-fit py-0">
            {isCredit ? "Credit" : "Cash"}
          </Badge>
          {isCredit && (
            <span className="text-[10px] font-bold text-emerald-600">
              Limit: {formatBusinessCurrency(limit, user?.business?.currencyCode)}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "loyalty.points",
    header: () => <span className="flex items-center"><Trophy className="mr-2" size={16} /> Points</span>,
    cell: ({ row }) => {
      const points = row.original.loyaltyWallet?.availablePoints || 0
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          {points.toLocaleString()} pts
        </Badge>
      )
    }
  },
  {
    accessorKey: "_count.sales",
    header: () => <span className="flex items-center justify-center"><ShoppingBag className="mr-2" size={16} /> Orders</span>,
    cell: ({ row }) => (
      <div className="text-center font-black text-sm">
        {row.original._count?.sales || 0}
      </div>
    ),
  },
  {
    accessorKey: "registeredAtShop.name",
    header: "Branch",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-xs">
        <MapPin size={12} className="text-muted-foreground" />
        {row.original.registeredAtShop?.name || "Global"}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(new Date(row.original.createdAt))}
      </span>
    ),
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
    cell: ({ row }) => <ActionCell customer={row.original} />,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  }
]