import { z } from "zod";

// 1. INVENTORY MANAGEMENT SCHEMAS (Renamed to clear up intent)
export const shopInventorySchema = z.object({
  id: z.string().optional(), 
  shopId: z.string().min(1, "Shop assignment is required"),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative").default(0),
  lowStockAlert: z.coerce.number().int().nonnegative().default(5),
});

// 2. INDIVIDUAL OPTION VALUE SELECTION
export const variantOptionSchema = z.object({
  attributeName: z.string().min(1, "Attribute name is required"), 
  attributeValueId: z.string().optional().nullable(), 
  value: z.string().min(1, "Option value is required"), 
});

// 3. ROOT ATTRIBUTE RULES DEFINITION
export const productAttributeSchema = z.object({
  id: z.string().optional(), 
  name: z.string().min(1, "Attribute name is required (e.g., Size, Color)"),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  matrixSplitValues: z.string().optional().default(""),
});

// 4. PRODUCT VARIANT CONFIGURATION (Standardized array names here)
export const productVariantSchema = z.object({
  id: z.string().optional(), 
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  barcode: z.string().optional().nullable().transform(v => v === "" ? null : v),
  
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  costPrice: z.coerce.number().min(0, "Cost Price cannot be negative").default(0),

  // ──  UPDATED TO MATCH FRONTEND LOG FORMAT ──
  shopInventories: z.array(shopInventorySchema).default([]),
  
  weight: z.coerce.number().nonnegative().optional().nullable(), 
  length: z.coerce.number().nonnegative().optional().nullable(), 
  width: z.coerce.number().nonnegative().optional().nullable(), 
  height: z.coerce.number().nonnegative().optional().nullable(),
  
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  
  options: z.array(variantOptionSchema).default([]),
  
  imageUrl: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
  fileKey: z.string().optional().nullable().or(z.literal("")),
});

// 5. THE PRIMARY COMPOSITE SCHEMA (The Parent Container)
export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional().nullable().transform(v => v === "" ? null : v),
  baseSku: z.string().min(2, "Base SKU prefix is required").toUpperCase(),
  hasVariant: z.boolean().default(false),
  isActive: z.boolean().default(true),
  
  categoryId: z.string().optional().nullable().transform(v => (v === "" || v === "none") ? null : v),
  brandId: z.string().optional().nullable().transform(v => (v === "" || v === "none") ? null : v),

  attributes: z.array(productAttributeSchema).default([]), 
  variants: z.array(productVariantSchema).min(1, "Product must have at least one variant configuration"), 
});

// ── 🧠 REUSE EXTENSIONS FOR INFERENCE TYPES ──
export type ProductFormValues = z.input<typeof productSchema>;

// Export your Edit type as an exact match alias of productSchema
// This ensures that any adjustments made above mirror instantly on both forms!
export type EditProductFormValue = ProductFormValues;
export const editProductSchema = productSchema;


// 1. DEDICATED INVENTORY MANAGEMENT SCHEMAS
export const restockItemSchema = z.object({
  shopId: z.string().min(1, "Shop assignment is required"),
  productVariantId: z.string().min(1, "Product Variant ID is required"),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative"),
  lowStockAlert: z.coerce.number().int().nonnegative().default(5),
  reason: z.string().optional().nullable(),
});

export const bulkRestockPayloadSchema = z.object({
  items: z.array(restockItemSchema).min(1, "At least one item must be provided for restocking"),
});

export type RestockItemPayload = z.infer<typeof restockItemSchema>;
export type BulkRestockPayload = z.infer<typeof bulkRestockPayloadSchema>;

// ── 5. CORE AUXILIARY SCHEMAS (Unchanged) ─────────────────
export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().optional().nullable(), 
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional().nullable(),
  fileKey: z.string().optional().nullable(), 
});
export type CategoryFormValues = z.input<typeof categorySchema>;

export const brandSchema = z.object({
  name: z.string().min(2, "Brand name is required"),
  description: z.string().optional().nullable(), 
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional().nullable(),
  fileKey: z.string().optional().nullable(), 
});
export type BrandFormValues = z.input<typeof brandSchema>;

// Helper to get midnight of today for clean date comparison
const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};


//DISCOUNT SCHEMA
export const createDiscountSchema = z.object({
  name: z.string().min(1, "Discount name is required"),
  description: z.string().optional().nullable().transform(v => v === "" ? null : v),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0, "Value cannot be negative"),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})
.refine((data) => {
  if (!data.startDate) return true; // Skip if empty
  const start = new Date(data.startDate);
  start.setHours(0, 0, 0, 0);
  return start >= getStartOfToday();
}, {
  message: "Start date cannot be in the past",
  path: ["startDate"], // Pairs the error explicitly to your UI field
})
.refine((data) => {
  if (!data.endDate) return true; // Skip if empty
  const end = new Date(data.endDate);
  end.setHours(0, 0, 0, 0);
  return end >= getStartOfToday();
}, {
  message: "End date cannot be in the past",
  path: ["endDate"],
})
// Bonus: Ensure End Date isn't before Start Date if both exist
.refine((data) => {
  if (!data.startDate || !data.endDate) return true;
  return new Date(data.endDate) >= new Date(data.startDate);
}, {
  message: "End date cannot be earlier than the start date",
  path: ["endDate"],
});

export type CreateDiscountSchema = z.input<typeof createDiscountSchema>;