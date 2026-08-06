"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Layers, TrendingUp, AlertTriangle, AlertCircle, RefreshCw, Upload, Download} from "lucide-react";
import { useInventoryStore } from "@/store/shop-inventory.store";
import TableMain from "@/components/reusables/table/TableMain";
import { InventoryTableMeta, businessInventoryColumnDef } from "@/components/tablesColumnDef/business/inventory/business-InventoryColumnDef";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { FormattedInventoryRow } from "@/types/types/shopInventory.type";
import { AppSheet } from "@/components/reusables/AppSheet";
import { UpdateStockForm } from "@/components/forms/inventory/UpdateStockForm";
import { useShopStore } from "@/store/shopStore";
import { InventoryDetailView } from "@/components/detials-components/inventory/InventoryDetailViewer";
import { GenericModal } from "@/components/reusables/GenericModal";
import GenericExcelBulkImport from "@/components/reusables/GenericExcelBulkImport";
import { shopRestockConfig } from "@/lib/configs/shop-restock-config";
import CustomButton from "@/components/reusables/CustomButton";
import { downloadShopInventoryExcel } from "@/lib/bulk-import/export-shop-inventory";

export default function InventoryRestockView() {
  const { inventoryItems, meta, isLoading, fetchInventory } = useInventoryStore();
  const { fetchShops, shops } = useShopStore();
  const [pageSize, setPageSize] = useState(100);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<FormattedInventoryRow | null>(null);
  const [isUpdateStockFormOpen, setIsUpdateStockFormOpen] = useState(false);
  const [isViewStockItemOpen, setIsViewStockItemOpen] = useState(false);

  // Bulk Restock Modal States
  const [isBulkRestockModalOpen, setIsBulkRestockModalOpen] = useState(false);
  const [selectedShopIdForRestock, setSelectedShopIdForRestock] = useState<string>("");
  const [modalWidth, setModalWidth] = useState("sm:max-w-137.5");


  useEffect(() => {
    fetchInventory({limit: pageSize});
    fetchShops();
  }, [fetchInventory, pageSize, fetchShops]);

  // Dynamically compute values from real inventory items data
  const items = inventoryItems || [];
  const totalProductsCount = meta?.total || items.length;
  const totalVariantsCount = meta?.total || items.length;
  
  // Calculate total stock value from all items
  const totalStockValueNumber = items.reduce((acc, item) => acc + Number(item.stockValue || 0), 0);
  
  // Count low stock and out of stock dynamically based on item status
  const lowStockCount = items.filter((item) => item.status === "Low Stock").length;
  const outOfStockCount = items.filter((item) => item.status === "Out Of Stock").length;


  const activeShopForRestock = shops.find((s) => s.id === selectedShopIdForRestock);

  return (
    <div className="space-y-6 p-6">
      {/* Top Header & Action Section (Export & Reorder suggestions removed, Update Stock kept) */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Levels</h1>
          <p className="text-sm text-slate-500">
            View and monitor stock levels for all products and variants across all shops.
          </p>
        </div>
        <div>
          <div className="flex items-center gap-3">
          {/* Trigger to open Bulk Restock Modal */}
          <GenericModal
            width={modalWidth}
            header="Bulk Excel Restock"
            description="Select a shop, download its stock items, update quantities, and upload back."
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
            {!selectedShopIdForRestock ? (
              <div className="space-y-4 py-2">
                <label className="text-sm font-medium text-slate-700 block">
                  Select Target Shop for Bulk Restock
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-blue-600"
                  value={selectedShopIdForRestock}
                  onChange={(e) => setSelectedShopIdForRestock(e.target.value)}
                >
                  <option value="">-- Choose a shop --</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  You must pick a specific shop branch to download and push inventory stock adjustments.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
                  <div>
                    <span className="text-xs text-slate-400 block">Selected Branch</span>
                    <span className="text-sm font-bold text-slate-800">{activeShopForRestock?.name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedShopIdForRestock("")}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Change Shop
                  </button>
                </div>

                {/* Step 1: Download Template Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <CustomButton
                    text="Download Low Stock"
                    customVariant="primary"
                    icon={<Download className="mr-2 h-4 w-4" />}
                    onClick={() =>
                      downloadShopInventoryExcel(
                        inventoryItems || [],
                        selectedShopIdForRestock,
                        activeShopForRestock?.name || "Shop",
                        true
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
                        selectedShopIdForRestock,
                        activeShopForRestock?.name || "Shop",
                        false
                      )
                    }
                  />
                </div>

                <div className="border-t pt-4">
                  <GenericExcelBulkImport
                    config={shopRestockConfig}
                    additionalPayload={{ shopId: selectedShopIdForRestock }}
                    onSuccess={() => {
                      setIsBulkRestockModalOpen(false);
                      setSelectedShopIdForRestock("");
                      fetchInventory({ limit: pageSize });
                      setModalWidth("sm:max-w-137.5");
                    }}
                    onCancel={() => {
                      setIsBulkRestockModalOpen(false);
                      setSelectedShopIdForRestock("");
                      setModalWidth("sm:max-w-137.5");
                    }}
                    onImportParsedSuccess={() => {
                      setModalWidth("sm:max-w-max");
                    }}
                  />
                </div>
              </div>
            )}
          </GenericModal>
        </div>
        </div>
      </div>

      {/* Top Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200 shadow-sm">
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

        <Card className="border-slate-200 shadow-sm">
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

        <Card className="border-slate-200 shadow-sm">
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
              <span className="text-lg font-bold">€</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
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

        <Card className="border-slate-200 shadow-sm">
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

      {/* Main Data Table Card (Search/Filters block & Tabs entirely excluded) */}
      <Card className="border border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white w-full">
            <div className="w-full overflow-x-auto">
              <TableMain
                columns={businessInventoryColumnDef}
                data={inventoryItems || []}
                loading = {isLoading}
                onPageSizeChange={(size) => setPageSize(size)}
                columnVisibilityFilter={true}
                tableFilterButtonVisible={true}
                tableExportButtonVisible={true}
                searchKey="product name"

                meta = {{
                  onEditItem(item) {
                      setSelectedInventoryItem(item)
                      setIsUpdateStockFormOpen(true);
                    },
                    onViewDetails(item) {
                      setSelectedInventoryItem(item)
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
      <UpdateStockForm
        inventoryItem={selectedInventoryItem} 
        shops={shops}
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
      onEdit={()=> {
        setIsUpdateStockFormOpen(true);
         setIsViewStockItemOpen(false);
      }}
    />
  )}  
</AppSheet>
  </div>
  );
}