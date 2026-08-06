"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import React from "react";
import { restockInventoryAction } from "@/lib/actions/business/shop-inventory-action";
import { FormattedInventoryRow } from "@/types/types/shopInventory.type";

interface UpdateStockFormProps {
  inventoryItem: FormattedInventoryRow;
  shopId: string; // The single specific shop ID context
  onSuccess?: () => void;
  onClose?: () => void;
}

interface FormValues {
  stock: number;
  lowStockAlert: number;
}

export function UpdateShopStockForm({
  inventoryItem,
  shopId,
  onSuccess,
  onClose,
}: UpdateStockFormProps) {
  const [isPending, startTransition] = React.useTransition();

  // Find existing breakdown specifically for this shop context
  const existingBreakdown = inventoryItem.shopBreakdown.find(
    (b) => b.shopId === shopId
  );

  const form = useForm<FormValues>({
    defaultValues: {
      stock: existingBreakdown ? existingBreakdown.stock : 0,
      lowStockAlert: existingBreakdown ? existingBreakdown.lowStockAlert : 5,
    },
  });

  const { register, handleSubmit } = form;

  const onSubmit = async (data: FormValues) => {
    startTransition(() => {
      toast.promise(
        async () => {
          const payload = {
            items: [
              {
                shopId: shopId,
                stock: data.stock,
                lowStockAlert: data.lowStockAlert,
                productVariantId: inventoryItem.id,
                reason: "Stock level and threshold update",
              },
            ],
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

      <div className="space-y-4">
        {/* Available Stock Input */}
        <div>
          <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-2">
            Available Stock Quantity
          </label>
          <Input
            type="number"
            min="0"
            {...register("stock", {
              setValueAs: (v) => (v === "" ? 0 : Math.max(0, parseInt(v, 10))),
            })}
            className="w-full h-10 text-sm font-semibold"
          />
        </div>

        {/* Low Stock Alert Threshold Input */}
        <div>
          <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-2">
            Low Stock Alert Threshold
          </label>
          <Input
            type="number"
            min="0"
            {...register("lowStockAlert", {
              setValueAs: (v) => (v === "" ? 0 : Math.max(0, parseInt(v, 10))),
            })}
            className="w-full h-10 text-sm font-semibold text-amber-600 focus-visible:ring-amber-500"
          />
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