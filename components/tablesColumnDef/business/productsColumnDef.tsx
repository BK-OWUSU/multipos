"use client"
import { useRouter } from "next/navigation"; 
import { ColumnDef, Table } from "@tanstack/react-table"
import { Product } from "@/types/schema/inventory";
import { Badge } from "@/components/ui/badge"
import {
  Package, Hash, Archive,
  Tag, Building,MoreHorizontal, Eye, Trash2,
  AlertTriangle, Image as ImageIcon,
  Edit,
} from "lucide-react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useProductStore } from "@/store/productsStore"
import { toast } from "sonner"
import AlertWithDialogue from "@/components/reusables/AlertWithDialogue"
// import AddProductForm from "@/app/(protected)/[slug]/product_list/components/AddProductForm"
import { TablePinActions } from "@/components/reusables/table/TablePinActions"
import { toggleSingleProductsStatusAction } from "@/lib/actions/business/productsActions";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { useAuthStore } from "@/store/useAuthStore";
import { Can } from "@/components/reusables/security/Can";
import { PERMISSIONS } from "@/lib/accessAndPermissionsDef";


export interface ProductTableMeta {
  onViewVariants: (product: Product) => void;
}

// --- Sub-component for Actions ---
const ActionCell = ({ product, table }: { product: Product, table: Table<Product>}) => {
  const {deleteProduct, toggleProductStatusLocal  } = useProductStore();
  const user = useAuthStore((state)=> state.user);
  const editProductPath = `/${user?.business.slug}/products/`
  const router = useRouter();
  const variants = product.variants || [];
  const hasVariants = variants.length > 1;

  const handleToggleStatus = async () => {
    try {
      // 2. Await the Server Action execution
      const res = await toggleSingleProductsStatusAction(product.id);
      
      if (res && res.success) {
        // 3. Update the local store so TanStack Table re-renders instantly
        toggleProductStatusLocal(product.id);
        
        // 4. Force layout components to pick up server-side changes
        router.refresh(); 
        toast.success(res.message || "Product status updated successfully!");
      } else {
        toast.error(res?.error || "Failed to update product status.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      console.error("Toggle Product Error: ",error)
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <Can permission={PERMISSIONS.product.VIEW}>
         <DropdownMenuItem 
            onClick={() =>{
              if (hasVariants) {
                  const meta = table.options.meta as ProductTableMeta | undefined;
                  if (meta?.onViewVariants) {
                    meta.onViewVariants(product);
                  }
              }
            }}>
          <Eye className="mr-2 h-4 w-4" /> View Details
         </DropdownMenuItem>
        <DropdownMenuSeparator /> 
        </Can>
        
        {/* OTHER PRODUCT FUNCTIONS CAN BE ADDED LATTER */}

        <Can permission={PERMISSIONS.product.UPDATE} requireAll={true}>
          <DropdownMenuItem onClick={handleToggleStatus}>
            {product.isActive ? (
              <span className="flex items-center text-yellow-600"><Archive className="mr-2 h-4 w-4" /> Deactivate</span>
            ) : (
              <span className="flex items-center text-green-600"><Package className="mr-2 h-4 w-4" /> Activate</span>
            )}
        </DropdownMenuItem>
        </Can>
        <Can
          permission = {PERMISSIONS.product.UPDATE}
        >
          <DropdownMenuItem onClick={() => router.push(`${editProductPath}${product.id}/edit`)}>
           <span className="flex items-center text-indigo-600 font-medium">
             <Edit className="mr-2 h-4 w-4" /> Edit Product
          </span>
        </DropdownMenuItem>
        </Can>
        <Can
          permission = {PERMISSIONS.product.DELETE}
        >
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
            btnClassName="p-4"
            confirmText="Yes"
            cancelText="Cancel"
            title="Delete Product"
            message={`Are you sure you want to delete ${product.name}?`}
            confirmFunction={() => deleteProduct(product.id)}
          />
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


export const productsColumnDef: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: () => (<span className='flex items-center'><Package className="mr-2" size={16} />Product Name</span>),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>
  },
  {
    accessorKey: "imageUrl",
    header: () => (<span className='flex items-center'><ImageIcon className="mr-2" size={16} />Image</span>),
    cell: ({ row }) => {
      // Find the primary variant image or fall back to the first available variant's image
      const firstVariant = row.original.variants?.[0];
      const imageUrl = firstVariant?.imageUrl;

      return imageUrl ? (
        <div className="relative w-10 h-10">
          <Image
            src={imageUrl}
            alt={row.original.name}
            fill
            sizes="40px"
            className="object-cover rounded"
          />
        </div>
      ) : (
        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-gray-400" />
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false
  },
 {
  accessorKey: "sku",
  header: () => (<span className='flex items-center'><Hash className="mr-2" size={16} />SKU / Base SKU</span>),
  cell: ({ row }) => {
    const variants = row.original.variants || [];
    const hasVariants = variants.length > 1;

    if (hasVariants) {
      return (
        <span className="text-xs text-muted-foreground">
          {row.original.baseSku || "N/A"} ({variants.length} Variants)
          </span>
      );
    }
    return variants[0]?.sku || row.original.baseSku || "N/A";
    }
  },
  {
    accessorKey: "price",
    header: () => <CurrencyFormatter.Header title="Price" />,
    cell: ({ row }) => {
      const prices = (row.original.variants || []).map(v => Number(v.price || 0));
      if (prices.length === 0) return <CurrencyFormatter amount={0} />;
      
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Display a beautiful range layout if options vary in value configurations
      if (minPrice !== maxPrice) {
        return (
          <span className="text-xs font-medium">
            <CurrencyFormatter amount={minPrice} /> - <CurrencyFormatter amount={maxPrice} />
          </span>
        );
      }
      return <CurrencyFormatter amount={minPrice} />;
    }
  },
  {
    accessorKey: "costPrice",
    header: () => <CurrencyFormatter.Header title="Cost" />,
    cell: ({ row }) => {
      const costs = (row.original.variants || []).map(v => Number(v.costPrice || 0));
      if (costs.length === 0) return <CurrencyFormatter amount={0} />;
      
      const minCost = Math.min(...costs);
      const maxCost = Math.max(...costs);

      if (minCost !== maxCost) {
        return (
          <span className="text-xs text-muted-foreground">
            <CurrencyFormatter amount={minCost} /> - <CurrencyFormatter amount={maxCost} />
          </span>
        );
      }
      return <CurrencyFormatter amount={minCost} />;
    }
  },
  { 
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const variants = row.original.variants || [];
      
      // Compute global aggregates across the nested rows
      const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const isAnyLow = variants.some(v => (v.stock || 0) <= (v.lowStockAlert || 0));

      return (
        <div className="flex items-center gap-2">
          <span className={isAnyLow ? "text-red-600 font-semibold" : ""}>{totalStock}</span>
          {isAnyLow && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
      );
    }
  },
  {
    accessorKey: "category",
    header: () => (<span className='flex items-center'><Tag className="mr-2" size={16} />Category</span>),
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.category?.name || "No Category"}
      </Badge>
    )
  },
  {
    accessorKey: "brand",
    header: () => (<span className='flex items-center'><Building className="mr-2" size={16} />Brand</span>),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.brand?.name || "No Brand"}
      </span>
    )
  },
  {
    accessorKey: "isActive",
    header: "Status",
    filterFn: "equals",
    meta: {
      filterVariant: "select",
      trueLabel: "Active",
      falseLabel: "Inactive"
    },
    cell: ({ row }) => {
      const active = row.original.isActive;
      return (
        <Badge className={active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    }
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
    cell: ({ row, table }) => <ActionCell table={table} product={row.original}/>,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  }
];