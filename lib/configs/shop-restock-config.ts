// lib/bulk-import/configs/shop-restock-config.ts
import { z } from 'zod';
import { BulkImportConfig } from '@/types/schema/bulkImport';
import { restockInventoryAction } from '@/lib/actions/business/shop-inventory-action';
import { BulkRestockPayload, bulkRestockPayloadSchema } from '@/types/schema/inventory.schema';

export const shopRestockSchema = z.object({
 productVariantId: z.preprocess(
    (val: unknown, ctx) => {
      if (val !== undefined && val !== null && String(val).trim() !== "") return String(val).trim();
      const parent = ctx as unknown as Record<string, unknown>;
      const alternative = 
        parent?.["Product Variant ID (Do Not Change)"] ||
        parent?.["Product Variant ID"] || 
        parent?.["Product Variant Id"] || 
        parent?.["Variant ID"] || 
        parent?.["ID"] || "";
      return String(alternative).trim();
    },
    z.string()),
    
  variantSku: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  stock: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(val) ? 0 : val),
    z.coerce.number().int().nonnegative("Stock must be at least 0")
  ),
  lowStockAlert: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(val) ? 5 : val),
    z.coerce.number().int().nonnegative().default(5)
  ),
});

export type ShopRestockCSVRow = z.infer<typeof shopRestockSchema>;

export const shopRestockConfig: BulkImportConfig<typeof shopRestockSchema, BulkRestockPayload> = {
  entityName: 'Inventory Restock',
  entityNamePlural: 'Inventory Items',
  schema: shopRestockSchema,
  apiEndpoint: async (payload) => {
    const shopId = payload.shopId as string;
    
    // Filter out rows that have an empty productVariantId
    const validItems = (payload.data as unknown as ShopRestockCSVRow[]).filter(
      (item) => item.productVariantId && item.productVariantId !== ""
    );
    
    const rawBulkPayload = {
      items: validItems.map((item) => ({
        shopId: shopId,
        productVariantId: item.productVariantId,
        stock: item.stock,
        lowStockAlert: item.lowStockAlert,
        reason: "Bulk Excel Restock Import",
      })),
    };

    const validatedPayload = bulkRestockPayloadSchema.parse(rawBulkPayload);
    const res = await restockInventoryAction(validatedPayload);
    
    const isSuccess = Boolean(res.success);

    return {
      success: isSuccess,
      total: validatedPayload.items.length,
      success_count: isSuccess ? validatedPayload.items.length : 0,
      failed_count: isSuccess ? 0 : validatedPayload.items.length,
      message: res.message,
      error: res.error,
    };
  },
  // Ensure the transformed data retains productVariantId and optional info for the UI preview table
  transformData: (row: ShopRestockCSVRow) => ({
    productVariantId: row.productVariantId,
    variantSku: row.variantSku || '',
    productName: row.productName || '',
    stock: row.stock,
    lowStockAlert: row.lowStockAlert,
  }),
};