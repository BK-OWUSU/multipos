"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormattedInventoryRow } from "@/types/types/shopInventory.type";
import { Package, Store, Tag, DollarSign, Layers, Calendar, AlertTriangle } from "lucide-react";

interface InventoryDetailViewProps {
  inventoryItem: FormattedInventoryRow;
  shopId?: string; // Optional: if provided, scopes the view to this single specific shop
  onClose?: () => void;
  onEdit?: () => void;
}

export function InventoryDetailView({
  inventoryItem,
  shopId,
  onClose,
  onEdit,
}: InventoryDetailViewProps) {
  // If a shopId is passed, isolate that specific shop breakdown and metrics
  const targetShop = shopId
    ? inventoryItem.shopBreakdown.find((b) => b.shopId === shopId)
    : null;

  // Determine stock values based on context (single shop vs multi-shop total)
  const displayStock = targetShop ? targetShop.stock : inventoryItem.totalStock;
  const displayStockValue = targetShop 
    ? targetShop.stock * inventoryItem.unitPrice 
    : inventoryItem.stockValue;

  // Helper to determine status badge styling
  const getStatusBadge = (status: FormattedInventoryRow["status"], currentStock: number, alertThreshold: number) => {
    // If scoped to a single shop, re-evaluate status based on that shop's stock vs threshold
    if (targetShop) {
      if (currentStock <= 0) {
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 shadow-none">Out Of Stock</Badge>;
      }
      if (currentStock <= alertThreshold) {
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-none">Low Stock</Badge>;
      }
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none">In Stock</Badge>;
    }

    // Default multi-shop status handling
    switch (status) {
      case "In Stock":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none">In Stock</Badge>;
      case "Low Stock":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-none">Low Stock</Badge>;
      case "Out Of Stock":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 shadow-none">Out Of Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const currentLowStockAlert = targetShop ? targetShop.lowStockAlert : 5;

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
      {/* Header Profile Section */}
      <div className="flex items-start gap-4 p-4 bg-gray-50/70 border border-gray-100 rounded-2xl">
        <div className="relative w-16 h-16 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
          {inventoryItem.imageUrl ? (
            <Image
              src={inventoryItem.imageUrl}
              alt={inventoryItem.productName}
              fill
              className="object-cover"
            />
          ) : (
            <Package className="w-7 h-7 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {inventoryItem.categoryName}
            </span>
            {getStatusBadge(inventoryItem.status, displayStock, currentLowStockAlert)}
          </div>
          <h3 className="text-base font-bold text-gray-900 truncate mt-0.5">
            {inventoryItem.productName}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-mono">
            <span className="bg-white px-2 py-0.5 rounded border border-gray-200/60">
              SKU: {inventoryItem.variantSku}
            </span>
            {targetShop && (
              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-sans font-medium">
                {targetShop.shopName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-white border border-gray-200/80 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            {targetShop ? "Shop Stock" : "Total Stock"}
          </div>
          <p className="text-lg font-bold text-gray-900">
            {displayStock.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-white border border-gray-200/80 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            Unit Price
          </div>
          <p className="text-lg font-bold text-gray-900">
            ${inventoryItem.unitPrice.toFixed(2)}
          </p>
        </div>

        <div className="p-3 bg-white border border-gray-200/80 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Tag className="w-3.5 h-3.5 text-purple-500" />
            {targetShop ? "Shop Value" : "Stock Value"}
          </div>
          <p className="text-lg font-bold text-gray-900">
            ${displayStockValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Branch Breakdown Section (Hidden if scoped to a single shop) */}
      {!shopId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4 text-gray-500" />
              Branch Breakdown ({inventoryItem.shopBreakdown.length})
            </h4>
          </div>

          <div className="space-y-2">
            {inventoryItem.shopBreakdown.map((shop) => {
              const isLowStock = shop.stock <= shop.lowStockAlert;
              return (
                <div
                  key={shop.shopId}
                  className="flex items-center justify-between p-3.5 bg-white border border-gray-200/80 rounded-xl shadow-2xs transition-all hover:border-gray-300"
                >
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-gray-900 block">
                      {shop.shopName}
                    </span>
                    <span className="text-xs text-gray-400 block">
                      Alert Threshold: {shop.lowStockAlert} units
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isLowStock && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/60">
                        <AlertTriangle className="w-3 h-3" />
                        Low
                      </span>
                    )}
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900 block">
                        {shop.stock} <span className="text-xs font-normal text-gray-500">units</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single Shop Specific Alert Meta Card */}
      {targetShop && (
        <div className="p-3.5 bg-gray-50/50 border border-gray-200/80 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
              Alert Configuration
            </span>
            <span className="text-sm font-medium text-gray-700">
              Low Stock Warning Threshold
            </span>
          </div>
          <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200">
            {targetShop.lowStockAlert} units
          </span>
        </div>
      )}

      {/* Metadata & Footer Actions */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Last updated: {new Date(inventoryItem.lastUpdated).toLocaleDateString()} at {new Date(inventoryItem.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
          {onEdit && (
            <Button size="sm" onClick={onEdit}>
              Edit Inventory
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}