import { prisma } from "@/lib/dbHelper";
import { generateNextCustomId } from "@/lib/utils";
import { BulkRestockPayload, bulkRestockPayloadSchema } from "@/types/schema/inventory.schema";
import { NotificationService } from "./notification-service";
import { NotificationCategory, NotificationChannel, NotificationPriority } from "@/generated/prisma/enums";
import { AppResponse } from "@/types/auth/auth";
import { GetInventoryListParams } from "@/types/types/shopInventory.type";
import { Prisma } from "@/generated/prisma/client";


export class InventoryService {

  // RESTOCK OR UPDATE SHOP INVENTORY (Slider & Excel Bulk Update Pattern)
  static async restockInventory(
    payload: BulkRestockPayload,
    employeeId: string,
    userId: string,
    businessId: string,
    ipAddress: string,
  ) {
    try {
      // 1. Validate Input Shape
      const validatedData = bulkRestockPayloadSchema.parse(payload);

      // 2. Run updates in a safe database transaction
      const result = await prisma.$transaction(async (tx) => {
        let logsCreated = 0;
        let lowStockAlertsTriggered = 0;

        for (const item of validatedData.items) {
          // A. Double check that the variant actually exists within the business
          const variant = await tx.productVariant.findUnique({
            where: { id: item.productVariantId },
            include: { product: true }
          });

          if (!variant || variant.product.businessId !== businessId) {
            throw new Error(`Product variation not found or does not belong to this business.`);
          }

          // B. Find existing record or initialize a new slot for this branch
          const existingInventory = await tx.shopInventory.findUnique({
            where: {
              shopId_productVariantId: {
                shopId: item.shopId,
                productVariantId: item.productVariantId,
              },
            },
          });

          let inventoryRecordId: string;
          let stockChange = 0;
          let isLowStock = false;

          if (existingInventory) {
            stockChange = item.stock - existingInventory.stock;

            // Update existing branch record
            const updated = await tx.shopInventory.update({
              where: { id: existingInventory.id },
              data: {
                stock: item.stock,
                lowStockAlert: item.lowStockAlert,
              },
            });
            inventoryRecordId = updated.id;
          } else {
            // Fallback creation: Spin up inventory row if branch connection wasn't initialized yet
            stockChange = item.stock;
            const created = await tx.shopInventory.create({
              data: {
                businessId: businessId,
                shopId: item.shopId,
                productVariantId: item.productVariantId,
                stock: item.stock,
                lowStockAlert: item.lowStockAlert,
              },
            });
            inventoryRecordId = created.id;
          }

          // Check if current stock meets the low stock condition
          if (item.stock <= item.lowStockAlert) {
            isLowStock = true;
          }

          // C. Write a stock adjustment history line if quantities changed or initial stock is set
          if (stockChange !== 0 || !existingInventory) {
            const stockLogCustomId = await generateNextCustomId({
              tx,
              businessId,
              sequenceType: "STOCK_LOG",
              prefix: "STLG",
            });

            const defaultReason = existingInventory 
              ? `Manual inventory adjustment update for SKU: ${variant.sku}.` 
              : `Initial stock assignment during branch configuration update for SKU: ${variant.sku}.`;

            await tx.stockLog.create({
              data: {
                customId: stockLogCustomId,
                productVariantId: item.productVariantId,
                shopInventoryId: inventoryRecordId,
                employeeId: employeeId,
                businessId: businessId,
                shopId: item.shopId,
                change: stockChange !== 0 ? stockChange : item.stock,
                logType: "Stock Log",
                reason: item.reason?.trim() || defaultReason,
              },
            });
            logsCreated++;
          }

          // D. Handle Low Stock Notification Alerts if criteria are met
          if (isLowStock) {
            const recipientIds = await NotificationService.getRecipientIdsByRoles(
              businessId,
              ["OWNER", "ADMIN", "MANAGER"],
            );

            if (recipientIds.length > 0) {
              await NotificationService.createManyInTx(tx, recipientIds, {
                businessId,
                shopId: item.shopId,
                title: "Low Stock Warning",
                message: `SKU '${variant.sku}' is running low at branch. Current stock: ${item.stock} (Threshold: ${item.lowStockAlert}).`,
                category: NotificationCategory.STOCK_ALERT,
                priority: NotificationPriority.HIGH,
                channel: NotificationChannel.IN_APP,
              });
              lowStockAlertsTriggered++;
            }
          }
        }

        // E. Audit Log entry for tracking the bulk inventory operation
        await tx.auditLog.create({
          data: {
            action: "RESTOCK_SHOP_INVENTORY",
            entity: "SHOP_INVENTORY",
            entityId: "BULK_RESTOCK_BATCH",
            userId: userId,
            ipAddress: ipAddress,
            businessId: businessId,
            details: JSON.stringify({
              itemsProcessedCount: validatedData.items.length,
              logsGeneratedCount: logsCreated,
            }),
          },
        });

        return { logsCount: logsCreated, alertsCount: lowStockAlertsTriggered };
      });

      return {
        success: true,
        message: `Inventory restocked successfully. Processed ${validatedData.items.length} records and logged ${result.logsCount} stock adjustments.`,
        status: 200,
      } as AppResponse;

    } catch (error: unknown) {
      console.error("Critical inventory restocking engine error:", error);
      return {
        success: false,
        error: (error as Error).message || "Internal database mutation error occurred updating inventory stock levels.",
        status: 500,
      } as AppResponse;
    }
  }


  /**
   * Fetches paginated inventory matrix matching the multi-branch UI requirements.
   */
  static async getInventoryList(params: GetInventoryListParams) {
    const {
      businessId,
      shopId,
      page = 1,
      limit = 100,
      search,
      categoryId,
      status,
    } = params;

    const skip = (page - 1) * limit;

    // 1. Build dynamic filter conditions for Product Variants / Products
    const whereClause: Prisma.ProductVariantWhereInput = {
      isDeleted: false,
      product: {
        businessId: businessId,
        isDeleted: false,
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { baseSku: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      ...(search && {
        OR: [
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ],
      }),
      // If a specific shop filter is applied at the variant level
      ...(shopId && {
        shopInventories: {
          some: { shopId },
        },
      }),
    };

    // 2. Execute queries in parallel for total count and records retrieval
    const [totalItems, variants] = await Promise.all([
      prisma.productVariant.count({ where: whereClause }),
      prisma.productVariant.findMany({
        where: whereClause,
        include: {
          product: {
            include: {
              category: true,
              brand: true,
            },
          },
          images: {
            orderBy: { sortOrder: "asc" },
          },
          shopInventories: {
            include: {
              shop: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // 3. Map raw database structures into the exact shape needed for the UI table
    const formattedRows = variants.map((variant) => {
      // Calculate total stock across all shops (or filtered shops)
      const totalStock = variant.shopInventories.reduce(
        (acc, curr) => acc + curr.stock,
        0
      );

      // Calculate total stock value (Stock * Cost Price or Selling Price - using price here)
      const unitPrice = Number(variant.price);
      const stockValue = totalStock * unitPrice;

      // Determine stock status based on thresholds per shop or aggregate rules
      // If any shop is below low stock or total stock is 0
      let stockStatus: "In Stock" | "Low Stock" | "Out Of Stock" = "In Stock";
      
      if (totalStock === 0) {
        stockStatus = "Out Of Stock";
      } else {
        const hasLowStockBranch = variant.shopInventories.some(
          (inv) => inv.stock <= inv.lowStockAlert
        );
        if (hasLowStockBranch) {
          stockStatus = "Low Stock";
        }
      }

      // Format shop breakdown breakdown list
      const shopBreakdown = variant.shopInventories.map((inv) => ({
        shopId: inv.shopId,
        shopName: inv.shop.name,
        stock: inv.stock,
        lowStockAlert: inv.lowStockAlert,
      }));

      return {
        id: variant.id,
        productId: variant.productId,
        productName: variant.product.name,
        variantSku: variant.sku,
        categoryName: variant.product.category?.name || "Uncategorized",
        imageUrl: variant.images.find((img) => img.isPrimary)?.imageUrl || variant.images[0]?.imageUrl || null,
        totalStock,
        unitPrice,
        stockValue,
        status: stockStatus,
        shopBreakdown,
        lastUpdated: variant.updatedAt,
      } ;
    });

    // Optional post-query filtering if status filter was passed
    const filteredRows = status
      ? formattedRows.filter((row) => {
          if (status === "IN_STOCK") return row.status === "In Stock";
          if (status === "LOW_STOCK") return row.status === "Low Stock";
          if (status === "OUT_OF_STOCK") return row.status === "Out Of Stock";
          return true;
        })
      : formattedRows;

    return {
      success: true,
      data: filteredRows,
      meta: {  
        pagination: {
          total: totalItems,
          page,
          limit,
          totalPages: Math.ceil(totalItems / limit),
        },
      },
      status: 200,
    } as AppResponse;
  }


}