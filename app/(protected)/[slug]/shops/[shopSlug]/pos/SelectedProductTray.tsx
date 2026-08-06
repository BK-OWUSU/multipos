"use client";

import { AlertTriangle, Layers, Plus } from "lucide-react";
import { ProductsVariants } from "@/types/schema/inventory";
import Image from "next/image";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";

interface SelectedProductTrayProps {
  selectedVariant: ProductsVariants | null;
  quantityInCart: number;
  onAddToCart: (product: ProductsVariants) => void;
}

export default function SelectedProductTray({
  selectedVariant,
  quantityInCart,
  onAddToCart,
}: SelectedProductTrayProps) {
  if (!selectedVariant) return null;

  // Calculate dynamic live inventory tracking
  const baseStock = selectedVariant.stock ?? 0;
  const currentAvailableStock = baseStock - quantityInCart;
  const isLowStock = currentAvailableStock <= (selectedVariant.lowStockAlert || 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full mt-auto">
      <div className="grid  min-h-30 grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* SECTION 1: MAIN INFO (4 Columns) */}
        <div className="md:col-span-4 flex items-center gap-3">
          <div className="h-18 w-18 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden relative">
            {/* <Package className="h-5 w-5 text-slate-400" /> */}
             <Image src={selectedVariant.imageUrl || "/imgs/no-product-image.png"} alt={selectedVariant.imageUrl || ""} fill className="object-contain p-1" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-800 text-sm truncate">
              {selectedVariant.displayName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                {selectedVariant.sku}
              </span>
              {selectedVariant.barcode && (
                <span className="text-[11px] text-slate-400 font-mono truncate">
                  || {selectedVariant.barcode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: DYNAMIC ATTRIBUTES (3 Columns) */}
        <div className="md:col-span-3 flex flex-wrap gap-1.5 content-center border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4 h-full">
          {selectedVariant.options && selectedVariant.options.length > 0 ? (
            selectedVariant.options.map((opt, idx) => (
              // Fallback to index if valueId isn't found to prevent runtime crashes
              <div 
                key={opt.valueId || `opt-${idx}`} 
                className="flex items-center text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md"
              >
                <span className="font-medium text-blue-500 mr-1">{opt.attributeName}:</span>
                <span className="font-bold">{opt.value}</span>
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Core Product
            </span>
          )}
        </div>

        {/* SECTION 3: LIVE INVENTORY TRACKER (2 Columns) */}
        <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4 flex flex-col justify-center">
          <div className="text-[11px] font-medium text-slate-500">Live Availability</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-sm font-bold ${
              currentAvailableStock <= 0 
                ? "text-rose-600" 
                : isLowStock 
                ? "text-amber-600" 
                : "text-emerald-600"
            }`}>
              {currentAvailableStock} left
            </span>
            <span className="text-xs text-slate-400">
              ({baseStock} total)
            </span>
          </div>
          
          {currentAvailableStock <= 0 ? (
            <span className="text-[10px] font-medium text-rose-500 flex items-center gap-0.5 mt-0.5">
              <AlertTriangle className="h-3 w-3" /> Out of stock
            </span>
          ) : isLowStock ? (
            <span className="text-[10px] font-medium text-amber-500 flex items-center gap-0.5 mt-0.5">
              <AlertTriangle className="h-3 w-3" /> Near limit alert
            </span>
          ) : null}
        </div>

        {/* SECTION 4: ACTIONS & PRICE (3 Columns) */}
        <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
          <div className="text-left md:text-right">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Unit Price</div>
            <div className="text-base font-black text-slate-900">
              {<CurrencyFormatter amount={selectedVariant.price || 0} />}
            </div>
          </div>

          <button
            onClick={() => onAddToCart(selectedVariant)}
            disabled={currentAvailableStock <= 0}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs shadow-sm transition-all active:scale-[0.98] ${
              currentAvailableStock <= 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-blue-900 hover:bg-blue-800 text-white"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add to Cart
          </button>
        </div>

      </div>
    </div>
  );
}