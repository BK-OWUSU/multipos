import { Prisma } from "@/generated/prisma/client";

// Define the precise return type using Prisma's GetPayload utility
export type InventoryListItem = Prisma.ProductVariantGetPayload<{
  include: {
    product: {
      include: {
        category: true;
        brand: true;
      };
    };
    images: true;
    shopInventories: {
      include: {
        shop: true;
      };
    };
  }
}>;

// Formatted UI row type based on the service response structure
export type FormattedInventoryRow = {
  id: string;
  productId: string;
  productName: string;
  variantSku: string;
  categoryName: string;
  imageUrl: string | null;
  totalStock: number;
  unitPrice: number;
  stockValue: number;
  status: "In Stock" | "Low Stock" | "Out Of Stock";
  shopBreakdown: {
    shopId: string;
    shopName: string;
    stock: number;
    lowStockAlert: number;
  }[];
  lastUpdated: Date;
};

export interface GetInventoryListParams {
  businessId: string;
  shopId?: string; // Optional filter if viewing a specific branch's view
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export type InventoryMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
