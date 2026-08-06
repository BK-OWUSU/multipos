// lib/bulk-import/configs/product-config.ts
import { z } from 'zod';
import { BulkImportConfig } from '@/types/schema/bulkImport';
import { createBulkProductsAction } from '../actions/business/productsActions';

// ── 1. DEFINE THE FLAT EXCEL ROW ZOD SCHEMA ───────────────────────────────────
export const productExcelRowSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  baseSku: z.string().min(2, "Base SKU prefix is required").toUpperCase(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  
  sku: z.string().min(3, "Variant SKU must be at least 3 characters"),
  barcode: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === "" || String(val).trim().toLowerCase() === "blank") return null;
      return String(val).trim();
    }),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  costPrice: z.coerce.number().min(0, "Cost Price cannot be negative"),
  stock: z.coerce.number().int().nonnegative(),
  lowStockAlert: z.coerce.number().int().nonnegative().default(5),
  
  weight: z.coerce.number().nonnegative().optional().nullable(),
  length: z.coerce.number().nonnegative().optional().nullable(),
  width: z.coerce.number().nonnegative().optional().nullable(),
  height: z.coerce.number().nonnegative().optional().nullable(),

  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
});

export type ProductExcelRow = z.infer<typeof productExcelRowSchema>;

// ── 2. DEFINE THE OUTPUT FORMAT MATCHING YOUR INTERFACE ───────────────────────
export interface GroupedProductImportPayload {
  name: string;
  baseSku: string;
  description: string | null;
  hasVariant: boolean;
  isActive: boolean;
  categoryId: string | null;
  brandId: string | null;
  attributes: {
    name: string;
    sortOrder: number;
    matrixSplitValues: string;
  }[];
  variants: {
    sku: string;
    barcode: string | null;
    price: number;
    costPrice: number;
    stock: number;
    lowStockAlert: number;
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    isActive: boolean;
    sortOrder: number;
    options: {
      attributeName: string;
      attributeValueId: string | null;
      value: string;
    }[];
    imageUrl: string;
    fileKey: string;
  }[];
}

// ── 3. BUILD THE MASTER CONFIGURATION BLUEPRINT ───────────────────────────────
export const productExcelImportConfig: BulkImportConfig<typeof productExcelRowSchema, GroupedProductImportPayload[]> = {
  entityName: 'Product',
  entityNamePlural: 'Products',
  schema: productExcelRowSchema,
  apiEndpoint: createBulkProductsAction,
  customTemplatePath: 'products',

  /**
   * Safe aggregator transformation. Groups same baseSku rows under one parent variants array.
   * Single standalone products safely get 1 variant element inside the array seamlessly.
   */
  transformData: (rows: ProductExcelRow[] | ProductExcelRow): GroupedProductImportPayload[] => {
    const flatRows = Array.isArray(rows) ? rows : [rows];
    const groupedMap = new Map<string, GroupedProductImportPayload>();

    flatRows.forEach((row) => {
      const key = row.baseSku.trim().toUpperCase();

      // 1. Initialize Parent Container once per baseSku grouping
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          name: row.name.trim(),
          baseSku: key,
          description: row.description && row.description.trim().toLowerCase() !== "blank" ? row.description.trim() : null,
          hasVariant: false, // Defaulting to false, toggles true if attribute metrics exist
          isActive: true,
          categoryId: (row.categoryId === "" || row.categoryId === "none" || row.categoryId === undefined || row.categoryId === null || String(row.categoryId).trim().toLowerCase() === "blank") ? null : String(row.categoryId).trim(),
          brandId: (row.brandId === "" || row.brandId === "none" || row.brandId === undefined || row.brandId === null || String(row.brandId).trim().toLowerCase() === "blank") ? null : String(row.brandId).trim(),
          attributes: [],
          variants: []
        });
      }

      const parentProduct = groupedMap.get(key)!;

      // 2. Map structural options
      const variantOptions: { attributeName: string; attributeValueId: string | null; value: string }[] = [];
      
      if (row.color && row.color.trim() !== "" && row.color.trim().toLowerCase() !== "blank") {
        variantOptions.push({ attributeName: "Color", attributeValueId: null, value: row.color.trim() });
      }
      if (row.size && row.size.trim() !== "" && row.size.trim().toLowerCase() !== "blank") {
        variantOptions.push({ attributeName: "Size", attributeValueId: null, value: row.size.trim() });
      }
      if (row.material && row.material.trim() !== "" && row.material.trim().toLowerCase() !== "blank") {
        variantOptions.push({ attributeName: "Material", attributeValueId: null, value: row.material.trim() });
      }

      // 3. Update global attributes matrix strings
      if (variantOptions.length > 0) {
        parentProduct.hasVariant = true;
        
        variantOptions.forEach((opt) => {
          let existingAttr = parentProduct.attributes.find(
            attr => attr.name.toLowerCase() === opt.attributeName.toLowerCase()
          );

          if (!existingAttr) {
            existingAttr = {
              name: opt.attributeName,
              sortOrder: parentProduct.attributes.length,
              matrixSplitValues: ""
            };
            parentProduct.attributes.push(existingAttr);
          }

          const valuesArray = existingAttr.matrixSplitValues ? existingAttr.matrixSplitValues.split(",") : [];
          if (!valuesArray.includes(opt.value)) {
            valuesArray.push(opt.value);
            existingAttr.matrixSplitValues = valuesArray.join(",");
          }
        });
      }

      // 4. Safely push this row variant configuration into the shared array bucket
      parentProduct.variants.push({
        sku: row.sku.trim(),
        barcode: row.barcode || null,
        price: row.price,
        costPrice: row.costPrice,
        stock: row.stock,
        lowStockAlert: row.lowStockAlert,
        weight: !row.weight || String(row.weight).toLowerCase() === "blank" ? null : row.weight,
        length: !row.length || String(row.length).toLowerCase() === "blank" ? null : row.length,
        width: !row.width || String(row.width).toLowerCase() === "blank" ? null : row.width,
        height: !row.height || String(row.height).toLowerCase() === "blank" ? null : row.height,
        isActive: true,
        sortOrder: parentProduct.variants.length, // Keeps auto-increment index orders clean
        options: variantOptions,
        imageUrl: "",
        fileKey: ""
      });
    });

    return Array.from(groupedMap.values());
  },

  validateRow: (row: ProductExcelRow): { valid: boolean; error?: string } => {
    if (row.price < row.costPrice) {
      return {
        valid: false,
        error: `SKU ${row.sku}: Price (${row.price}) cannot be lower than cost price (${row.costPrice}).`
      };
    }
    if (!row.baseSku || row.baseSku.trim() === "") {
      return {
        valid: false,
        error: `Product "${row.name}" requires a valid Base SKU prefix.`
      };
    }
    return { valid: true };
  }
};