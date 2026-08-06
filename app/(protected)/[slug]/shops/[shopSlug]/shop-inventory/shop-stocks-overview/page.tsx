"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Layers, TrendingUp, AlertTriangle, AlertCircle, RefreshCw, Upload, Download } from "lucide-react";
import { useInventoryStore } from "@/store/shop-inventory.store";
import TableMain from "@/components/reusables/table/TableMain";
import { InventoryTableMeta, shopInventoryColumnDef } from "@/components/tablesColumnDef/business/inventory/shop-InventoryColumnDef";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { FormattedInventoryRow } from "@/types/types/shopInventory.type";
import { AppSheet } from "@/components/reusables/AppSheet";
import { useShopStore } from "@/store/shopStore";
import { InventoryDetailView } from "@/components/detials-components/inventory/InventoryDetailViewer";
import { useAuthStore } from "@/store/useAuthStore";
import { UpdateShopStockForm } from "@/components/forms/inventory/UpdateShopStockForm";
import { GenericModal } from "@/components/reusables/GenericModal";
import CustomButton from "@/components/reusables/CustomButton";
import GenericExcelBulkImport from "@/components/reusables/GenericExcelBulkImport";
import { shopRestockConfig } from "@/lib/configs/shop-restock-config";
import { downloadShopInventoryExcel } from "@/lib/bulk-import/export-shop-inventory";

export default function InventoryRestockView() {
  const { inventoryItems, meta, isLoading, fetchInventory } = useInventoryStore();
  const { fetchShops, shops } = useShopStore();
  const {user} = useAuthStore();
  
  const [pageSize, setPageSize] = useState(100);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<FormattedInventoryRow | null>(null);
  const [isUpdateStockFormOpen, setIsUpdateStockFormOpen] = useState(false);
  const [isViewStockItemOpen, setIsViewStockItemOpen] = useState(false);

  // 2. State for the Bulk Restock Modal and dynamic width sizing
  const [isBulkRestockModalOpen, setIsBulkRestockModalOpen] = useState(false);
  const [modalWidth, setModalWidth] = useState("sm:max-w-137.5");

  const assignedShopId = user?.currentShop?.id || "";
  const currentShopObject = shops.find((s) => s.id === assignedShopId);
  const currentShopName = currentShopObject?.name || user?.currentShop?.name || "Shop";
  


  useEffect(() => {
    fetchInventory({ limit: pageSize, shopId: assignedShopId || "" });
    fetchShops();
  }, [fetchInventory, pageSize, fetchShops, assignedShopId]);

  // Dynamically compute values from real inventory items data
  const items = inventoryItems || [];
  const totalProductsCount = meta?.total || items.length;
  const totalVariantsCount = meta?.total || items.length;
  
  // Calculate total stock value from all items
  const totalStockValueNumber = items.reduce((acc, item) => acc + Number(item.stockValue || 0), 0);
  
  // Count low stock and out of stock dynamically based on item status
  const lowStockCount = items.filter((item) => item.status === "Low Stock").length;
  const outOfStockCount = items.filter((item) => item.status === "Out Of Stock").length;

  return (
    <div className="space-y-6 p-6">
      {/* Top Header & Action Section matching the design layout */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shop Stock Levels</h1>
          <p className="text-sm text-slate-500">
            View and manage stock levels for all products and variants across all shops.
          </p>
        </div>
        <div>
         
        <div className="flex items-center gap-3">
          {/* Bulk Restock Modal with Download Options + Importer */}
          <GenericModal
            width={modalWidth}
            header="Bulk Excel Restock"
            description={`Download stock items for ${currentShopName}, update quantities, and upload back.`}
            isOpen={isBulkRestockModalOpen}
            onOpenChange={() => {
              setIsBulkRestockModalOpen((prev) => !prev);
              setModalWidth("sm:max-w-137.5");
            }}
            triggerBtn={
              <CustomButton
                icon={<Upload className="mr-2 h-4 w-4" />}
                text="Bulk Restock"
                customVariant="primary"
              />
            }
          >
            <div className="space-y-6 py-2">
              {/* Step 1: Download Template Actions */}
              <div className="grid grid-cols-2 gap-3">
                <CustomButton
                  text="Download Low Stock"
                  customVariant="primary"
                  icon={<Download className="mr-2 h-4 w-4" />}
                  onClick={() =>
                    downloadShopInventoryExcel(
                      inventoryItems || [],
                      assignedShopId,
                      currentShopName,
                      true // lowStockOnly = true
                    )
                  }
                />
                <CustomButton
                  text="Download All Stock"
                  customVariant="primary"
                  icon={<Download className="mr-2 h-4 w-4" />}
                  onClick={() =>
                    downloadShopInventoryExcel(
                      inventoryItems || [],
                      assignedShopId,
                      currentShopName,
                      false // lowStockOnly = false
                    )
                  }
                />
              </div>

              {/* Step 2: Excel Importer Component */}
              <div className="border-t pt-4">
                <GenericExcelBulkImport
                  config={shopRestockConfig}
                  additionalPayload={{ shopId: assignedShopId }}
                  onSuccess={() => {
                    setIsBulkRestockModalOpen(false);
                    fetchInventory({ limit: pageSize, shopId: assignedShopId });
                    setModalWidth("sm:max-w-137.5");
                  }}
                  onCancel={() => {
                    setIsBulkRestockModalOpen(false);
                    setModalWidth("sm:max-w-137.5");
                  }}
                  onImportParsedSuccess={() => {
                    setModalWidth("sm:max-w-max");
                  }}
                />
              </div>
            </div>
          </GenericModal>
        </div>

        </div>
      </div>

      {/* Top Metric Summary Cards matching the styling grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Products</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalProductsCount}</h3>
              <p className="text-xs text-slate-400">Across all shops</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Variants</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalVariantsCount}</h3>
              <p className="text-xs text-slate-400">Across all shops</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stock Value</p>
              <h3 className="text-2xl font-bold text-slate-900">
                <CurrencyFormatter amount={totalStockValueNumber} />
              </h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +12.5% vs last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="text-lg font-bold">GH₵</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-slate-900">{lowStockCount}</h3>
              <p className="text-xs text-amber-600 font-medium">Need attention</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Out of Stock Items</p>
              <h3 className="text-2xl font-bold text-slate-900">{outOfStockCount}</h3>
              <p className="text-xs text-slate-400">Across all shops</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Data Table Card preserving all custom metrics, details view, and table configuration */}
      <Card className="border border-slate-200/70 shadow-xs rounded-xl overflow-hidden bg-white w-full">
        <div className="w-full overflow-x-auto">
          <TableMain
            columns={shopInventoryColumnDef}
            data={inventoryItems || []}
            loading={isLoading}
            onPageSizeChange={(size) => setPageSize(size)}
            columnVisibilityFilter={true}
            tableFilterButtonVisible={true}
            tableExportButtonVisible={true}
            searchKey="product name"
            meta={{
              onEditItem(item) {
                setSelectedInventoryItem(item);
                setIsUpdateStockFormOpen(true);
              },
              onViewDetails(item) {
                setSelectedInventoryItem(item);
                setIsViewStockItemOpen(true);
              },
            } as InventoryTableMeta}
          />
        </div>
      </Card>

      <AppSheet
        isOpen={isUpdateStockFormOpen}
        onClose={() => setIsUpdateStockFormOpen(false)}
        title="Update Stock"
        description="Update stock levels and unit costs for existing inventory items."
        maxWidth="lg"
      >
        {selectedInventoryItem && (
          <UpdateShopStockForm
            inventoryItem={selectedInventoryItem} 
            shopId={assignedShopId!}
            onSuccess={() => {
              fetchInventory();
              setIsUpdateStockFormOpen(false);
              setSelectedInventoryItem(null);
            }}
            onClose={() => {
              setIsUpdateStockFormOpen(false);
              setSelectedInventoryItem(null);
            }}
          />
        )}  
      </AppSheet>       

      <AppSheet
        isOpen={isViewStockItemOpen}
        onClose={() => setIsViewStockItemOpen(false)}
        title="Stock Level Details"
        description="View real-time item quantities, warehouse locations, expiration tracking, and multi-shop breakdowns."
        maxWidth="lg"
      >
        {selectedInventoryItem && (
          <InventoryDetailView
            inventoryItem={selectedInventoryItem}
            onClose={() => {
              setIsViewStockItemOpen(false);
              setSelectedInventoryItem(null);
            }}
            onEdit={() => {
              setIsUpdateStockFormOpen(true);
              setIsViewStockItemOpen(false);
            }}
          />
        )}  
      </AppSheet>
    </div>
  );
}