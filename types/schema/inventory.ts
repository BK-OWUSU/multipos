import { Product as PrismaProduct } from "@/generated/prisma/client";

// 1. Core Lookup Interfaces
export interface LookUpField {
  id: string;
  name: string;
}

// 2. Transformed Variant Option Structure
export interface FormattedVariantOption {
  attributeId: string;
  attributeName: string;
  valueId: string;
  value: string;
}

// 3. Isolated Variant Image Structure
export interface TransformedVariantImage {
  id: string;
  imageUrl: string;
  imageKey: string | null;
  isPrimary: boolean;
}

// 🟢 NEW: 4. Localized Shop Inventory Distribution Matrix Row
export interface LocalShopInventory {
  id: string;
  shopId: string;
  stock: number;
  lowStockAlert: number;
}

// 5. Fully Transformed Child Variant Shape
export interface TransformedProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  price: unknown;          
  costPrice: unknown;
  sortOrder: number;
  isActive: boolean;

  stock: number;
  lowStockAlert: number | null;
  shopInventories: LocalShopInventory[];

  weight?: number | null;
  length?: number | null;
  height?: number | null;
  width?: number | null;


  // Custom transformed frontend additions
  images: TransformedVariantImage[];
  variantOptions: FormattedVariantOption[];
  primaryImage: TransformedVariantImage | null;
  imageUrl: string | null;
}

// 5. THE FINAL EXPORTED PRODUCT TYPE
// Extends base schema fields while replacing variants with your clean matrix array
export type Product = Omit<PrismaProduct, 'createdAt' | 'updatedAt'> & {
  category: LookUpField | null;
  brand: LookUpField | null;
  variants: TransformedProductVariant[];
};

// NATIVE TRANSFORMED PRODUCT VARIANT TYPE
export type ProductsVariants = {
    id: string;
    productId: string;
    sku: string;
    barcode: string | null;
    price: number;
    costPrice: number;
    stock: number;
    lowStockAlert: number;
    isActive: boolean;
    weight: number | null;
    length: number | null;
    height: number | null;
    width: number | null;
    productName: string;
    displayName: string;
    description: string | null;
    category: {
        id: string;
        name: string;
    } | null;
    brand: {
        id: string;
        name: string;
    } | null;
    hasMultipleVariants: boolean;
    options: {
        attributeId: string;
        attributeName: string;
        valueId: string;
        value: string;
    }[];
    imageUrl: string | null;
    images: {
        id: string;
        imageUrl: string;
        imageKey: string | null;
        isPrimary: boolean;
    }[];
    createdAt: Date;
    sortOrder: number;
}



//INTERFACE TO UPDATE STOCK
export type UpdateShopInventoryPayload = {
  productVariantId: string;
  shopInventories: {
    shopId: string;
    stock: number;
    lowStockAlert: number;
  }[];
}


export type Category = {
  id: string;
  name: string;
  businessId: string;
  description?: string | null;
  imageUrl?: string | null;
  fileKey?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  _count?: {
    products: number;
  };
};

export type Brand = {
  id: string;
  name: string;
  businessId: string;
  description?: string | null;
  imageUrl?: string | null;
  fileKey?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  _count?: {
    products: number;
  };
};

// Discount
export type Discount = {
  id: string;
  customId: string;
  name: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED";
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE"
  value: number;
  isActive: boolean;
  startDate: string | Date | null;
  endDate: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};


//Query filters
export type ProductVariantQueryFilters = {
  businessId: string;
  shopId?: string; 
  categoryId?: string; 
  isActive?: boolean;
}
