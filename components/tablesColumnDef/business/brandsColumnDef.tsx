"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { 
  Award, FileText, Calendar, Image as ImageIcon, 
  MoreHorizontal, Eye, Edit, Trash2, Archive 
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import Image from "next/image"
import { Brand } from "@/types/schema/inventory" // Ensure this type matches your Brand schema
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useBrandStore } from "@/store/brandStore" // Pointing to your brand store
import { toast } from "sonner"
import AlertWithDialogue from "@/components/reusables/AlertWithDialogue"
import { TablePinActions } from "../../reusables/table/TablePinActions"

// Brand Action Cell
const BrandActionCell = ({ brand }: { brand: Brand }) => {
//   const { toggleBrandStatus, deleteBrand } = useBrandStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => toast.info(`Viewing products for ${brand.name}`)}>
          <Eye className="mr-2 h-4 w-4" /> View Products
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => toast.info("Edit feature coming soon")}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => {
            // toggleBrandStatus(brand.id, brand.isActive)
            }}>
          {brand.isActive ? (
            <span className="flex items-center text-yellow-600">
              <Archive className="mr-2 h-4 w-4" /> Deactivate
            </span>
          ) : (
            <span className="flex items-center text-green-600">
              <Award className="mr-2 h-4 w-4" /> Activate
            </span>
          )}
        </DropdownMenuItem>

        <AlertWithDialogue
          button={
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          }
          buttonText="Delete"
          customVariant="primary"
          confirmText="Yes, Delete"
          title="Delete Brand"
          message={`Are you sure? This will remove ${brand.name} from your inventory labels.`}
          confirmFunction={() => {
            // deleteBrand(brand.id)
        }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const brandsColumnDef: ColumnDef<Brand>[] = [
  {
    accessorKey: "imageUrl",
    header: () => (<span className='flex items-center'><ImageIcon className="mr-2" size={16} />Logo</span>),
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl;
      return imageUrl ? (
        <Image
          src={imageUrl}
          alt={row.original.name}
          width={40}
          height={40}
          className="w-10 h-10 object-cover rounded-lg border shadow-sm"
        />
      ) : (
        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
          <Award className="w-5 h-5 text-purple-400" />
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: () => (<span className='flex items-center'><Award className="mr-2" size={16} />Brand Name</span>),
    cell: ({ row }) => <span className="font-semibold text-gray-900">{row.original.name}</span>
  },
  {
    accessorKey: "description",
    header: () => (<span className='flex items-center'><FileText className="mr-2" size={16} />Description</span>),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1 max-w-50">
        {row.original.description || "No description provided"}
      </span>
    )
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const active = row.original.isActive;
      return (
        <Badge 
          variant={active ? "default" : "secondary"}
          className={active 
            ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" 
            : "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200"
          }
        >
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    }
  },
  {
    accessorKey: "createdAt",
    header: () => (<span className='flex items-center'><Calendar className="mr-2" size={16} />Created</span>),
    cell: ({ row }) => <span className="text-sm">{formatDate(new Date(row.original.createdAt))}</span>
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

    cell: ({ row }) => <BrandActionCell brand={row.original} />,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  }
]