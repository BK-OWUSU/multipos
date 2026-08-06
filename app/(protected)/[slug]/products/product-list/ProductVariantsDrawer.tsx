"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/schema/inventory";
import { AlertTriangle, Hash, Layers } from "lucide-react";
import Image from "next/image";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";

interface ProductVariantsDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductVariantsDrawer({
  product,
  isOpen,
  onClose,
}: ProductVariantsDrawerProps) {
  if (!product) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto bg-white p-6">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Layers className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Variation Matrix</span>
          </div>
          <SheetTitle className="text-xl font-bold text-gray-900">
            {product.name}
          </SheetTitle>
          <SheetDescription>
            Manage individual stock balances, SKUs, and pricing matrices for this item line.
          </SheetDescription>
        </SheetHeader>

        {/* Variants List mapping */}
        <div className="mt-6 space-y-4">
          {product.variants?.map((variant) => {
            const isLowStock = (variant.stock || 0) <= (variant.lowStockAlert || 0);

            return (
              <div
                key={variant.id}
                className={`p-4 border rounded-xl flex items-start gap-2 transition-all bg-white shadow-sm ${
                  !variant.isActive ? "opacity-60 bg-gray-50/50" : ""
                }`}
              >
                {/* Variant Image */}
                <div className="relative w-13 h-13 bg-gray-50 rounded-lg border overflow-hidden shrink-0">
                  {variant.imageUrl ? (
                    <Image
                      src={variant.imageUrl || "./img/"}
                      alt={variant.sku}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Hash className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Variant Metadata Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-gray-700 block truncate">
                      {variant.sku}
                    </span>
                    <Badge 
                      variant={variant.isActive ? "secondary" : "destructive"}
                      className="text-[10px] px-2 py-0"
                    >
                      {variant.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Attributes Badges (e.g., Color: Red, Size: 8KG) */}
                  <div className="flex flex-wrap gap-1.5">
                    {variant.variantOptions?.map((option) => (
                      <span
                        key={option.valueId}
                        className="inline-flex items-center text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium border border-slate-200/60"
                      >
                        <span className="text-slate-400 mr-1">{option.attributeName}:</span>
                        {option.value}
                      </span>
                    ))}
                  </div>

                  {/* Pricing Matrix & Stock Ledger Metrics */}
                  <div className="flex items-center justify-between pt-1 text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-medium">Price</span>
                        <span className="font-semibold text-gray-900">
                           {<CurrencyFormatter amount={Number(variant.price)} />}
                        </span>
                      </div>
                      <div className="border-l pl-3">
                        <span className="text-[10px] text-gray-400 block uppercase font-medium">Cost</span>
                        <span className="text-gray-500">
                           {<CurrencyFormatter amount={Number(variant.costPrice)} />}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-medium">Available Stock</span>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`font-bold ${isLowStock ? "text-red-600" : "text-gray-900"}`}>
                          {variant.stock}
                        </span>
                        {isLowStock && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}