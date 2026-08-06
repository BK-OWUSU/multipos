// lib/bulk-import/export-shop-inventory.ts
import * as XLSX from 'xlsx';
import { FormattedInventoryRow } from '@/types/types/shopInventory.type';

export function downloadShopInventoryExcel(
  inventoryItems: FormattedInventoryRow[], 
  shopId: string, 
  shopName: string,
  onlyLowStock: boolean = false
) {
  const targetItems = inventoryItems.map(item => {
    const breakdown = item.shopBreakdown.find(b => b.shopId === shopId);
    return {
      productVariantId: item.id,
      variantSku: item.variantSku || "",
      productName: item.productName || "",
      stock: breakdown ? breakdown.stock : 0,
      lowStockAlert: breakdown ? breakdown.lowStockAlert : 5,
    };
  }).filter(item => {
    if (onlyLowStock) {
      return item.stock <= item.lowStockAlert;
    }
    return true;
  });

  // Keys must match your Zod schema fields directly so parseExcel reads them effortlessly
  const excelData = targetItems.map(item => ({
    productVariantId: item.productVariantId,
    variantSku: item.variantSku,
    productName: item.productName,
    stock: item.stock,
    lowStockAlert: item.lowStockAlert,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  
  // MUST BE "Import Data" to satisfy your excel-parser.ts implementation
  XLSX.utils.book_append_sheet(workbook, worksheet, "Import Data");

  worksheet['!cols'] = [
    { wch: 36 }, // productVariantId
    { wch: 18 }, // variantSku
    { wch: 25 }, // productName
    { wch: 15 }, // stock
    { wch: 20 }, // lowStockAlert
  ];

  const fileName = `${shopName.toLowerCase().replace(/\s+/g, '_')}_${onlyLowStock ? 'low_stock' : 'full_inventory'}_restock.xlsx`;
  XLSX.writeFile(workbook, fileName);
}