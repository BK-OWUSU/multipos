"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import React from "react";
import { restockInventoryAction } from "@/lib/actions/business/shop-inventory-action";
import { FormattedInventoryRow } from "@/types/types/shopInventory.type";

interface ShopItem {
  id: string;
  name: string;
}

interface BranchFormInput {
  shopId: string;
  shopName: string;
  stock: number;
  lowStockAlert: number;
}

interface UpdateStockFormProps {
  inventoryItem: FormattedInventoryRow;
  shops: ShopItem[]; // All available shops fetched from your store/branch manager
  onSuccess?: () => void;
  onClose?: () => void;
}

interface FormValues {
  branches: BranchFormInput[];
}

export function UpdateStockForm({
  inventoryItem,
  shops,
  onSuccess,
  onClose,
}: UpdateStockFormProps) {
  const [isPending, startTransition] = React.useTransition();

  // Map over all available shops, checking if the item already has an existing breakdown value.
  // If a store is new or doesn't have an entry yet, default stock and lowStockAlert to 0.
  const form = useForm<FormValues>({
    defaultValues: {
      branches: shops.map((shop) => {
        const existingShop = inventoryItem.shopBreakdown.find(
          (b) => b.shopId === shop.id
        );
        return {
          shopId: shop.id,
          shopName: shop.name,
          stock: existingShop ? existingShop.stock : 0,
          lowStockAlert: existingShop ? existingShop.lowStockAlert : 5, // Default fallback threshold if needed
        };
      }),
    },
  });

  const { register, handleSubmit } = form;

  const onSubmit = async (data: FormValues) => {
    startTransition(() => {
      toast.promise(
        async () => {
          const payload = {
            items: data.branches.map((branch) => ({
              shopId: branch.shopId,
              stock: branch.stock,
              lowStockAlert: branch.lowStockAlert,
              productVariantId: inventoryItem.id,
              reason: "Stock level and threshold update",
            })),
          };

          const res = await restockInventoryAction(payload);
          if (!res.success) {
            throw new Error(res.error || "Failed to update stock");
          }
          return res;
        },
        {
          loading: "Updating stock...",
          success: (res) => {
            onSuccess?.();
            return res.message || "Stock updated successfully";
          },
          error: (err) => err.message || "Error updating stock",
        }
      );
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
          Target SKU Matrix Variant
        </span>
        <p className="text-sm font-bold text-gray-900 mt-0.5">
          {inventoryItem.variantSku} - {inventoryItem.productName}
        </p>
      </div>

      {/* Grid Allocation Layout Sections matching design standards */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
            BRANCH STOCK ALLOCATIONS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shops.map((shop, index) => (
              <div
                key={`stock-${shop.id}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200/80 rounded-xl"
              >
                <span className="text-xs font-medium text-gray-600 truncate max-w-35">
                  {shop.name}
                </span>
                <Input
                  type="number"
                  min="0"
                  {...register(`branches.${index}.stock`, {
                    setValueAs: (v) => (v === "" ? 0 : Math.max(0, parseInt(v, 10))),
                  })}
                  className="w-24 text-right h-9"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
            LOW STOCK THRESHOLDS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shops.map((shop, index) => (
              <div
                key={`alert-${shop.id}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200/80 rounded-xl"
              >
                <span className="text-xs font-medium text-gray-600 truncate max-w-35">
                  {shop.name}
                </span>
                <Input
                  type="number"
                  min="0"
                  {...register(`branches.${index}.lowStockAlert`, {
                    setValueAs: (v) => (v === "" ? 0 : Math.max(0, parseInt(v, 10))),
                  })}
                  className="w-24 text-right h-9 text-amber-600 focus-visible:ring-amber-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="min-w-27.5">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}