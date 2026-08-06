import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { productSchema,ProductFormValues, EditProductFormValue, editProductSchema } from "@/types/schema/inventory.schema";
import { Product, ProductsVariants, ProductVariantQueryFilters, UpdateShopInventoryPayload } from "@/types/schema/inventory";
import { GroupedProductImportPayload } from "@/lib/configs/product-config";
import { generateNextCustomId } from "@/lib/utils";
import { NotificationService } from "./notification-service";
import { NotificationCategory, NotificationChannel, NotificationPriority } from "@/generated/prisma/client";




export class ProductService {

// CREATE SINGLE PRODUCT METHOD
static async createProduct(
  data: ProductFormValues,
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {
    // 1. Validate Input Shape
    const validatedData = productSchema.parse(data);
     console.dir(validatedData.variants[0].shopInventories)
     console.dir(validatedData.variants.map(a => a.shopInventories))

    // 2. DUPLICATE CHECK: Verify ALL new SKUs are unique within the business.
    const newSkus = validatedData.variants.map((v) => v.sku);
    const existingVariantSkus = await prisma.productVariant.findMany({
      where: {
        sku: { in: newSkus },
        product: { businessId: businessId },
        isDeleted: false,
      },
      select: { sku: true },
    });

    if (existingVariantSkus.length > 0) {
      const duplicateSkus = existingVariantSkus.map((v) => v.sku).join(", ");
      return {
        error: `These SKUs already exist in your business: ${duplicateSkus}`,
        success: false,
        status: 400,
      };
    }

    // 3. START TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // ── STEP A: Create the Parent Product ─────────────────
      const newProduct = await tx.product.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          baseSku: validatedData.baseSku.trim().toUpperCase(),
          hasVariant: validatedData.hasVariant,
          isActive: validatedData.isActive,
          businessId: businessId,
          categoryId: validatedData.categoryId === "none" ? null : validatedData.categoryId,
          brandId: validatedData.brandId === "none" ? null : validatedData.brandId,
        },
      });

      const attributeValueMap: Record<string, string> = {};

      // ── STEP B: Resolve Attributes & Predefined Values ───
      if (validatedData.hasVariant && validatedData.attributes && validatedData.attributes.length > 0) {
        for (const attrRule of validatedData.attributes) {
          if (!attrRule.name) continue;

          const attributeGroup = await tx.variantAttribute.upsert({
            where: {
              businessId_name: {
                businessId: businessId,
                name: attrRule.name.trim(),
              },
            },
            update: {
              sortOrder: attrRule.sortOrder,
            },
            create: {
              name: attrRule.name.trim(),
              businessId: businessId,
              sortOrder: attrRule.sortOrder,
            },
          });

          const tagsArray = attrRule.matrixSplitValues
            ? attrRule.matrixSplitValues.split(",").map((v) => v.trim()).filter(Boolean)
            : [];

          for (const tagValue of tagsArray) {
            const valueRecord = await tx.variantAttributeValue.upsert({
              where: {
                attributeId_value: {
                  attributeId: attributeGroup.id,
                  value: tagValue,
                },
              },
              update: {},
              create: {
                attributeId: attributeGroup.id,
                value: tagValue,
              },
            });

            const compositeKey = `${attributeGroup.name}:${tagValue}`;
            attributeValueMap[compositeKey] = valueRecord.id;
          }
        }
      }

      // ── STEP C: Create Product Variants & Inventories per Branch ───
      for (const variantData of validatedData.variants) {
        
        // 1. Build the variant write step (stock/lowStock removed from here)
        const newVariant = await tx.productVariant.create({
          data: {
            productId: newProduct.id,
            sku: variantData.sku,
            barcode: variantData.barcode || null,
            price: variantData.price,
            costPrice: variantData.costPrice,
            weight: variantData.weight !== undefined ? variantData.weight : null,
            length: variantData.length !== undefined ? variantData.length : null,
            width: variantData.width !== undefined ? variantData.width : null,
            height: variantData.height !== undefined ? variantData.height : null,
            sortOrder: variantData.sortOrder,
            isActive: variantData.isActive,
          },
        });

  

        // 2. Link variant image records
        if (variantData.imageUrl) {
          await tx.variantImage.create({
            data: {
              variantId: newVariant.id,
              imageUrl: variantData.imageUrl,
              imageKey: variantData.fileKey || null,
              isPrimary: true,
              sortOrder: 0,
            },
          });
        }

        // 3. Populate product variant option junctions (Many-to-Many Linking)
        if (validatedData.hasVariant && variantData.options && variantData.options.length > 0) {
          const junctionData = variantData.options
            .map((opt) => {
              const compositeKey = `${opt.attributeName}:${opt.value}`;
              const attributeValueId = attributeValueMap[compositeKey];
              
              if (!attributeValueId) return null;

              return {
                variantId: newVariant.id,
                attributeValueId: attributeValueId,
              };
            })
            .filter(Boolean) as { variantId: string; attributeValueId: string }[];

          if (junctionData.length > 0) {
            await tx.productVariantOption.createMany({
              data: junctionData,
            });
          }
        }

        // 4. 🟢 THE MIGRATION FIX: Create entries inside individual branches
        if (variantData.shopInventories && variantData.shopInventories.length > 0) {
          for (const inv of variantData.shopInventories) {
            // Only create inventory records if stock is allocated or lowStockAlert is explicitly set
            const createdInventory = await tx.shopInventory.create({
              data: {
                businessId: businessId,
                shopId: inv.shopId,
                productVariantId: newVariant.id,
                stock: inv.stock,
                lowStockAlert: inv.lowStockAlert,
              }
            });

            // 5. 🟢 FIX STOCK LOGS: Write structural branch history records
            if (inv.stock > 0) {
              const stockLogCustomIdGen = await generateNextCustomId({tx,businessId, sequenceType: "STOCK_LOG",prefix: "STLG"});
              await tx.stockLog.create({
                data: {
                  customId: stockLogCustomIdGen,
                  productVariantId: newVariant.id,
                  shopInventoryId: createdInventory.id,
                  employeeId: employeeId,
                  businessId: businessId,
                  shopId: inv.shopId, // Required by your schema update
                  change: inv.stock,
                  reason: `Initial stock allocation for branch during creation of SKU: ${newVariant.sku}.`,
                },
              });
            }

              if (inv.stock <= inv.lowStockAlert) {
                  const recipientIds = await NotificationService.getRecipientIdsByRoles(
                    businessId, 
                    ["OWNER", "ADMIN", "MANAGER"], 
                   // employeeId // Exclude the person currently creating the product if desired
                )

                // 2. Broadcast the notification in bulk
                if (recipientIds.length > 0) {
                  await NotificationService.createManyInTx(tx, recipientIds, {
                    businessId,
                    shopId: inv.shopId,
                    title: "Low Initial Stock Alert",
                    message: `New variant SKU '${newVariant.sku}' added with low initial stock (${inv.stock} units remaining).`,
                    category: NotificationCategory.STOCK_ALERT,
                    priority: NotificationPriority.HIGH,
                    channel:  NotificationChannel.IN_APP,
                  })
                }
            }
          }
        }
      }

      // ── STEP D: Final Auditing ────────────────────────────
      await tx.auditLog.create({
        data: {
          action: "CREATE_PRODUCT_WITH_VARIANTS",
          entity: "PRODUCT",
          entityId: newProduct.id,
          userId: userId,
          businessId: businessId,
        },
      });

      return newProduct;
    });

    return {
      success: true,
      message: `Product "${result.name}" saved and variations mapped successfully.`,
      product: result,
      status: 201,
    };
      
  } catch (error: unknown) {
    console.error("Critical transactional API write loop error:", error);
    return { 
      error: (error as Error).message || "An unexpected system error occurred while adding the product.", 
      success: false, 
      status: 500 
    };    
  }
}


static async updateShopInventory(
  payload: UpdateShopInventoryPayload,
  employeeId: string,
  userId: string,
  businessId: string
) {
  try {
    const { productVariantId, shopInventories } = payload;

    // 1. Double check that the variant actually exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
      include: { product: true }
    });

    if (!variant || variant.product.businessId !== businessId) {
      return { success: false, error: "Product variation not found.", status: 404 };
    }

    // 2. Run updates in a safe database transaction
    const result = await prisma.$transaction(async (tx) => {
      let logsCreated = 0;

      for (const inv of shopInventories) {
        // Find existing record or initialize a new slot for this branch
        const existingInventory = await tx.shopInventory.findUnique({
          where: {
            shopId_productVariantId: {
              shopId: inv.shopId,
              productVariantId: productVariantId
            },
          },
        });

        let isLowStock = false;

        if (existingInventory) {
          // Calculate net change for our tracking ledger logs
          const stockChange = inv.stock - existingInventory.stock;

          // Update existing branch record
          await tx.shopInventory.update({
            where: { id: existingInventory.id },
            data: {
              stock: inv.stock,
              lowStockAlert: inv.lowStockAlert,
            },
          });

          // Check if current stock meets the low stock condition
          if (inv.stock <= inv.lowStockAlert) {
            isLowStock = true;
          }

          // Write a stock adjustment history line if quantities changed
          if (stockChange !== 0) {
            const stockLogCustomId = await generateNextCustomId({
              tx,
              businessId,
              sequenceType: "STOCK_LOG",
              prefix: "STLG",
            });

            await tx.stockLog.create({
              data: {
                customId: stockLogCustomId,
                productVariantId: productVariantId,
                shopInventoryId: existingInventory.id,
                employeeId: employeeId,
                businessId: businessId,
                shopId: inv.shopId,
                change: stockChange,
                logType: "Stock Log",
                reason: `Manual inventory adjustment update for SKU: ${variant.sku}.`,
              },
            });
            logsCreated++;
          }
        } else {
          // Fallback creation: Spin up inventory row if branch connection wasn't initialized yet
          const newInventory = await tx.shopInventory.create({
            data: {
              businessId: businessId,
              shopId: inv.shopId,
              productVariantId: productVariantId,
              stock: inv.stock,
              lowStockAlert: inv.lowStockAlert,
            },
          });

            if (inv.stock <= inv.lowStockAlert) {
              isLowStock = true;
            }

          if (inv.stock > 0) {
            const stockLogCustomId = await generateNextCustomId({
              tx,
              businessId,
              sequenceType: "STOCK_LOG",
              prefix: "STLG",
            });

            await tx.stockLog.create({
              data: {
                customId: stockLogCustomId,
                productVariantId: productVariantId,
                shopInventoryId: newInventory.id,
                employeeId: employeeId,
                businessId: businessId,
                shopId: inv.shopId,
                change: inv.stock,
                logType: "Stock Log",
                reason: `Initial stock assignment during branch configuration update for SKU: ${variant.sku}.`,
              },
            });
            logsCreated++;
          }

          if (isLowStock) {
          const recipientIds = await NotificationService.getRecipientIdsByRoles(
            businessId,
            ["OWNER", "ADMIN", "MANAGER"],
            employeeId // Exclude the user performing the update if desired
          );

          if (recipientIds.length > 0) {
            await NotificationService.createManyInTx(tx, recipientIds, {
              businessId,
              shopId: inv.shopId,
              title: "Low Stock Warning",
              message: `SKU '${variant.sku}' is running low at branch. Current stock: ${inv.stock} (Threshold: ${inv.lowStockAlert}).`,
              category: NotificationCategory.STOCK_ALERT,
              priority: NotificationPriority.HIGH,
              channel: NotificationChannel.IN_APP,
            });
          }
        }

        }
      }

      return { logsCount: logsCreated };
    });

    return {
      success: true,
      message: `Branch inventory layouts updated successfully. Formed ${result.logsCount} inventory ledger history entries.`,
      status: 200,
    };

  } catch (error: unknown) {
    console.error("Critical branch stock allocation matrix update error:", error);
    return {
      success: false,
      error: (error as Error).message || "Internal database mutation error occurred updating inventory distribution rows.",
      status: 500,
    };
  }
}

// CREATE BULK PRODUCT SERVICE (GLOBAL CATALOG ONLY)
static async createBulkProductsService(
    payload: { data: GroupedProductImportPayload[] },
    userId: string,
    employeeId: string,
    businessId: string,
    businessSlug: string
  ) {
    try {
      const productItems = payload.data;
     

      if (!productItems || productItems.length === 0) {
        return { success: false, error: "No product data found in payload.", status: 400 };
      }

      // ── EXECUTE TRANSACTION ───────────────────────────────────
      const transactionResult = await prisma.$transaction(async (tx) => {
        let savedProductsCount = 0;
        let savedVariantsCount = 0;

        for (const item of productItems) {
          // A. Upsert the parent product container using its unique business + baseSku combo
          const parentProduct = await tx.product.upsert({
            where: {
              businessId_baseSku: {
                businessId: businessId,
                baseSku: item.baseSku.trim().toUpperCase(),
              }
            },
            update: {
              name: item.name.trim(),
              description: item.description,
              hasVariant: item.hasVariant,
              isActive: item.isActive,
              categoryId: item.categoryId,
              brandId: item.brandId,
              isDeleted: false // Restores if previously soft-deleted
            },
            create: {
              name: item.name.trim(),
              description: item.description,
              baseSku: item.baseSku.trim().toUpperCase(),
              hasVariant: item.hasVariant,
              isActive: item.isActive,
              businessId: businessId,
              categoryId: item.categoryId,
              brandId: item.brandId,
            },
          });

          savedProductsCount++;
          const attributeValueIdMap: Record<string, string> = {};

          // B. Upsert Variant Attributes & Dynamic Attribute Values
          if (item.hasVariant && item.attributes && item.attributes.length > 0) {
            for (const attr of item.attributes) {
              if (!attr.name) continue;

              const attributeGroup = await tx.variantAttribute.upsert({
                where: {
                  businessId_name: {
                    businessId: businessId,
                    name: attr.name.trim(),
                  },
                },
                update: { sortOrder: attr.sortOrder },
                create: {
                  name: attr.name.trim(),
                  businessId: businessId,
                  sortOrder: attr.sortOrder,
                },
              });

              const distinctValuesForAttribute = new Set<string>();
              item.variants.forEach((v) => {
                v.options.forEach((opt) => {
                  if (opt.attributeName.trim().toLowerCase() === attr.name.trim().toLowerCase() && opt.value) {
                    distinctValuesForAttribute.add(opt.value.trim());
                  }
                });
              });

              for (const tagValue of distinctValuesForAttribute) {
                const valueRecord = await tx.variantAttributeValue.upsert({
                  where: {
                    attributeId_value: {
                      attributeId: attributeGroup.id,
                      value: tagValue,
                    },
                  },
                  update: {},
                  create: {
                    attributeId: attributeGroup.id,
                    value: tagValue,
                  },
                });

                const compositeMapKey = `${attributeGroup.name}:${tagValue}`;
                attributeValueIdMap[compositeMapKey] = valueRecord.id;
              }
            }
          }

          // C. Map Product Variants (Catalog Matrix Only - No Stocks Tracked Here)
          if (item.variants && item.variants.length > 0) {
            for (const variantData of item.variants) {
              
             const variantRecord = await tx.productVariant.upsert({
                where: {
                  productId_sku: {
                    productId: parentProduct.id,
                    sku: variantData.sku.trim(),
                  }
                },
                update: {
                  barcode: variantData.barcode,
                  price: variantData.price,
                  costPrice: variantData.costPrice,
                  weight: variantData.weight,
                  length: variantData.length,
                  width: variantData.width,
                  height: variantData.height,
                  isActive: variantData.isActive,
                },
                create: {
                  productId: parentProduct.id,
                  sku: variantData.sku.trim(),
                  barcode: variantData.barcode,
                  price: variantData.price,
                  costPrice: variantData.costPrice,
                  weight: variantData.weight,
                  length: variantData.length,
                  width: variantData.width,
                  height: variantData.height,
                  sortOrder: variantData.sortOrder,
                  isActive: variantData.isActive,
                },
              });

              savedVariantsCount++;

              // Note: If you need variant choices mapped via productVariantOption, 
              // you can perform that block here cleanly using a find/create query pattern.
              // 2. 🟢 SAFE OPTION JUNCTION MAPPING (Handles both creates & safe updates)
              if (item.hasVariant && variantData.options && variantData.options.length > 0) {
                const junctionsToInsert = variantData.options
                  .map((opt) => {
                    const lookupKey = `${opt.attributeName.trim()}:${opt.value.trim()}`;
                    const targetValueId = attributeValueIdMap[lookupKey.trim().toLowerCase()];

                    if (!targetValueId) return null;

                    return {
                      variantId: variantRecord.id,
                      attributeValueId: targetValueId,
                    };
                  })
                  .filter(Boolean) as { variantId: string; attributeValueId: string }[];

                  if (junctionsToInsert.length > 0) {
                // skipDuplicates ensures it won't crash if the relation already exists
                await tx.productVariantOption.createMany({
                  data: junctionsToInsert,
                  skipDuplicates: true, 
                });
              }
            }
            }
          }
        }

        // D. Batch summary Audit Log entry
        await tx.auditLog.create({
          data: {
            action: "BULK_IMPORT_PRODUCTS_CATALOG",
            entity: "PRODUCT",
            entityId: "BULK_BATCH",
            userId: userId,
            businessId: businessId,
            details: JSON.stringify({
              productsProcessedCount: savedProductsCount,
              variantsProcessedCount: savedVariantsCount,
            }),
          },
        });

        return { productsCount: savedProductsCount, variantsCount: savedVariantsCount };
      });

      return {
        success: true,
        message: `Successfully imported ${transactionResult.productsCount} products and ${transactionResult.variantsCount} variants into your global product catalog blueprint.`,
        status: 201,
        redirectTo: `/${businessSlug}/products`
      };

    } catch (error: unknown) {
      console.error("Critical catalog bulk upload configuration engine crash:", error);
      return {
        success: false,
        error: (error as Error).message || "An unexpected error occurred processing your catalog configuration file.",
        status: 500,
      };
    }
  }

  // GET ALL PRODUCTS SERVICE - FULL DETAIL WITH VARIANTS & IMAGES
static async getAllProductsService(businessId: string): Promise<AppResponse> {
  try {
    // 1. Fetch Products Optimized for List/Grid Views with the new multi-tenant layout
    const products = await prisma.product.findMany({
      where: {
        businessId: businessId,
        isDeleted: false, 
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },

        // ── VARIANT RELATION FETCH ─────────────────
        variants: {
          where: { isDeleted: false }, 
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            productId: true,
            sku: true,
            barcode: true,
            price: true,     
            costPrice: true,
            isActive: true,
            sortOrder: true,
            weight:true,
            length:true,
            height: true,
            width:true,

            // stock and lowStockAlert have been removed from here! ❌

            // 🟢 NEW: Fetch stock levels assigned across all branches for this business
            shopInventories: {
              where: { businessId: businessId },
              select: {
                id: true,
                shopId: true,
                stock: true,
                lowStockAlert: true,
              }
            },

            // Fetch images from isolated VariantImage table
            images: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                imageUrl: true,
                imageKey: true,
                isPrimary: true,
              },
            },

            // Resolve many-to-many options link
            variantOptions: {
              select: {
                attributeValue: {
                  select: {
                    id: true,
                    value: true, 
                    attribute: {
                      select: {
                        id: true,
                        name: true, 
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Frontend Shape Transformer 
    const transformedProducts = products.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => {
        // Flatten the relation: variantOptions -> attributeValue -> attribute
        const flattenedOptions = variant.variantOptions.map((vo) => ({
          attributeId: vo.attributeValue.attribute.id,
          attributeName: vo.attributeValue.attribute.name,
          valueId: vo.attributeValue.id,
          value: vo.attributeValue.value,
        }));

        // Find the primary image or fall back to the first available one
        const primaryImage = variant.images.find((img) => img.isPrimary) || variant.images[0] || null;

        // 🟢 AGGREGATION: Calculate total combined stock across all branches for this catalog layout
        const totalStock = variant.shopInventories.reduce((acc, current) => acc + current.stock, 0);

        // Fallback or use alert configs from inventories (taking the highest or first available config)
        const lowStockAlertFallback = variant.shopInventories[0]?.lowStockAlert ?? 0;

        return {
          id: variant.id,
          productId: variant.productId,
          sku: variant.sku,
          barcode: variant.barcode,

          price: variant.price, 
          costPrice: variant.costPrice,
          isActive: variant.isActive,
          sortOrder: variant.sortOrder,

          stock: totalStock, 
          lowStockAlert: lowStockAlertFallback,
          shopInventories: variant.shopInventories,

          weight: variant.weight,
          length: variant.length,
          height: variant.height,
          width: variant.width,
          
          images: variant.images,
          variantOptions: flattenedOptions, 
          primaryImage: primaryImage,
          imageUrl: primaryImage ? primaryImage.imageUrl : null, 
        }; 
      }),
    })) as Product[];

    return { 
      success: true, 
      data: transformedProducts, 
      status: 200 
    } as unknown as AppResponse;

  } catch (error: unknown) {
    console.error("GET_ALL_PRODUCTS_ERROR:", error);
    return { success: false, error: "Internal Server Error", status: 500 } as AppResponse;
  }
}


// GET SINGLE PRODUCT BY ID - WITH EXACT SAME MATRIX TRANSFORMATIONS
static async getProductByIdService(productId: string, businessId: string): Promise<AppResponse> {
  try {
    // 1. Fetch targeted Single Product with full multi-tenant relations
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        businessId: businessId, // Multi-tenant guardrail checkpoint
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },

        // ── VARIANT RELATION FETCH ─────────────────
        variants: {
          where: { isDeleted: false }, 
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            productId: true,
            sku: true,
            barcode: true,
            price: true,     
            costPrice: true,
            isActive: true,
            sortOrder: true,
            weight:true,
            length:true,
            height: true,
            width:true,

            // Fetch stock levels assigned across all branches for this business
            shopInventories: {
              where: { businessId: businessId },
              select: {
                id: true,
                shopId: true,
                stock: true,
                lowStockAlert: true,
              }
            },

            // Fetch images from isolated VariantImage table
            images: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                imageUrl: true,
                imageKey: true,
                isPrimary: true,
              },
            },

            // Resolve many-to-many options link
            variantOptions: {
              select: {
                attributeValue: {
                  select: {
                    id: true,
                    value: true, 
                    attribute: {
                      select: {
                        id: true,
                        name: true, 
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }
    });

    // Handle structural record absence immediately
    if (!product || product.isDeleted) {
      return { success: false, error: "Product node not found.", status: 404 } as AppResponse;
    }

    // 2. Exact Same Frontend Shape Transformer (run against the single product)
    const transformedVariants = product.variants.map((variant) => {
      // Flatten the relation: variantOptions -> attributeValue -> attribute
      const flattenedOptions = variant.variantOptions.map((vo) => ({
        attributeId: vo.attributeValue.attribute.id,
        attributeName: vo.attributeValue.attribute.name,
        valueId: vo.attributeValue.id,
        value: vo.attributeValue.value,
      }));

      // Find the primary image or fall back to the first available one
      const primaryImage = variant.images.find((img) => img.isPrimary) || variant.images[0] || null;

      // AGGREGATION: Calculate total combined stock across branches
      const totalStock = variant.shopInventories.reduce((acc, current) => acc + current.stock, 0);

      // Fallback or use alert configs from inventories
      const lowStockAlertFallback = variant.shopInventories[0]?.lowStockAlert ?? 0;

      return {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        barcode: variant.barcode,

        price: variant.price, 
        costPrice: variant.costPrice,
        isActive: variant.isActive,
        sortOrder: variant.sortOrder,

        stock: totalStock, 
        lowStockAlert: lowStockAlertFallback,
        shopInventories: variant.shopInventories,

        weight: variant.weight,
        length: variant.length,
        height: variant.height,
        width: variant.width,
        
        images: variant.images,
        variantOptions: flattenedOptions, 
        primaryImage: primaryImage,
        imageUrl: primaryImage ? primaryImage.imageUrl : null, 
      }; 
    });

    const transformedProduct = {
      ...product,
      variants: transformedVariants
    } as Product;

    return { 
      success: true, 
      data: transformedProduct, 
      status: 200 
    } as unknown as AppResponse;

  } catch (error: unknown) {
    console.error("GET_PRODUCT_BY_ID_ERROR:", error);
    return { success: false, error: "Internal Server Error", status: 500 } as AppResponse;
  }
}


//GET ALL PRODUCT VIA PRODUCT-VARIANT
static async getAllProductVariantsService(businessId: string) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        isDeleted: false,
        product: {
          businessId: businessId, // Scopes safely to tenant
          isDeleted: false,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            hasVariant: true,
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
          },
        },
        // 🟢 NEW: Fetch the branch-specific stocks to calculate aggregates
        shopInventories: {
          where: { businessId: businessId },
          select: {
            id: true,
            shopId: true,
            stock: true,
            lowStockAlert: true,
          }
        },
        images: {
          orderBy: {
            sortOrder: "asc", 
          },
          select: {
            id: true,
            imageUrl: true,
            imageKey: true,
            isPrimary: true,
          },
        },
        variantOptions: {
          select: {
            attributeValue: {
              select: {
                id: true,
                value: true,
                attribute: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: "asc", 
      },
    });

    // Flattening layer
    const transformedVariants = variants.map((variant) => {
      const options = variant.variantOptions.map((vo) => ({
        attributeId: vo.attributeValue.attribute.id,
        attributeName: vo.attributeValue.attribute.name,
        valueId: vo.attributeValue.id,
        value: vo.attributeValue.value,
      }));

      const optionString = options.map((o) => o.value).join(" - ");
      const displayName = optionString 
        ? `${variant.product.name} (${optionString})` 
        : variant.product.name;

      const primaryImage = variant.images.find((img) => img.isPrimary) || variant.images[0] || null;

      // 🟢 AGGREGATION FIX: Calculate cross-branch totals dynamically
      const totalStock = variant.shopInventories.reduce((acc, current) => acc + current.stock, 0);
      const lowStockAlertFallback = variant.shopInventories[0]?.lowStockAlert ?? 0;

      return {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        barcode: variant.barcode,
        price: Number(variant.price), 
        costPrice: Number(variant.costPrice),
        
        // 🟢 FIXED PROPERTIES: Maps aggregate totals seamlessly back to your frontend type layout
        stock: totalStock,
        lowStockAlert: lowStockAlertFallback,
        shopInventories: variant.shopInventories, 
        
        isActive: variant.isActive,
        weight: variant.weight ? Number(variant.weight) : null,
        length: variant.length ? Number(variant.length) : null,
        height: variant.height ? Number(variant.height) : null,
        width: variant.width ? Number(variant.width) : null,
        
        productName: variant.product.name,
        displayName: displayName, 
        description: variant.product.description,
        category: variant.product.category,
        brand: variant.product.brand,
        hasMultipleVariants: variant.product.hasVariant,

        options: options,
        imageUrl: primaryImage ? primaryImage.imageUrl : null,
        images: variant.images,
        createdAt: variant.createdAt,
        sortOrder: variant.sortOrder
      }; 
    });

    return { 
      success: true, 
      data: transformedVariants as unknown as ProductsVariants[], 
      status: 200 
    } as AppResponse;

  } catch (error: unknown) {
    console.error("GET_ALL_PRODUCT_VARIANTS_ERROR:", error);
    return { error: "Internal Server Error", success: false, status: 500 } as AppResponse;
  }
}


// GET ALL PRODUCTS FOR A SPECIFIC SHOP'S POS TERMINAL
static async getShopProductsForPOS(businessId: string, shopId: string): Promise<AppResponse> {
  try {
    // 1. Query from the perspective of the target shop's localized shelves
    const shopProducts = await prisma.product.findMany({
      where: {
        businessId: businessId,
        isDeleted: false,
        isActive: true, // Only display sellable products in the POS terminal
        variants: {
          some: {
            isDeleted: false,
            isActive: true,
            // Ensure the variant is assigned to this shop's layout profile
            shopInventories: {
              some: { shopId: shopId }
            }
          }
        }
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },

        // ── FETCH ONLY THE VARIANTS WITH THEIR LOCAL QUANTITIES ──
        variants: {
          where: { 
            isDeleted: false,
            isActive: true,
          },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            productId: true,
            sku: true,
            barcode: true,
            price: true,     
            costPrice: true,
            isActive: true,
            sortOrder: true,

            // 🟢 Target ONLY this exact shop's storage row
            shopInventories: {
              where: { shopId: shopId },
              select: {
                id: true,
                stock: true,
                lowStockAlert: true,
              }
            },

            images: {
              orderBy: { sortOrder: 'asc' },
              where: { isPrimary: true }, // Optimization: POS grid usually only needs the primary thumbnail
              select: { id: true, imageUrl: true },
            },

            variantOptions: {
              select: {
                attributeValue: {
                  select: {
                    id: true,
                    value: true, 
                    attribute: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' } // Alphabetical order is typically preferred for fast cash grid scanning
    });

    // 2. Flatten and transform directly for the terminal grid components
    const posTerminalProducts = shopProducts.map((product) => {
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        hasVariant: product.hasVariant,
        category: product.category,
        brand: product.brand,
        
        // Map child variations
        variants: product.variants.map((variant) => {
          const flattenedOptions = variant.variantOptions.map((vo) => ({
            attributeName: vo.attributeValue.attribute.name,
            value: vo.attributeValue.value,
          }));

          // Pull local shelf storage values
          const localInventory = variant.shopInventories[0];
          const localStock = localInventory ? localInventory.stock : 0;
          const localAlert = localInventory ? localInventory.lowStockAlert : 0;

          return {
            id: variant.id,
            sku: variant.sku,
            barcode: variant.barcode,
            price: Number(variant.price), // Essential for processing sales totals math safely 
            costPrice: Number(variant.costPrice),
            
            // 🟢 CRITICAL: This is strictly this shop's local stock count!
            stock: localStock, 
            lowStockAlert: localAlert,
            
            variantOptions: flattenedOptions,
            imageUrl: variant.images[0]?.imageUrl || null,
          };
        })
        // 🟢 OPTIONAL FILTER: If you want to completely hide out-of-stock items 
        // from the cash register layout screen, uncomment the filter line below:
        // .filter(v => v.stock > 0)
      };
    });

    return { 
      success: true, 
      data: posTerminalProducts, 
      status: 200 
    } as unknown as AppResponse;

  } catch (error: unknown) {
    console.error("POS_SHOP_PRODUCTS_FETCH_ERROR:", error);
    return { success: false, error: "Internal Server Error", status: 500 } as AppResponse;
  }
}



static async getProductVariantsServiceQueryFilters(filters: ProductVariantQueryFilters): Promise<AppResponse> {
  try {
    const { businessId, shopId, categoryId, isActive } = filters;

    const variants = await prisma.productVariant.findMany({
      where: {
        isDeleted: false,
        ...(isActive !== undefined && { isActive }),
        product: {
          businessId: businessId, // Strict multi-tenant guard
          isDeleted: false,
          ...(categoryId && { categoryId }),
        },
        // 🟢 If a shopId is provided, enforce that the variant has a footprint in that branch
        ...(shopId && {
          shopInventories: {
            some: { shopId },
          },
        }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            hasVariant: true,
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
          },
        },
        // 🟢 Conditional Relation Fetching:
        // If shopId is passed, load ONLY that shop's numbers. If undefined, pull all of them.
        shopInventories: {
          where: {
            businessId: businessId,
            ...(shopId && { shopId }),
          },
          select: {
            id: true,
            shopId: true,
            stock: true,
            lowStockAlert: true,
            shop: { select: { name: true } } // Handy for multi-branch layouts
          }
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, imageUrl: true, imageKey: true, isPrimary: true },
        },
        variantOptions: {
          select: {
            attributeValue: {
              select: {
                id: true,
                value: true,
                attribute: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // ── SMART FLATTENING LAYER ──────────────────────────────────
    const transformedVariants = variants.map((variant) => {
      const options = variant.variantOptions.map((vo) => ({
        attributeId: vo.attributeValue.attribute.id,
        attributeName: vo.attributeValue.attribute.name,
        valueId: vo.attributeValue.id,
        value: vo.attributeValue.value,
      }));

      const optionString = options.map((o) => o.value).join(" - ");
      const displayName = optionString 
        ? `${variant.product.name} (${optionString})` 
        : variant.product.name;

      const primaryImage = variant.images.find((img) => img.isPrimary) || variant.images[0] || null;

      // 🟢 DYNAMIC AGGREGATION LOOKUP:
      // If scoped to a shop, 'stock' represents that shop's level.
      // If global (no shopId), 'stock' sums up the entire business pool.
      const stock = shopId 
        ? (variant.shopInventories[0]?.stock ?? 0)
        : variant.shopInventories.reduce((acc, curr) => acc + curr.stock, 0);

      const lowStockAlert = shopId
        ? (variant.shopInventories[0]?.lowStockAlert ?? 0)
        : (variant.shopInventories[0]?.lowStockAlert ?? 0);

      return {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        barcode: variant.barcode,
        price: Number(variant.price), 
        costPrice: Number(variant.costPrice),
        
        stock,
        lowStockAlert,
        shopInventories: variant.shopInventories, 
        
        isActive: variant.isActive,
        productName: variant.product.name,
        displayName: displayName, 
        description: variant.product.description,
        category: variant.product.category,
        brand: variant.product.brand,
        hasMultipleVariants: variant.product.hasVariant,
        options: options,
        imageUrl: primaryImage ? primaryImage.imageUrl : null,
        images: variant.images,
        createdAt: variant.createdAt,
      }; 
    });

    return { 
      success: true, 
      data: transformedVariants, 
      status: 200 
    } as AppResponse;

  } catch (error: unknown) {
    console.error("GET_PRODUCT_VARIANTS_FILTER_ERROR:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error", 
      status: 500 
    } as AppResponse;
  }
}


// GET ALL PRODUCTS SCOPED TO A SPECIFIC SHOP LOCATION
static async getShopProductVariantsService(businessId: string, shopId: string) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        isDeleted: false,
        product: {
          businessId: businessId, // Tenant guard-rail boundary
          isDeleted: false,
        },
        // 🟢 ONLY fetch variants that have a footprint initialized in this specific shop
        shopInventories: {
          some: {
            shopId: shopId,
          }
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            hasVariant: true,
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
          },
        },
        // 🟢 FILTER IN DATABASE: Only return the inventory metrics line for this shop
        shopInventories: {
          where: { 
            shopId: shopId,
            businessId: businessId 
          },
          select: {
            id: true,
            shopId: true,
            stock: true,
            lowStockAlert: true,
          }
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            imageUrl: true,
            imageKey: true,
            isPrimary: true,
          },
        },
        variantOptions: {
          select: {
            attributeValue: {
              select: {
                id: true,
                value: true,
                attribute: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Flattening layer tailored for the target shop outlet
    const transformedVariants = variants.map((variant) => {
      const options = variant.variantOptions.map((vo) => ({
        attributeId: vo.attributeValue.attribute.id,
        attributeName: vo.attributeValue.attribute.name,
        valueId: vo.attributeValue.id,
        value: vo.attributeValue.value,
      }));

      const optionString = options.map((o) => o.value).join(" - ");
      const displayName = optionString 
        ? `${variant.product.name} (${optionString})` 
        : variant.product.name;

      const primaryImage = variant.images.find((img) => img.isPrimary) || variant.images[0] || null;

      // 🟢 TARGETED MAPPING: Since we filtered by shopId above, this array will have exactly 1 or 0 records.
      const shopTargetInventory = variant.shopInventories[0];
      const currentShopStock = shopTargetInventory ? shopTargetInventory.stock : 0;
      const currentShopAlertThreshold = shopTargetInventory ? shopTargetInventory.lowStockAlert : 0;

      return {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        barcode: variant.barcode,
        price: Number(variant.price), 
        costPrice: Number(variant.costPrice),
        
        // 🟢 SINGLE SHOP TARGET METRICS MAP:
        stock: currentShopStock,
        lowStockAlert: currentShopAlertThreshold,
        shopInventories: variant.shopInventories, 
        
        isActive: variant.isActive,
        weight: variant.weight ? Number(variant.weight) : null,
        length: variant.length ? Number(variant.length) : null,
        height: variant.height ? Number(variant.height) : null,
        width: variant.width ? Number(variant.width) : null,
        
        productName: variant.product.name,
        displayName: displayName, 
        description: variant.product.description,
        category: variant.product.category,
        brand: variant.product.brand,
        hasMultipleVariants: variant.product.hasVariant,

        options: options,
        imageUrl: primaryImage ? primaryImage.imageUrl : null,
        images: variant.images,
        createdAt: variant.createdAt,
        sortOrder: variant.sortOrder
      }; 
    });

    return { 
      success: true, 
      data: transformedVariants, 
      status: 200 
    };

  } catch (error: unknown) {
    console.error("GET_SHOP_PRODUCT_VARIANTS_ERROR:", error);
    return { error: "Internal Server Error", success: false, status: 500 };
  }
}

static async updateProductService(
  productId: string,
  data: EditProductFormValue,
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {
    // Validate form inputs against your updated nested branch inventory schema
    const validatedData = editProductSchema.parse(data);

    // 1. Fetch current database snapshot for comparison (including ALL related shop inventories)
    const currentProduct = await prisma.product.findFirst({
      where: { id: productId, businessId, isDeleted: false },
      include: {
        variants: {
          where: { isDeleted: false },
          include: {
            images: true,
            shopInventories: true, // Pulls inventory levels from all branches
            variantOptions: {
              include: {
                attributeValue: {
                  include: { attribute: true }
                }
              }
            }
          },
        },
      },
    });

    if (!currentProduct) {
      return { error: "Product not found or access denied.", success: false, status: 404 };
    }

    // 2. SKU Uniqueness Verification across the business
    const cleanSkus = validatedData.variants.map((v) => v.sku.trim()).filter(Boolean);
    if (cleanSkus.length > 0) {
      const duplicateSkusCheck = await prisma.productVariant.findMany({
        where: {
          sku: { in: cleanSkus },
          product: { businessId },
          isDeleted: false,
          NOT: { productId: productId }, 
        },
        select: { sku: true },
      });

      if (duplicateSkusCheck.length > 0) {
        const structuralDups = duplicateSkusCheck.map((v) => v.sku).join(", ");
        return {
          error: `These SKUs already exist on other products within your inventory: ${structuralDups}`,
          success: false,
          status: 400,
        };
      }
    }

    const oldFileKeysToDelete: string[] = [];

    // 3. EXECUTE TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      
      // ── STEP A: Update Parent Base Product ──
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          baseSku: validatedData.baseSku.trim().toUpperCase(),
          hasVariant: validatedData.hasVariant,
          isActive: validatedData.isActive,
          categoryId: validatedData.categoryId,
          brandId: validatedData.brandId,
        },
      });

      const attributeValueMap: Record<string, string> = {};

      // ── STEP B: Upsert Variant Attributes & Values ──
      if (validatedData.hasVariant && validatedData.attributes && validatedData.attributes.length > 0) {
        for (const attrRule of validatedData.attributes) {
          if (!attrRule.name) continue;

          const attributeGroup = await tx.variantAttribute.upsert({
            where: {
              businessId_name: {
                businessId: businessId,
                name: attrRule.name.trim(),
              },
            },
            update: { sortOrder: attrRule.sortOrder || 0 },
            create: {
              name: attrRule.name.trim(),
              businessId,
              sortOrder: attrRule.sortOrder || 0,
            },
          });

          const tagsArray = attrRule.matrixSplitValues
            ? attrRule.matrixSplitValues.split(",").map((v) => v.trim()).filter(Boolean)
            : [];

          for (const tagValue of tagsArray) {
            const valueRecord = await tx.variantAttributeValue.upsert({
              where: {
                attributeId_value: {
                  attributeId: attributeGroup.id,
                  value: tagValue,
                },
              },
              update: {},
              create: {
                attributeId: attributeGroup.id,
                value: tagValue,
              },
            });

            const compositeKey = `${attributeGroup.name}:${tagValue}`;
            attributeValueMap[compositeKey] = valueRecord.id;
          }
        }
      }

      // ── STEP C: Process Variant Synchronization Loop ──
      const processedVariantIds: string[] = [];
      const currentVariantMap = new Map(currentProduct.variants.map((v) => [v.id, v]));

      for (const variantData of validatedData.variants) {
        const isExisting = variantData.id && currentVariantMap.has(variantData.id);
        const matchVariant = isExisting ? currentVariantMap.get(variantData.id!) : null;

        if (matchVariant?.images?.[0]) {
          const mainImg = matchVariant.images.find(i => i.isPrimary) || matchVariant.images[0];
          if (variantData.fileKey && mainImg?.imageKey && variantData.fileKey !== mainImg.imageKey) {
            oldFileKeysToDelete.push(mainImg.imageKey);
          }
        }

        // Global properties (Prisma Decimals expect strings or floats)
        const variantPayload = {
          sku: variantData.sku.trim(),
          barcode: variantData.barcode,
          price: variantData.price,
          costPrice: variantData.costPrice,
          weight: variantData.weight ?? null,
          length: variantData.length ?? null,
          width: variantData.width ?? null,
          height: variantData.height ?? null,
          sortOrder: variantData.sortOrder || 0,
          isActive: variantData.isActive,
        };

        let activeVariantId: string;

        if (matchVariant) {
          const updatedVar = await tx.productVariant.update({
            where: { id: matchVariant.id },
            data: variantPayload,
          });
          activeVariantId = updatedVar.id;
          processedVariantIds.push(activeVariantId);
          
          await tx.productVariantOption.deleteMany({
            where: { variantId: activeVariantId }
          });
        } else {
          const createdVar = await tx.productVariant.create({
            data: {
              ...variantPayload,
              productId: productId,
            },
          });
          activeVariantId = createdVar.id;
          processedVariantIds.push(activeVariantId);
        }

        // ── STEP D: MULTI-BRANCH INVENTORY SYNCHRONIZATION ──
        // Track incoming shops to determine which inventory assignments to clear/retain
        const dynamicShopIdsPassed: string[] = [];

        if (variantData.shopInventories && variantData.shopInventories.length > 0) {
          for (const branchStock of variantData.shopInventories) {
            dynamicShopIdsPassed.push(branchStock.shopId);

            // Locate previous snapshot state for specific branch to calculate audits
            const oldBranchRecord = matchVariant?.shopInventories.find(
              (si) => si.shopId === branchStock.shopId
            );
            const initialStockLevel = oldBranchRecord ? oldBranchRecord.stock : 0;
            const deviationDelta = branchStock.stock - initialStockLevel;

            // Perform individual multi-branch upsert loops using your compound keys
            const targetedInventory = await tx.shopInventory.upsert({
              where: {
                shopId_productVariantId: {
                  shopId: branchStock.shopId,
                  productVariantId: activeVariantId,
                },
              },
              update: {
                stock: branchStock.stock,
                lowStockAlert: branchStock.lowStockAlert,
              },
              create: {
                businessId,
                shopId: branchStock.shopId,
                productVariantId: activeVariantId,
                stock: branchStock.stock,
                lowStockAlert: branchStock.lowStockAlert,
              },
            });

            if (deviationDelta !== 0) {
              // Log individual multi-branch deviation mutations safely
               const stockLogCustomIdGen = await generateNextCustomId({tx,businessId, sequenceType: "STOCK_LOG",prefix: "STLG"});
              await tx.stockLog.create({
                data: {
                  customId: stockLogCustomIdGen, 
                  productVariantId: activeVariantId,
                  shopId: branchStock.shopId,
                  shopInventoryId: targetedInventory.id,
                  employeeId,
                  businessId,
                  change: deviationDelta,
                  reason: `Stock synchronized over branch mapping array inputs during product profile revision.`,
                },
              });

              // ── LOW STOCK NOTIFICATION HOOK ──
              if (branchStock.stock <= (branchStock.lowStockAlert ?? 0)) {
                const recipientIds = await NotificationService.getRecipientIdsByRoles(
                  businessId,
                  ["OWNER", "ADMIN", "MANAGER"],
                  // employeeId // Exclude the user performing the update
                );

                if (recipientIds.length > 0) {
                  await NotificationService.createManyInTx(tx, recipientIds, {
                    businessId,
                    shopId: branchStock.shopId,
                    title: "Low Stock Warning",
                    message: `SKU '${variantData.sku}' is running low at branch. Current stock: ${branchStock.stock} (Threshold: ${branchStock.lowStockAlert}).`,
                    category: NotificationCategory.STOCK_ALERT,
                    priority: NotificationPriority.HIGH,
                    channel: NotificationChannel.IN_APP,
                  });
                }
              }
            }
          }
        }

        // Clean up text adjustments images mapping pipelines
        // 1. Locate the current variant's primary image from your initial query snapshot
        const existingPrimaryImage = matchVariant?.images?.find((img) => img.isPrimary) || matchVariant?.images?.[0];

        if (variantData.imageUrl) {
          // 2. Optimization: Only touch database rows if the image reference changed
          const hasImageChanged = !existingPrimaryImage || existingPrimaryImage.imageUrl !== variantData.imageUrl;
          if (hasImageChanged) {
            // Drop old image link reference safely
            await tx.variantImage.deleteMany({ 
              where: { variantId: activeVariantId } 
            });
            // Instantiate brand-new mapping matrix row
            await tx.variantImage.create({
              data: {
                variantId: activeVariantId,
                imageUrl: variantData.imageUrl,
                imageKey: variantData.fileKey || null,
                isPrimary: true,
              },
            });
          }
        } else {
          // 3. User manually stripped image in the panel interface - clear records
          if (existingPrimaryImage) {
            await tx.variantImage.deleteMany({ 
              where: { variantId: activeVariantId } 
            });
            if (existingPrimaryImage.imageKey) {
              oldFileKeysToDelete.push(existingPrimaryImage.imageKey);
            }
          }
        }

        if (validatedData.hasVariant && variantData.options && variantData.options.length > 0) {
          const junctionEntries = variantData.options
            .map((opt) => {
              const compositeKey = `${opt.attributeName}:${opt.value}`;
              const valId = attributeValueMap[compositeKey];
              return valId ? { variantId: activeVariantId, attributeValueId: valId } : null;
            })
            .filter(Boolean) as { variantId: string; attributeValueId: string }[];

          if (junctionEntries.length > 0) {
            await tx.productVariantOption.createMany({ data: junctionEntries });
          }
        }
      }

      // ── STEP E: Handle Removal Cascade via Soft Deletes ──
      const activeDbVariantIds = currentProduct.variants.map((v) => v.id);
      const omittedVariantIds = activeDbVariantIds.filter((id) => !processedVariantIds.includes(id));

      if (omittedVariantIds.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: omittedVariantIds } },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        // Cascade delete stock assignments for removed variants across all locations
        await tx.shopInventory.deleteMany({
          where: { productVariantId: { in: omittedVariantIds } }
        });
      }

      // ── STEP F: Log Audit Tracking History ──
      await tx.auditLog.create({
        data: {
          action: "UPDATE_PRODUCT_WITH_VARIANTS",
          entity: "PRODUCT",
          entityId: productId,
          userId,
          businessId,
          newValue: `Synchronized product attributes alongside nested cross-branch arrays for (${processedVariantIds.length}) active structural variants.`,
        },
      });

      return updatedProduct;
    });

    if (oldFileKeysToDelete.length > 0) {
      for (const storageKey of oldFileKeysToDelete) {
        try {
          // await deleteUTFile(storageKey);
        } catch (fileErr) {
          console.error(`Non-blocking issue cleaning asset: ${storageKey}`, fileErr);
        }
      }
    }

    return { 
      success: true, 
      message: "Inventory record matrices reconciled successfully.", 
      data: result, 
      status: 200 
    };

  } catch (error: unknown) {
    console.error("CRITICAL_PRODUCT_MUTATION_SYNC_ERROR:", error);
    return {
      error: (error as Error).message || "An unresolved exception blocked updating records data structures transaction sets.",
      success: false,
      status: 500,
    };
  }
}

//SOFT DELETE PRODUCT
static async softDeleteSingleProduct(
  productId: string, 
  userId: string, 
  employeeId: string, 
  businessId: string
) {
  try {
    // 1. Fetch the parent product along with variants AND all multi-branch active inventories
    const currentProduct = await prisma.product.findFirst({
      where: { 
        id: productId, 
        businessId: businessId, 
        isDeleted: false 
      },
      include: {
        variants: {
          where: { isDeleted: false },
          include: {
            shopInventories: true // Pulls stock from all active shop locations
          }
        }
      }
    });

    if (!currentProduct) {
      return { error: "Product not found or has already been removed.", success: false, status: 404 };
    }

    // 2. START ISOLATED TRANSACTION
    await prisma.$transaction(async (tx) => {
      
      // ── STEP A: Reconcile Inventory Ledgers Per Variant, Per Shop ──
      for (const variant of currentProduct.variants) {
        for (const inventory of variant.shopInventories) {
          if (inventory.stock > 0) {
            // Log individual deduction per store branch location context
            const stockLogCustomIdGen = await generateNextCustomId({tx,businessId, sequenceType: "STOCK_LOG",prefix: "STLG"});
            await tx.stockLog.create({
              data: {
                customId: stockLogCustomIdGen,
                productVariantId: variant.id,
                shopId: inventory.shopId,
                shopInventoryId: inventory.id,
                employeeId: employeeId,
                businessId: businessId,
                change: -inventory.stock, // Zero out the remaining branch stock balances
                reason: `Parent product soft-deleted. Clearing active ledger stock for branch location. SKU: ${variant.sku}`,
              }
            });

            // 2. DISPATCH DISCONTINUATION/DELETION NOTIFICATION TO MANAGEMENT
            const recipientIds = await NotificationService.getRecipientIdsByRoles(
              businessId,
              ["OWNER", "ADMIN", "MANAGER"],
              employeeId
            );

            if (recipientIds.length > 0) {
            await NotificationService.createManyInTx(tx, recipientIds, {
              businessId,
              shopId: inventory.shopId,
              title: "Product Discontinued & Stock Purged",
              message: `Product SKU '${variant.sku}' was deleted. ${inventory.stock} active units were cleared from branch inventory.`,
              category: NotificationCategory.SYSTEM, // Fits structural/catalog changes best from your schema
              priority: NotificationPriority.HIGH,
              channel: NotificationChannel.IN_APP,
            });
          }
                    }
        }

        // Clean slate: Remove or purge the mapping pivot records for this variant across branches
        // This ensures ghost stock data doesn't skew localized store queries later
        await tx.shopInventory.deleteMany({
          where: { productVariantId: variant.id }
        });
      }

      // ── STEP B: Soft-delete Child Matrix Variants ──
      await tx.productVariant.updateMany({
        where: { 
          productId: productId, 
          isDeleted: false 
        },
        data: { 
          isDeleted: true, 
          deletedAt: new Date() 
        }
      });

      // ── STEP C: Soft-delete the Parent Product ──
      const deletedProduct = await tx.product.update({
        where: { 
          id: productId, 
          businessId: businessId 
        },
        data: { 
          isDeleted: true, 
          deletedAt: new Date(),
        }
      });

      // ── STEP D: Record Operational Tenant Audits ──
      await tx.auditLog.create({
        data: {
          action: "SOFT_DELETE_PRODUCT_WITH_VARIANTS",
          entity: "PRODUCT",
          entityId: productId,
          userId: userId,
          businessId: businessId,
          newValue: `Soft-deleted product "${deletedProduct.name}" along with (${currentProduct.variants.length}) associated multi-branch variations.`
        }
      });
    });

    return { 
      success: true, 
      message: `Product and its multi-branch variations were successfully marked as deleted.`, 
      status: 200 
    };

  } catch (error: unknown) {
    console.error("PRODUCT_SOFT_DELETE_ERROR:", error);
    
    // Safety guard for Prisma Foreign Key constraint checks (P2003)
    if (error instanceof Error && 'code' in error && error.code === 'P2003') {
      return { 
        error: "This item cannot be modified due to dependencies across your historical transactions records.", 
        success: false, 
        status: 400 
      };
    }

    return { 
      error: "An unexpected database exception blocked the soft-deletion process.", 
      success: false, 
      status: 500 
    };
  }
}


//SOFT DELETE VARIANT
static async softDeleteSingleVariant(
  variantId: string,
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {
    if (!variantId) {
      return { error: "Variant ID is required", success: false, status: 400 };
    }

    // 1. Fetch the targeted variant with all cross-branch shop inventories and its siblings
    const variantToKill = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        isDeleted: false,
        product: { businessId: businessId }, // Multi-tenant verification
      },
      include: {
        shopInventories: true, // 🟢 ADDED: Pull location stock entries to process zeroing metrics
        product: {
          include: {
            variants: { where: { isDeleted: false } }, 
          },
        },
      },
    });

    if (!variantToKill) {
      return { error: "Variant not found or already deleted.", success: false, status: 404 };
    }

    const parentProduct = variantToKill.product;

    // 2. START ISOLATED TRANSACTION
    await prisma.$transaction(async (tx) => {
      
      // ── STEP A: Reconcile Ledger Balance Per Shop Location for this specific SKU ──
      for (const inventory of variantToKill.shopInventories) {
        if (inventory.stock > 0) {
          const stockLogCustomIdGen = await generateNextCustomId({tx,businessId, sequenceType: "STOCK_LOG",prefix: "STLG"});
          await tx.stockLog.create({
            data: {
              customId: stockLogCustomIdGen,
              productVariantId: variantToKill.id,
              shopId: inventory.shopId, // Contextual branch routing
              shopInventoryId: inventory.id,
              employeeId: employeeId,
              businessId: businessId,
              change: -inventory.stock, // Zero out inventory balance at this specific branch
              reason: `Variant SKU: ${variantToKill.sku} individually soft-deleted. Clearing active ledger stock at branch.`,
            },
          });
          // ── DISPATCH VARIANT DELETION/PURGE NOTIFICATION TO MANAGEMENT ──
          const recipientIds = await NotificationService.getRecipientIdsByRoles(
            businessId,
            ["OWNER", "ADMIN", "MANAGER"],
            employeeId
          );

          if (recipientIds.length > 0) {
            await NotificationService.createManyInTx(tx, recipientIds, {
              businessId,
              shopId: inventory.shopId,
              title: "Variant Discontinued & Stock Purged",
              message: `Variant SKU '${variantToKill.sku}' was deleted. ${inventory.stock} active units were cleared from branch inventory.`,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.HIGH,
              channel: NotificationChannel.IN_APP,
            });
          }
  
        }
      }

      // Hard-delete the shop inventory records to safely clear location query projections
      await tx.shopInventory.deleteMany({
        where: { productVariantId: variantId }
      });

      // ── STEP B: Soft-delete this specific variant ──
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // ── STEP C: Edge-Case Handling (The Last Variant Check) ──
      // If this variant was the ONLY active variant left, soft-delete the parent product too.
      const remainingVariantsCount = parentProduct.variants.filter(v => v.id !== variantId).length;

      if (remainingVariantsCount === 0) {
        await tx.product.update({
          where: { id: parentProduct.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        // Log parent deletion audit alongside variant
        await tx.auditLog.create({
          data: {
            action: "SOFT_DELETE_PRODUCT_WITH_VARIANTS",
            entity: "PRODUCT",
            entityId: parentProduct.id,
            userId: userId,
            businessId: businessId,
            newValue: `Automatically soft-deleted parent product "${parentProduct.name}" because its last remaining variation SKU (${variantToKill.sku}) was deleted.`,
          },
        });
      }

      // ── STEP D: Create System Audit Log for the Variant Removal ──
      await tx.auditLog.create({
        data: {
          action: "SOFT_DELETE_VARIANT",
          entity: "PRODUCT_VARIANT",
          entityId: variantId,
          userId: userId,
          businessId: businessId,
          newValue: `Soft-deleted variant SKU: ${variantToKill.sku} from product: ${parentProduct.name}.`,
        },
      });
    });

    return {
      success: true,
      message: `Variant SKU "${variantToKill.sku}" was successfully removed across all branch balances.`,
      status: 200,
    };

  } catch (error: unknown) {
    console.error("VARIANT_SOFT_DELETE_ERROR:", error);

    if (error instanceof Error && 'code' in error && error.code === 'P2003') {
      return {
        error: "This variant has existing historical sales records. Deactivate it instead of deleting it to protect transactional integrity.",
        success: false,
        status: 400,
      };
    }

    return {
      error: "An internal server error occurred while deleting the variation.",
      success: false,
      status: 500,
    };
  }
}


// SOFT BULK- PRODUCT DELETE SERVICE
static async softDeleteBulkProducts(
  ids: string[], 
  userId: string, 
  employeeId: string,
  businessId: string, 
  businessSlug: string 
) {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: "No product IDs provided.", status: 400 };
    }

    // 1. Fetch targeted products along with ALL their active variants and branch allocations
    const productsToSoftDelete = await prisma.product.findMany({
      where: { 
        id: { in: ids }, 
        businessId: businessId,
        isDeleted: false
      },
      include: {
        variants: {
          where: { isDeleted: false },
          include: {
            shopInventories: true // 🟢 INCLUDED: Fetch multi-branch quantities for audit tracking
          }
        }
      }
    });

    if (productsToSoftDelete.length === 0) {
      return { success: false, error: "No active products found to delete.", status: 404 };
    }

    // 2. DATABASE TRANSACTION (Keeps ledger balances and status updates completely atomic)
    await prisma.$transaction(async (tx) => {
      
      const dynamicStockLogs: {
        productVariantId: string;
        shopId: string;
        shopInventoryId: string;
        employeeId: string;
        businessId: string;
        change: number;
        reason: string;
      }[] = [];

      const activeVariantIdsToClear: string[] = [];

      // A. Scan through all variants and their shop inventories to construct zeroing logs arrays
      for (const product of productsToSoftDelete) {
        for (const variant of product.variants) {
          activeVariantIdsToClear.push(variant.id);
          
          for (const inventory of variant.shopInventories) {
            if (inventory.stock > 0) {
              dynamicStockLogs.push({
                productVariantId: variant.id,
                shopId: inventory.shopId, // Contextual branch routing
                shopInventoryId: inventory.id,
                employeeId: employeeId,
                businessId: businessId,
                change: -inventory.stock, // Invert balance to zero out ledger tracking per shop
                reason: `Bulk parent product soft-delete sweep - clearing active location stock for SKU: ${variant.sku}`,
              });
            }
          }
        }
      }

      // Write stock adjustments simultaneously if entries exist
      if (dynamicStockLogs.length > 0) {
        for (const dnLogs of dynamicStockLogs){
          const stockLogCustomIdGen = await generateNextCustomId({tx,businessId, sequenceType: "STOCK_LOG",prefix: "STLG"});
          await tx.stockLog.create({
            data: {
              customId: stockLogCustomIdGen,
              productVariantId: dnLogs.productVariantId,
              shopId: dnLogs.shopId,
              shopInventoryId: dnLogs.shopInventoryId,
              employeeId: dnLogs.employeeId,
              businessId: dnLogs.businessId,
              change: dnLogs.change,
              reason: dnLogs.reason,
            },
          });

          // ── DISPATCH BULK PURGE NOTIFICATIONS TO MANAGEMENT ──
    const recipientIds = await NotificationService.getRecipientIdsByRoles(
      businessId,
      ["OWNER", "ADMIN", "MANAGER"],
      employeeId
    );

    if (recipientIds.length > 0) {
      // Find the specific variant SKU for a cleaner notification message
      let targetSku = "Unknown SKU";
      for (const p of productsToSoftDelete) {
        const foundVar = p.variants.find(v => v.id === dnLogs.productVariantId);
        if (foundVar) {
          targetSku = foundVar.sku;
          break;
        }
      }

      await NotificationService.createManyInTx(tx, recipientIds, {
        businessId,
        shopId: dnLogs.shopId,
        title: "Bulk Product Purge & Stock Clearance",
        message: `Bulk deletion cleared ${Math.abs(dnLogs.change)} units of SKU '${targetSku}' from branch inventory.`,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.HIGH,
        channel: NotificationChannel.IN_APP,
      });
    }

        }
      }

      // B. Purge matching shop inventory pivot records across all branches simultaneously
      if (activeVariantIdsToClear.length > 0) {
        await tx.shopInventory.deleteMany({
          where: { productVariantId: { in: activeVariantIdsToClear } }
        });
      }

      // C. Soft-delete all variants tied to these products simultaneously
      await tx.productVariant.updateMany({
        where: { 
          productId: { in: ids },
          isDeleted: false 
        },
        data: { 
          isDeleted: true, 
          deletedAt: new Date() 
        }
      });

      // D. Soft-delete the Parent Products
      await tx.product.updateMany({
        where: { 
          id: { in: ids }, 
          businessId: businessId 
        },
        data: { 
          isDeleted: true, 
          deletedAt: new Date(),
        }
      });

      // E. Generate Audit Logs for operational tracking
      await tx.auditLog.createMany({
        data: productsToSoftDelete.map((product) => ({
          action: "BULK_SOFT_DELETE",
          entity: "PRODUCT",
          entityId: product.id,
          userId: userId,
          businessId: businessId,
          newValue: `Bulk soft-deleted product line "${product.name}" along with (${product.variants.length}) associated multi-branch variation SKU records.`
        })),
      });
    });

    return {
      success: true,
      message: `Successfully soft-deleted ${productsToSoftDelete.length} products and archived multi-branch stock metrics.`,
      redirectTo: `/${businessSlug}/product_list`,
      status: 200
    };

  } catch (error: unknown) {
    console.error("BULK_SOFT_DELETE_ERROR:", error);
    
    if (error instanceof Error && 'code' in error && error?.code === 'P2003') {
      return { 
        success: false, 
        error: "Database constraint protection conflict. Consider deactivating these products manually instead to safeguard transactional data history.",
        status: 400
      };
    }
    
    return { success: false, error: "An internal exception blocked archiving these items.", status: 500 };
  }
}


//SOFT DELETE VARIANT - PRODUCT
static async softDeleteBulkProductVariant(
  variantIds: string[],
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {
    if (!variantIds || variantIds.length === 0) {
      return { success: false, error: "No variant IDs provided.", status: 400 };
    }

    // 1. Fetch variants to confirm multi-tenant ownership and check distributed branch stock status
    const variantsToSoftDelete = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isDeleted: false,
        product: { businessId: businessId }, // Strict tenant scoping
      },
      select: {
        id: true,
        sku: true,
        productId: true,
        shopInventories: true, // 🟢 INCLUDED: Fetch multi-branch quantities for audit tracking
      },
    });

    if (variantsToSoftDelete.length === 0) {
      return { success: false, error: "No active variants found to delete.", status: 404 };
    }

    // Extract the unique product IDs that are affected by this variant purge
    const affectedProductIds = [...new Set(variantsToSoftDelete.map((v) => v.productId))];

    // 2. START DATABASE TRANSACTION
    await prisma.$transaction(async (tx) => {
      
      const stockLogEntries: {
        productVariantId: string;
        shopId: string;
        shopInventoryId: string;
        employeeId: string;
        businessId: string;
        change: number;
        reason: string;
      }[] = [];

      // A. Scan through all variants and their shop inventories to construct zeroing logs arrays
      for (const variant of variantsToSoftDelete) {
        for (const inventory of variant.shopInventories) {
          if (inventory.stock > 0) {
            stockLogEntries.push({
              productVariantId: variant.id,
              shopId: inventory.shopId, // Contextual branch routing
              shopInventoryId: inventory.id,
              employeeId: employeeId,
              businessId: businessId,
              change: -inventory.stock, // Zero out inventory balance at this specific branch
              reason: `Bulk variant soft-delete sweep - clearing active location stock for SKU: ${variant.sku}`,
            });
          }
        }
      }

      // Write stock adjustments simultaneously if entries exist
      if (stockLogEntries.length > 0) {
         for (const dnLogs of stockLogEntries){
          const stockLogCustomIdGen = await generateNextCustomId({tx,businessId, sequenceType: "STOCK_LOG",prefix: "STLG"});
          await tx.stockLog.create({
            data: {
              customId: stockLogCustomIdGen,
              productVariantId: dnLogs.productVariantId,
              shopId: dnLogs.shopId,
              shopInventoryId: dnLogs.shopInventoryId,
              employeeId: dnLogs.employeeId,
              businessId: dnLogs.businessId,
              change: dnLogs.change,
              reason: dnLogs.reason,
            },
          });


          // ── DISPATCH BULK VARIANT PURGE NOTIFICATION TO MANAGEMENT ──
          const recipientIds = await NotificationService.getRecipientIdsByRoles(
            businessId,
            ["OWNER", "ADMIN", "MANAGER"],
            employeeId
          );

          if (recipientIds.length > 0) {
            // Find the specific variant SKU from the fetched array
            const targetVariant = variantsToSoftDelete.find(v => v.id === dnLogs.productVariantId);
            const targetSku = targetVariant ? targetVariant.sku : "Unknown SKU";

            await NotificationService.createManyInTx(tx, recipientIds, {
              businessId,
              shopId: dnLogs.shopId,
              title: "Bulk Variant Purge & Stock Clearance",
              message: `Bulk variant deletion cleared ${Math.abs(dnLogs.change)} units of SKU '${targetSku}' from branch inventory.`,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.HIGH,
              channel: NotificationChannel.IN_APP,
            });
          }
        }
      }

      // B. Purge matching shop inventory pivot records across all branches simultaneously
      await tx.shopInventory.deleteMany({
        where: { productVariantId: { in: variantIds } }
      });

      // C. Update the targeted variants to a soft-deleted state
      await tx.productVariant.updateMany({
        where: { id: { in: variantIds } },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // D. System Audit Logs for each deleted variant SKU
      await tx.auditLog.createMany({
        data: variantsToSoftDelete.map((variant) => ({
          action: "SOFT_DELETE_VARIANT",
          entity: "PRODUCT_VARIANT",
          entityId: variant.id,
          userId: userId,
          businessId: businessId,
          newValue: `Bulk soft-deleted variant SKU: ${variant.sku}.`,
        })),
      });

      // E. Edge-Case Handling: Check for empty parent product shells
      // For every affected product, count how many active variants are left in the system
      for (const productId of affectedProductIds) {
        const remainingActiveVariantsCount = await tx.productVariant.count({
          where: {
            productId: productId,
            isDeleted: false,
          },
        });

        // If no active variants remain for this product, soft-delete the parent product too!
        if (remainingActiveVariantsCount === 0) {
          const autoDeletedProduct = await tx.product.update({
            where: { id: productId },
            data: {
              isDeleted: true,
              deletedAt: new Date(),
            },
          });

          // Log the automated parent cascade deletion audit entry
          await tx.auditLog.create({
            data: {
              action: "SOFT_DELETE_PRODUCT_WITH_VARIANTS",
              entity: "PRODUCT",
              entityId: productId,
              userId: userId,
              businessId: businessId,
              newValue: autoDeletedProduct.name,
              details: `Automatically archived parent product "${autoDeletedProduct.name}" because all of its variation matrix SKUs were soft-deleted.`
            },
          });
        }
      }
    });

    return {
      success: true,
      message: `Successfully soft-deleted ${variantsToSoftDelete.length} variations and reconciled multi-branch inventory records.`,
      status: 200,
    };

  } catch (error: unknown) {
    console.error("BULK_VARIANT_SOFT_DELETE_ERROR:", error);

    if (error instanceof Error && 'code' in error && error?.code === "P2003") {
      return {
        success: false,
        error: "Some variants are locked by active transaction histories. Consider deactivating them instead to protect data history.",
        status: 400,
      };
    }

    return { success: false, error: "An internal database exception blocked bulk archiving these items.", status: 500 };
  }
}


//SINGLE HARD - PRODUCT DELETE 
static async singleHardProductDelete(
  productId: string,
  userId: string,
  employeeId: string,
  businessId: string,
) {
  try {
    if (!productId) {
      return { error: "Product ID is required", success: false, status: 400 };
    }

    // 1. Fetch product with images to collect files for cloud cleanup
    const productToDelete = await prisma.product.findFirst({
      where: { id: productId, businessId },
      include: {
        variants: {
          include: { images: { select: { imageKey: true } } }
        }
      }
    });

    if (!productToDelete) {
      return { error: "Product not found or access denied.", status: 404, success: false };
    }

    // Extract all associated variant IDs to execute targeted dependent deletions
    const variantIds = productToDelete.variants.map((v) => v.id);

    // 2. TRANSACTION - Execute downstream purging manually
    const fileKeys = await prisma.$transaction(async (tx) => {
      
      // Step A: Audit Log entry
      await tx.auditLog.create({
        data: {
          action: "HARD_DELETE_PRODUCT",
          entity: "PRODUCT",
          entityId: productId,
          userId,
          businessId,
          newValue: productToDelete.name,
          details: `Permanently hard deleted product "${productToDelete.name}" and all of its related structural nodes.`,
        },
      });

      // ── DISPATCH HARD DELETE NOTIFICATION TO MANAGEMENT ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          employeeId // Ensure employeeId is available in scope
        );

        if (recipientIds.length > 0) {
          await NotificationService.createManyInTx(tx, recipientIds, {
            businessId,
            title: "Product Permanently Purged",
            message: `Product '${productToDelete.name}' and all associated branch variants were permanently hard-deleted from the system.`,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.URGENT, // Higher priority since hard deletes are destructive
            channel: NotificationChannel.IN_APP,
          });
        }

      if (variantIds.length > 0) {
        // 🟢 Step B1: Clear branch-distributed metrics & tracking tables first
        // Purge historical stock logs tied to these variants
        await tx.stockLog.deleteMany({ 
          where: { productVariantId: { in: variantIds } } 
        });

        // Purge distributed branch inventories tied to these variants
        await tx.shopInventory.deleteMany({ 
          where: { productVariantId: { in: variantIds } } 
        });

        // Step B2: Clear standard relational child sub-structures
        await tx.variantImage.deleteMany({ 
          where: { variantId: { in: variantIds } } 
        });
        
        await tx.productVariantOption.deleteMany({ 
          where: { variantId: { in: variantIds } } 
        });
        
        // Step B3: Safely delete the variant rows now that all child dependencies are cleared
        await tx.productVariant.deleteMany({ 
          where: { id: { in: variantIds } } 
        });
      }

      // Step C: Delete the Parent Product row
      await tx.product.delete({ where: { id: productId } });

      // Step D: Extract files to delete from cloud storage
      const imagesToClear = productToDelete.variants
        .flatMap(v => v.images.map(img => img.imageKey))
        .filter(Boolean);
        
      return [...new Set(imagesToClear)] as string[];
    });

    // 3. Post-transaction asset cleanup
    if (fileKeys.length > 0) {
      // Replace with your preferred utility implementation (e.g., deleteUTFile)
      await Promise.allSettled(fileKeys.map(key => deleteUTFile(key)));
    }

    return { success: true, message: "Product and structural sub-nodes completely purged.", status: 200 };

  } catch (error: unknown) {
    console.error("HARD_DELETE_PRODUCT_ERROR:", error);
    
    if (error instanceof Error && 'code' in error && error?.code === "P2003") {
      return { 
        success: false, 
        error: "Cannot hard delete an item containing active sales or transaction history. Soft delete or archive it instead to keep financials intact.", 
        status: 400 
      };
    }
    
    return { success: false, error: "Internal server error during permanent removal.", status: 500 };
  }
}


//HARD SINGLE VARIANT
static async singleHardProductVariantDelete(
  variantId: string,
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {
    if (!variantId) {
      return { error: "Variant ID is required", success: false, status: 400 };
    }

    // 1. Locate variant and check multi-tenant ownership
    const variantToDelete = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        product: { businessId }
      },
      include: {
        images: { select: { imageKey: true } },
        product: { 
          include: { 
            variants: { where: { isDeleted: false } } // Pull active sibling variations
          } 
        }
      }
    });

    if (!variantToDelete) {
      return { error: "Variant not found or access denied.", status: 404, success: false };
    }

    // 2. TRANSACTION
    const fileKeys = await prisma.$transaction(async (tx) => {
      
      // Step A: Log the action
      await tx.auditLog.create({
        data: {
          action: "HARD_DELETE_VARIANT",
          entity: "PRODUCT_VARIANT",
          entityId: variantId,
          userId,
          businessId,
          newValue: `Variant SKU: ${variantToDelete.sku} || from Product: ${variantToDelete.product.name}.`,
          details: `Permanently hard deleted variant SKU: ${variantToDelete.sku} from product: ${variantToDelete.product.name}.`,
        },
      });

      // ── DISPATCH VARIANT HARD DELETE NOTIFICATION TO MANAGEMENT ──
      const recipientIds = await NotificationService.getRecipientIdsByRoles(
        businessId,
        ["OWNER", "ADMIN", "MANAGER"],
        employeeId // Ensure employeeId is available in scope
      );

      if (recipientIds.length > 0) {
        // await NotificationService.createManyInTech // (or createManyInTx)
        await NotificationService.createManyInTx(tx, recipientIds, {
          businessId,
          title: "Variant Permanently Purged",
          message: `Variant SKU '${variantToDelete.sku}' from product '${variantToDelete.product.name}' was permanently hard-deleted.`,
          category: NotificationCategory.SYSTEM,
          priority: NotificationPriority.URGENT,
          channel: NotificationChannel.IN_APP,
        });
      }

      // ── Step B1: Clear cross-branch decoupled stock data dependencies first ──
      // Purge stock movement histories targeting this variant
      await tx.stockLog.deleteMany({ where: { productVariantId: variantId } });

      // Purge store branch allocation points for this variant
      await tx.shopInventory.deleteMany({ where: { productVariantId: variantId } });

      // Step B2: Purge standard relation join tables targeting this variant explicitly
      await tx.variantImage.deleteMany({ where: { variantId } });
      await tx.productVariantOption.deleteMany({ where: { variantId } });
      
      // Step C: Delete the Variant row securely now that sub-relations are wiped
      await tx.productVariant.delete({ where: { id: variantId } });

      // Step D: Last variant protective shell cleanup check
      const remainingActiveVariants = variantToDelete.product.variants.filter(v => v.id !== variantId).length;
      if (remainingActiveVariants === 0) {
        // If no active variations remain, safely soft-archive the parent product out of active lists
        await tx.product.update({
          where: { id: variantToDelete.productId },
          data: { isDeleted: true, deletedAt: new Date() }
        });
      }

      return variantToDelete.images.map(i => i.imageKey).filter(Boolean) as string[];
    });

    // 3. Storage asset cleanup
    if (fileKeys.length > 0) {
      await Promise.allSettled(fileKeys.map(key => deleteUTFile(key)));
    }

    return { success: true, message: `Variant SKU "${variantToDelete.sku}" permanently erased along with local stock configurations.`, status: 200 };

  } catch (error: unknown) {
    console.error("HARD_DELETE_VARIANT_ERROR:", error);
    
    if (error instanceof Error && 'code' in error && error?.code === "P2003") {
      return { 
        success: false, 
        error: "This variant has historical dependency links (such as sales receipts or invoices). Deactivate it instead to protect financial reporting records.", 
        status: 400 
      };
    }
    
    return { success: false, error: "Permanent deletion pipeline encountered an exception.", status: 500 };
  }
}


//HARD BULK PRODUCT-VARIANT DELETE 
static async bulkHardVariantDeleteService(
  variantIds: string[],
  userId: string,
  employeeId: string,
  businessId: string
) {
  try {
    if (!variantIds || variantIds.length === 0) {
      return { success: false, error: "No variant IDs provided.", status: 400 };
    }

    // 1. Gather all active targeted variants to capture unique file keys across multi-tenant bounds
    const variantsToDelete = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: { businessId }
      },
      include: {
        images: { select: { imageKey: true } }
      }
    });

    if (variantsToDelete.length === 0) {
      return { success: false, error: "No variations found matching selection params.", status: 404 };
    }

    const affectedProductIds = [...new Set(variantsToDelete.map(v => v.productId))];

    // 2. RUN BULK PURGE TRANSACTION
    const storageKeysToPurge = await prisma.$transaction(async (tx) => {
      
      // Step A: Create Batch System Audit Log tracks
      await tx.auditLog.createMany({
        data: variantsToDelete.map(v => ({
          action: "BULK_HARD_DELETE_VARIANT",
          entity: "PRODUCT_VARIANT",
          entityId: v.id,
          userId,
          businessId,
          newValue: `Bulk permanently deleted variant SKU: ${v.sku}.`,
        }))
      });

      // ── DISPATCH BULK VARIANT HARD DELETE NOTIFICATIONS ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          employeeId // Ensure employeeId is passed or resolved from userId
        );

        if (recipientIds.length > 0) {
          for (const v of variantsToDelete) {
            await NotificationService.createManyInTx(tx, recipientIds, {
              businessId,
              title: "Bulk Variant Permanent Purge",
              message: `Variant SKU '${v.sku}' was permanently hard-deleted in a bulk operation.`,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.URGENT,
              channel: NotificationChannel.IN_APP,
            });
          }
        }

      // ── Step B1: Clear multi-branch stock configurations first to fulfill foreign keys ──
      // Wipe the history logs tied to these variants
      await tx.stockLog.deleteMany({
        where: { productVariantId: { in: variantIds } }
      });

      // Wipe the cross-branch inventory records matching these variants
      await tx.shopInventory.deleteMany({
        where: { productVariantId: { in: variantIds } }
      });

      // Step B2: Wipe all standard downstream structural relation bindings matching selected IDs
      await tx.variantImage.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.productVariantOption.deleteMany({ where: { variantId: { in: variantIds } } });

      // Step C: Execute structural bulk deletion of the variant rows
      await tx.productVariant.deleteMany({ where: { id: { in: variantIds } } });

      // Step D: Re-evaluate empty parent product matrix states
      for (const prodId of affectedProductIds) {
        // Count how many active variations remain attached to this parent product
        const totalRemainingVariantsCount = await tx.productVariant.count({
          where: { 
            productId: prodId,
            isDeleted: false // Evaluates against active variations remaining
          }
        });

        // If completely empty of active variations, soft-archive parent row to cleanly drop from active UI lists
        if (totalRemainingVariantsCount === 0) {
          await tx.product.update({
            where: { id: prodId },
            data: { isDeleted: true, deletedAt: new Date() }
          });
        }
      }

      // Step E: Consolidate cloud storage tracking links
      const files = variantsToDelete.flatMap(v => v.images.map(img => img.imageKey)).filter(Boolean);
      return [...new Set(files)] as string[];
    });

    // 3. Post-transaction asset cleanup
    if (storageKeysToPurge.length > 0) {
      await Promise.allSettled(storageKeysToPurge.map(key => deleteUTFile(key)));
    }

    return { success: true, message: `Successfully hard deleted ${variantsToDelete.length} variants and swept multi-branch inventory balances.`, status: 200 };

  } catch (error: unknown) {
    console.error("BULK_HARD_DELETE_VARIANTS_ERROR:", error);
    
    if (error instanceof Error && 'code' in error && error?.code === "P2003") {
      return { 
        success: false, 
        error: "Some variants cannot be permanently deleted because they have historical transaction histories (like active sales/invoices). Soft-delete or archive them instead.", 
        status: 400 
      };
    }
    
    return { success: false, error: "An explicit constraint exception blocked batch deletion workflows.", status: 500 };
  }
}

//HARD BULK - PRODUCT DELETE
static async bulkHardProductDelete(
  ids: string[], 
  userId: string, 
  businessId: string, 
  employeeId: string,
  businessSlug: string 
) {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: "No product IDs provided.", status: 400 };
    }

    // 1. Fetch products along with their variants and image arrays to capture cloud storage keys
    const productsToDelete = await prisma.product.findMany({
      where: { 
        id: { in: ids }, 
        businessId: businessId 
      },
      include: {
        variants: {
          include: {
            images: {
              select: { imageKey: true }
            }
          }
        }
      }
    });

    if (productsToDelete.length === 0) {
      return { success: false, error: "No products found to delete.", status: 404 };
    }

    // Flatten all variant IDs belonging to these products for high-performance batch operations
    const variantIds = productsToDelete.flatMap((product) => product.variants.map((v) => v.id));

    // 2. DATABASE TRANSACTION (Order of execution safeguards foreign key cascades)
    const allFileKeys = await prisma.$transaction(async (tx) => {
      
      // A. Create Audit Logs for each targeted product row
      await tx.auditLog.createMany({
        data: productsToDelete.map((product) => ({
          action: "BULK_HARD_DELETE",
          entity: "PRODUCT",
          entityId: product.id,
          userId: userId,
          businessId: businessId,
          newValue: `Bulk permanently deleted product: ${product.name} along with all its variation SKU structures.`
        })),
      });

      // ── DISPATCH BULK PRODUCT HARD DELETE NOTIFICATIONS ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          employeeId // Ensure employeeId is passed or resolved from userId
        );

        if (recipientIds.length > 0) {
          for (const product of productsToDelete) {
            await NotificationService.createManyInTx(tx, recipientIds, {
              businessId,
              title: "Bulk Product Permanent Purge",
              message: `Product '${product.name}' and all associated variant matrices were permanently hard-deleted.`,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.URGENT,
              channel: NotificationChannel.IN_APP,
            });
          }
        }

      // B. Purge variant-dependent join records first
      if (variantIds.length > 0) {
        // 🟢 Step B1: Clear multi-branch stock configurations first to satisfy relational integrity constraints
        // Wipe all ledger movement logs linked to these specific variants
        await tx.stockLog.deleteMany({
          where: { productVariantId: { in: variantIds } }
        });

        // Wipe all store branch inventory records linked to these specific variants
        await tx.shopInventory.deleteMany({
          where: { productVariantId: { in: variantIds } }
        });

        // Step B2: Delete Variant Images associated with these products
        await tx.variantImage.deleteMany({
          where: { variantId: { in: variantIds } }
        });

        // Step B3: Delete Variant Option intermediate matrix allocations
        await tx.productVariantOption.deleteMany({
          where: { variantId: { in: variantIds } }
        });

        // Step B4: Delete the Product Variants rows now that child nodes are swept
        await tx.productVariant.deleteMany({
          where: { id: { in: variantIds } }
        });
      }

      // NOTE: We DO NOT delete VariantAttributes or VariantAttributeValues here.
      // Because they belong to the businessId, deleting them would break other items in the inventory matrix.

      // C. Delete the Parent Product Rows
      await tx.product.deleteMany({
        where: { 
          id: { in: ids }, 
          businessId: businessId 
        },
      });

      // D. Collect all unique file storage keys from the isolated VariantImage collections
      const structuralImageKeys = productsToDelete.flatMap((product) => 
        product.variants.flatMap((variant) => 
          variant.images.map((img) => img.imageKey)
        )
      ).filter(Boolean) as string[];

      // Return a unique array of strings to avoid double-deleting duplicates
      return [...new Set(structuralImageKeys)];
    });

    // 3. CLEAN UP CLOUD STORAGE (COMPREHENSIVE & NON-BLOCKING)
    if (allFileKeys.length > 0) {
      // Promise.allSettled guarantees one bad token link won't cancel the entire array run
      await Promise.allSettled(allFileKeys.map((key) => deleteUTFile(key)));
    }

    return {
      success: true,
      message: `Successfully permanently deleted ${productsToDelete.length} products and cleaned up multi-branch records.`,
      redirectTo: `/${businessSlug}/product_list`,
      status: 200
    };

  } catch (error: unknown) {
    console.error("BULK_DELETE_ERROR:", error);
    
    // Intercept database constraint errors (e.g., product linked to historical sales invoices)
    if (error instanceof Error && 'code' in error && error.code === 'P2003') {
      return { 
        success: false, 
        error: "Some selected items have historical transaction histories (such as past sales or orders) and cannot be permanently removed. Try soft-deleting or archiving them instead.",
        status: 400
      };
    }
    
    return { success: false, error: "An unexpected system error occurred during bulk deletion.", status: 500 };
  }
}

//SINGLE TOGGLE PRODUCT
static async toggleSingleProductStatus(
  productId: string,
  userId: string,
  businessId: string
) {
  try {
    if (!productId) {
      return { error: "Product ID is required", success: false, status: 400 };
    }

    console.log("PRODUCT ID:", productId )

    // 1. Fetch current status
    const product = await prisma.product.findFirst({
      where: { id: productId, businessId, isDeleted: false },
      select: { id: true, name: true, isActive: true },
    });

    if (!product) {
      return { error: "Product not found", success: false, status: 404 };
    }

    const nextStatus = !product.isActive;

    // 2. Update within an atomic transaction block
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { isActive: nextStatus },
      });

      // 🟢 OPTIMIZED: Synchronize child variant availability based on parent visibility
      // If parent is disabled, drop all children. If reactivated, bring non-deleted children back online.
      await tx.productVariant.updateMany({
        where: { productId, isDeleted: false },
        data: { isActive: nextStatus },
      });

      await tx.auditLog.create({
        data: {
          action: "TOGGLE_PRODUCT_STATUS",
          entity: "PRODUCT",
          entityId: productId,
          userId,
          businessId,
          newValue: `Toggled product "${product.name}" visibility to ${nextStatus ? "ACTIVE" : "INACTIVE"} along with its active variation structures.`,
        },
      });

            // ── DISPATCH PRODUCT STATUS TOGGLE NOTIFICATION ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          // employeeId // Ensure employeeId is available in scope
        );

        if (recipientIds.length > 0) {
          await NotificationService.createManyInTx(tx, recipientIds, {
            businessId,
            title: "Product Visibility Updated",
            message: `Product '${product.name}' was toggled ${nextStatus ? "ONLINE (Active)" : "OFFLINE (Inactive)"} by management.`,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.NORMAL,
            channel: NotificationChannel.IN_APP,
          });
        }

      return updated;
    });

    return { 
      success: true, 
      message: `Product "${updatedProduct.name}" is now ${nextStatus ? "active" : "inactive"}.`, 
      isActive: nextStatus,
      status: 200 
    };

  } catch (error) {
    console.error("TOGGLE_PRODUCT_STATUS_ERROR:", error);
    return { error: "Failed to toggle product status due to an internal server exception.", success: false, status: 500 };
  }
}

//SINGLE VARIANT TOGGLE
static async toggleSingleVariantStatus(
  variantId: string,
  userId: string,
  businessId: string
) {
  try {
    if (!variantId) {
      return { error: "Variant ID is required", success: false, status: 400 };
    }

    // 1. Fetch current variant state and parent context
    const variant = await prisma.productVariant.findFirst({
      where: { 
        id: variantId, 
        isDeleted: false,
        product: { businessId } 
      },
      select: { id: true, sku: true, isActive: true, productId: true },
    });

    if (!variant) {
      return { error: "Variant not found", success: false, status: 404 };
    }

    const nextStatus = !variant.isActive;

    await prisma.$transaction(async (tx) => {
      // Step A: Update the targeted variation status
      await tx.productVariant.update({
        where: { id: variantId },
        data: { isActive: nextStatus },
      });

      // Step B: Hierarchy Intelligence Safecheck
      if (nextStatus) {
        // If a variant is activated, force the parent product to be active,
        // ensuring this SKU is visible across your POS/store catalogs.
        await tx.product.update({
          where: { id: variant.productId },
          data: { isActive: true },
        });
      } else {
        // 🟢 OPTIMIZED: If disabling, check if this was the last active variant under the parent
        const activeSiblingsCount = await tx.productVariant.count({
          where: {
            productId: variant.productId,
            isDeleted: false,
            isActive: true,
          },
        });

        // If no active variations remain, set the parent product to inactive too
        if (activeSiblingsCount === 0) {
          await tx.product.update({
            where: { id: variant.productId },
            data: { isActive: false },
          });

          // Log automated parent cascade deactivation
          await tx.auditLog.create({
            data: {
              action: "TOGGLE_PRODUCT_STATUS",
              entity: "PRODUCT",
              entityId: variant.productId,
              userId,
              businessId,
              newValue: `Automatically deactivated parent product container because its last remaining active variant SKU (${variant.sku}) was toggled off.`,
            },
          });
        }
      }

      // Step C: Log the standard variant audit trail
      await tx.auditLog.create({
        data: {
          action: "TOGGLE_VARIANT_STATUS",
          entity: "PRODUCT_VARIANT",
          entityId: variantId,
          userId,
          businessId,
          newValue: `Toggled variant SKU "${variant.sku}" status to ${nextStatus ? "ACTIVE" : "INACTIVE"}.`,
        },
      });
      // ── DISPATCH VARIANT STATUS TOGGLE NOTIFICATION ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          // employeeId // Ensure employeeId is available in scope
        );

        if (recipientIds.length > 0) {
          await NotificationService.createManyInTx(tx, recipientIds, {
            businessId,
            title: "Variant Visibility Updated",
            message: `Variant SKU '${variant.sku}' was toggled ${nextStatus ? "ACTIVE" : "INACTIVE"}.`,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.NORMAL,
            channel: NotificationChannel.IN_APP,
          });
        }
    });


    return { 
      success: true, 
      message: `Variant SKU "${variant.sku}" is now ${nextStatus ? "active" : "inactive"}.`, 
      isActive: nextStatus,
      status: 200 
    };

  } catch (error) {
    console.error("TOGGLE_VARIANT_STATUS_ERROR:", error);
    return { error: "Failed to toggle variant status due to an internal exception.", success: false, status: 500 };
  }
}

//BULK PRODUCT TOGGLE
static async toggleBulkProductsStatus(
  productIds: string[],
  userId: string,
  businessId: string,
) {
  try {
    if (!productIds || productIds.length === 0) {
      return { error: "No product IDs provided", success: false, status: 400 };
    }

    // 1. Fetch the ID AND the current status of matching records
    const validProducts = await prisma.product.findMany({
      where: { 
        id: { in: productIds }, 
        businessId, 
        isDeleted: false 
      },
      select: { 
        id: true, 
        name: true,
        isActive: true // Critical: determine the current state to flip it
      },
    });

    if (validProducts.length === 0) {
      return { error: "No matching items found", success: false, status: 404 };
    }

    // 2. Separate into activation and deactivation batch tracking buckets
    const idsToActivate: string[] = [];
    const idsToDeactivate: string[] = [];

    validProducts.forEach((product) => {
      if (product.isActive) {
        idsToDeactivate.push(product.id); // Was active, so flip to inactive
      } else {
        idsToActivate.push(product.id);   // Was inactive, so flip to active
      }
    });

    // 3. EXECUTE THE TOGGLE ATOMICALLY
    await prisma.$transaction(async (tx) => {
      
      // Step A: Handle Deactivations (and cascade down to child variants)
      if (idsToDeactivate.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: idsToDeactivate } },
          data: { isActive: false },
        });

        // Cascadingly deactivate variants if their parent product is turned off
        await tx.productVariant.updateMany({
          where: { productId: { in: idsToDeactivate }, isDeleted: false },
          data: { isActive: false },
        });
      }

      // Step B: Handle Activations (and bring non-deleted child variants back online)
      if (idsToActivate.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: idsToActivate } },
          data: { isActive: true },
        });
        
        // 🟢 OPTIMIZED: Synchronize child variant availability for reactivated products bulk-wise
        // This keeps behavior predictable so items show up instantly on storefronts/POS terminals
        await tx.productVariant.updateMany({
          where: { productId: { in: idsToActivate }, isDeleted: false },
          data: { isActive: true },
        });
      }

      // Step C: Bulk construct audit logs for tracking transparency
      await tx.auditLog.createMany({
        data: validProducts.map((p) => ({
          action: "BULK_TOGGLE_PRODUCT_STATUS",
          entity: "PRODUCT",
          entityId: p.id,
          userId,
          businessId,
          newValue: `Inverted bulk status config. Switched item from ${p.isActive ? "ACTIVE to INACTIVE" : "INACTIVE to ACTIVE"} along with all associated variation matrices.`,
        })),
      });

      // ── DISPATCH BULK PRODUCT STATUS NOTIFICATIONS ──
      const recipientIds = await NotificationService.getRecipientIdsByRoles(
        businessId,
        ["OWNER", "ADMIN", "MANAGER"],
        // employeeId // Ensure employeeId is available in scope or resolved from userId
      );

      if (recipientIds.length > 0) {
        for (const p of validProducts) {
          const targetStatus = !p.isActive;
          await NotificationService.createManyInTx(tx, recipientIds, {
            businessId,
            title: "Bulk Product Visibility Updated",
            message: `Product '${p.name}' was bulk-toggled ${targetStatus ? "ONLINE (Active)" : "OFFLINE (Inactive)"}.`,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.NORMAL,
            channel: NotificationChannel.IN_APP,
          });
        }
      }
    });

    return { 
      success: true, 
      message: `Successfully processed status toggles for ${validProducts.length} items.`, 
      status: 200 
    };

  } catch (error) {
    console.error("BULK_PRODUCT_TOGGLE_STATUS_ERROR:", error);
    return { error: "Batch status modification failed due to an internal execution error.", success: false, status: 500 };
  }
}


//BULK VARIANT TOGGLE
static async toggleBulkVariantStatus(
  variantIds: string[],
  userId: string,
  businessId: string
) {
  try {
    if (!variantIds || variantIds.length === 0) {
      return { error: "No variant IDs provided", success: false, status: 400 };
    }

    // 1. Fetch cross-tenant valid variant matrices along with their current status
    const validVariants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isDeleted: false,
        product: { businessId },
      },
      select: { 
        id: true, 
        sku: true, 
        productId: true,
        isActive: true // Select current status to handle true toggling
      },
    });

    if (validVariants.length === 0) {
      return { error: "No matching variations located", success: false, status: 404 };
    }

    // 2. Separate into distinct array buckets for bulk processing sequences
    const idsToActivate: string[] = [];
    const idsToDeactivate: string[] = [];
    const parentIdsToForceActivate: string[] = [];
    const parentIdsToCheckDeactivation: string[] = [];

    validVariants.forEach((variant) => {
      if (variant.isActive) {
        idsToDeactivate.push(variant.id); // Active -> Inactive
        parentIdsToCheckDeactivation.push(variant.productId); // Track parent to verify remaining active children
      } else {
        idsToActivate.push(variant.id);   // Inactive -> Active
        parentIdsToForceActivate.push(variant.productId); // Track parent product to wake it up
      }
    });

    // Deduplicate parent product IDs to optimize database operation footprints
    const uniqueParentIdsToActivate = [...new Set(parentIdsToForceActivate)];
    const uniqueParentIdsToCheckDeactivation = [...new Set(parentIdsToCheckDeactivation)];

    // 3. TRANSACTION CONTEXT - Batch update based on explicit target states
    await prisma.$transaction(async (tx) => {
      
      // Step A: Handle batch deactivations
      if (idsToDeactivate.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: idsToDeactivate } },
          data: { isActive: false },
        });
      }

      // Step B: Handle batch activations
      if (idsToActivate.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: idsToActivate } },
          data: { isActive: true },
        });
      }

      // Step C: Hierarchy Intelligence Guard - Activation Path
      // Wake up parent products for any variants that were enabled during this cycle
      if (uniqueParentIdsToActivate.length > 0) {
        await tx.product.updateMany({
          where: { 
            id: { in: uniqueParentIdsToActivate },
            isActive: false // Only affect currently disabled parents to limit row locks
          },
          data: { isActive: true },
        });
      }

      // 🟢 Step D: Hierarchy Intelligence Guard - Deactivation Path
      // Check parent products whose variants were turned off; if they are left empty, turn the parent off.
      for (const prodId of uniqueParentIdsToCheckDeactivation) {
        const remainingActiveVariantsCount = await tx.productVariant.count({
          where: {
            productId: prodId,
            isDeleted: false,
            isActive: true,
          },
        });

        if (remainingActiveVariantsCount === 0) {
          await tx.product.update({
            where: { id: prodId },
            data: { isActive: false },
          });

          // Create an explicit automated system deactivation trail for this parent product
          await tx.auditLog.create({
            data: {
              action: "TOGGLE_PRODUCT_STATUS",
              entity: "PRODUCT",
              entityId: prodId,
              userId,
              businessId,
              newValue: `Automatically deactivated parent product container during bulk update because no active variants remained online under its structure.`,
            },
          });
        }
      }

      // Step E: Construct fine-grained audit footprint indexes
      await tx.auditLog.createMany({
        data: validVariants.map((v) => ({
          action: "BULK_TOGGLE_VARIANT_STATUS",
          entity: "PRODUCT_VARIANT",
          entityId: v.id,
          userId,
          businessId,
          newValue: `Inverted variant configuration state. Switched SKU "${v.sku}" from ${v.isActive ? "ACTIVE to INACTIVE" : "INACTIVE to ACTIVE"}.`,
        })),
      });
      // ── DISPATCH BULK VARIANT STATUS NOTIFICATIONS ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          // employeeId // Ensure employeeId is available in scope or resolved from userId
        );

        if (recipientIds.length > 0) {
          for (const v of validVariants) {
            const targetStatus = !v.isActive;
            await NotificationService.createManyInTx(tx, recipientIds, {
              businessId,
              title: "Bulk Variant Visibility Updated",
              message: `Variant SKU '${v.sku}' was bulk-toggled ${targetStatus ? "ACTIVE" : "INACTIVE"}.`,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.NORMAL,
              channel: NotificationChannel.IN_APP,
            });
          }
        }
    });

    return { 
      success: true, 
      message: `Successfully toggled status flags across ${validVariants.length} variations.`, 
      status: 200 
    };

  } catch (error) {
    console.error("BULK_VARIANT_TOGGLE_STATUS_ERROR:", error);
    return { error: "Batch modification processing sequence hit an issue due to an internal error.", success: false, status: 500 };
  }
}

} 