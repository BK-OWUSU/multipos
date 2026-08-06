import { prisma } from "@/lib/dbHelper";
import { Prisma, LoyaltyActionType } from "@/generated/prisma/client";
import { ConfigFormValues, configSchema, LoyaltyProcessorResult, PointAdjustmentInput, ProcessSalePointsParams, RewardFormValues, rewardSchema, TierFormValues, tierSchema } from "@/types/schema/loyalty.schema";
import { AppResponse } from "@/types/auth/auth";

// Define a strict type for the Prisma transaction client to eliminate 'any' completely


export class LoyaltyService {
  /**
 * Processes loyalty points accumulation at checkout within an existing transaction pipeline
 */
static async calculateAndProcessSalePointsWithTx({
  tx,
  businessId,
  customerId,
  shopId,
  saleId,
  orderTotal,
  performedById,
  isPromotionalSale = false
}: ProcessSalePointsParams): Promise<LoyaltyProcessorResult> {
  
  // 1. Fetch tenant configuration parameters along with target shop overrides
  const config = await tx.loyaltyConfiguration.findUnique({
    where: { businessId },
    include: { targetShops: true }
  });

  if (!config || !config.isEnabled) {
    return { processed: false, reason: "Loyalty disabled" };
  }

  // Enforce branch boundaries configuration rule constraints
  if (!config.applyToAllShops) {
    const isShopAuthorized = config.targetShops.some((target) => target.shopId === shopId);
    if (!isShopAuthorized) {
      return { processed: false, reason: "Accrual skipped: Branch is not within active validation scope" };
    }
  }

  if (isPromotionalSale && !config.earnOnPromotions) {
    return { processed: false, reason: "Accrual skipped: Promotional items excluded" };
  }

  // 2. Resolve Customer's Loyalty Wallet and Multipliers
  let wallet = await tx.loyaltyWallet.findUnique({
    where: { customerId },
    include: {
      customer: {
        include: { loyaltyTier: true }
      }
    }
  });

  // Initialize wallet record gracefully if it's their first transaction
  if (!wallet) {
    wallet = await tx.loyaltyWallet.create({
      data: { customerId, businessId, availablePoints: 0 },
      include: {
        customer: {
          include: { loyaltyTier: true }
        }
      }
    });
  }

  // 3. Compute Accrual Metrics against Native Decimal fields
  const requiredAmtPerPoint = Number(config.amountRequiredPerPoint);
  if (requiredAmtPerPoint <= 0) {
    return { processed: false, reason: "Invalid billing rule configuration" };
  }

  let calculatedPoints = Math.floor(orderTotal / requiredAmtPerPoint);

  // Apply Membership Tier Multipliers if valid
  let appliedMultiplier = 1.0;
  if (wallet.customer.loyaltyTier && wallet.customer.loyaltyTier.isActive) {
    appliedMultiplier = Number(wallet.customer.loyaltyTier.earnMultiplier);
    calculatedPoints = Math.floor(calculatedPoints * appliedMultiplier);
  }

  if (calculatedPoints <= 0) {
    return { processed: false, reason: "Purchase amount insufficient for point milestone" };
  }

  // 4. Update the Balance Wallet
  const updatedWallet = await tx.loyaltyWallet.update({
    where: { id: wallet.id },
    data: {
      availablePoints: { increment: calculatedPoints },
      lifetimeEarned: { increment: calculatedPoints }
    }
  });

  // 5. Append Record into Ledger (LoyaltyHistory)
  await tx.loyaltyHistory.create({
    data: {
      walletId: wallet.id,
      customerId,
      businessId,
      shopId,
      saleId,
      performedById,
      points: calculatedPoints,
      type: LoyaltyActionType.EARNED,
      reason: `Earned points via sale receipt purchase (Subtotal: GH₵ ${orderTotal.toFixed(2)}) using a tier factor of ${appliedMultiplier}x.`
    }
  });

  // 6. Evaluate Tier Ascension
  await this.evaluateTierAscension(tx, customerId, businessId, updatedWallet.lifetimeEarned, wallet.customer.loyaltyTierId);

  return {
    processed: true,
    pointsEarned: calculatedPoints
  };
}

/**
 * Evaluates if a customer qualifies for a tier ascension or descension 
 * based on lifetime earned points milestones.
 */
private static async evaluateTierAscension(
  tx: Prisma.TransactionClient,
  customerId: string,
  businessId: string,
  lifetimeEarned: number,
  currentTierId: string | null
): Promise<void> {
  // Fetch tiers sorted from highest priority milestone to lowest
  const availableTiers = await tx.loyaltyTier.findMany({
    where: { businessId, isActive: true },
    orderBy: { priority: "desc" }
  });

  // Find the highest priority tier that the customer satisfies
  const matchingTier = availableTiers.find(
    (tier) => lifetimeEarned >= tier.minimumLifetimePoints
  );

  // Target tier ID will either be the matched tier or null if they don't meet any tier criteria
  const targetTierId = matchingTier ? matchingTier.id : null;

  // Only execute a database hit if their tier alignment actually changes
  if (currentTierId !== targetTierId) {
    await tx.customer.update({
      where: { id: customerId },
      data: { loyaltyTierId: targetTierId }
    });
  }
}

// CREATING AND UPDATING SYSTEM SETTINGS/CONFIGURATION FOR LOYALTY POINTS
static async saveConfiguration(
  data: ConfigFormValues,
  userId: string,
  businessId: string,
  ipAddress?: string | null
) {
  try {
    // 1. Structural schema parsing & structural safety validation
    const validatedData = configSchema.parse(data);

    // 2. Execute transaction to safely wrap atomic update and system audit trace
    return await prisma.$transaction(async (tx) => {
      // Fetch current state for audit comparison records
      const oldConfig = await tx.loyaltyConfiguration.findUnique({
        where: { businessId },
        include: { targetShops: true }, 
      });

      // Update or insert the base configuration state
      const updatedConfig = await tx.loyaltyConfiguration.upsert({
        where: { businessId },
        update: {
          isEnabled: validatedData.isEnabled,
          applyToAllShops: validatedData.applyToAllShops,
          amountRequiredPerPoint: new Prisma.Decimal(validatedData.amountRequiredPerPoint),
          pointValue: new Prisma.Decimal(validatedData.pointValue),
          minimumPointsToRedeem: validatedData.minimumPointsToRedeem,
          maxRedeemPercentage: validatedData.maxRedeemPercentage,
          pointsExpiryMonths: validatedData.pointsExpiryMonths,
          earnOnPromotions: validatedData.earnOnPromotions, 
        },
        create: {
          businessId,
          isEnabled: validatedData.isEnabled,
          applyToAllShops: validatedData.applyToAllShops,
          amountRequiredPerPoint: new Prisma.Decimal(validatedData.amountRequiredPerPoint),
          pointValue: new Prisma.Decimal(validatedData.pointValue),
          minimumPointsToRedeem: validatedData.minimumPointsToRedeem,
          maxRedeemPercentage: validatedData.maxRedeemPercentage,
          pointsExpiryMonths: validatedData.pointsExpiryMonths,
          earnOnPromotions: validatedData.earnOnPromotions,
        },
      });

      // 3. Sync target branches scope using the correct Prisma model layout
      // Wipe the existing branch filters linked to this configuration
      await tx.loyaltyConfigShop.deleteMany({
        where: { configId: updatedConfig.id },
      });

      // Repopulate explicitly selected branches if the scoping rule isn't global
      if (!validatedData.applyToAllShops && validatedData.shopIds && validatedData.shopIds.length > 0) {
        await tx.loyaltyConfigShop.createMany({
          data: validatedData.shopIds.map((id) => ({
            configId: updatedConfig.id, // Correct model key linking back to config
            shopId: id,
          })),
        });
      }

      // Re-fetch configuration state along with its freshly mapped branches for deep auditing
      const fullyUpdatedConfig = await tx.loyaltyConfiguration.findUnique({
        where: { id: updatedConfig.id },
        include: { targetShops: true },
      });

      await tx.auditLog.create({
        data: {
          action: oldConfig ? "UPDATE" : "CREATE",
          entity: "LoyaltyConfiguration",
          entityId: updatedConfig.id,
          oldValue: oldConfig ? JSON.stringify(oldConfig) : null,
          newValue: JSON.stringify(fullyUpdatedConfig),
          userId,
          businessId,
          ipAddress: ipAddress || null,
          logType: "SYSTEM_CONFIGURATION",
          details: `Loyalty program scope rules modified. Status: ${validatedData.isEnabled}. All Shops Application Flag: ${validatedData.applyToAllShops}. Explicit Shop Counts: ${validatedData.shopIds?.length || 0}.`,
        },
      });

      const msg = oldConfig ? "Loyalty configuration updated successfully" : "Loyalty configuration saved successfully";

      return {
        success: true,
        message: msg,
        data: fullyUpdatedConfig,
        status: 200,
      } as AppResponse;
    });
  } catch (error) {
    console.error("Error Saving Loyalty Configuration:", error);
    return {
      success: false,
      error: "An internal operational database fault disrupted your loyalty application updates.",
      status: 500,
    } as AppResponse;
  }
}


  //METHOD TO CREATE A REWARD
  static async createReward(
    data: RewardFormValues,
    userId: string,
    businessId: string,
    ipAddress?: string | null
  ) {
    try {
      // 1. Structural schema parsing & structural safety validation
      const validatedData = rewardSchema.parse(data);

      let productVariantId: string | null = null;

      // 2. Resolve SKU to structural database ID if reward type is a physical product
      if (validatedData.rewardType === "PRODUCT") {
        if (!validatedData.applicableSku) {
          throw new Error("An associated product SKU is required for product-type rewards.");
        }

        const variant = await prisma.productVariant.findFirst({
          where: {
            sku: validatedData.applicableSku.trim(),
            product: { businessId } // Safeguard multi-tenant isolation boundaries
          }
        });

        if (!variant) {
          throw new Error(`Inventory lookup failed: SKU "${validatedData.applicableSku}" does not exist in your catalog.`);
        }

        productVariantId = variant.id;
      }

      // 3. Execute atomic transaction to write catalog record and system audit trail
      return await prisma.$transaction(async (tx) => {
        const newReward = await tx.loyaltyReward.create({
          data: {
            businessId,
            title: validatedData.title,
            description: validatedData.description || null,
            pointsRequired: validatedData.pointsRequired,
            rewardType: validatedData.rewardType,
            rewardValue: ["FIXED_AMOUNT", "PERCENTAGE"].includes(validatedData.rewardType)
              ? new Prisma.Decimal(validatedData.rewardValue ?? 0)
              : null,
            productVariantId,
            isActive: true,
          }
        });

        await tx.auditLog.create({
          data: {
            action: "CREATE",
            entity: "LoyaltyReward",
            entityId: newReward.id,
            oldValue: null,
            newValue: JSON.stringify(newReward),
            userId,
            businessId,
            ipAddress: ipAddress || null,
            logType: "CATALOG_MANAGEMENT",
            details: `New reward item "${validatedData.title}" introduced into the customer catalog inventory layer.`,
          }
        });

        return {
          success:true,
          message: `${newReward.title} reward created successfully`,
          data: newReward,
          status:200,
        } as AppResponse;
      });
    } catch (error) {
      console.log("ERROR_CREATING_REWARD: ", error)
      return {
          success: false,
          error:  "Error creating reward",
          status: 500,
        } as AppResponse;
    }
  }

  //UPDATE A REWARD METHOD
  static async updateReward(
    rewardId: string,
    data: RewardFormValues,
    userId: string,
    businessId: string,
    ipAddress?: string | null
  ) {
    try {
      // 1. Structural schema parsing & structural safety validation
      const validatedData = rewardSchema.parse(data);

      // 2. Multi-tenant target identification verification check
      const currentReward = await prisma.loyaltyReward.findUnique({
        where: { id: rewardId }
      });

      if (!currentReward || currentReward.businessId !== businessId) {
        throw new Error("Target reward item not found or unauthorized resource execution access.");
      }

      let productVariantId: string | null = null;

      // 3. Dynamically re-evaluate SKU linkages if structural shifts occurred
      if (validatedData.rewardType === "PRODUCT") {
        if (!validatedData.applicableSku) {
          throw new Error("An associated product SKU is required for product-type rewards.");
        }

        const variant = await prisma.productVariant.findFirst({
          where: {
            sku: validatedData.applicableSku.trim(),
            product: { businessId }
          }
        });

        if (!variant) {
          throw new Error(`Inventory lookup failed: SKU "${validatedData.applicableSku}" does not exist in your catalog.`);
        }

        productVariantId = variant.id;
      }

      // 4. Update ledger elements within atomic operational safety wrap
      return await prisma.$transaction(async (tx) => {
        const updatedReward = await tx.loyaltyReward.update({
          where: { id: rewardId },
          data: {
            title: validatedData.title,
            description: validatedData.description || null,
            pointsRequired: validatedData.pointsRequired,
            rewardType: validatedData.rewardType,
            rewardValue: ["FIXED_AMOUNT", "PERCENTAGE"].includes(validatedData.rewardType)
              ? new Prisma.Decimal(validatedData.rewardValue ?? 0)
              : null,
            productVariantId, // Sets correct relation ID or nullifies if switching types away from product
          }
        });

        await tx.auditLog.create({
          data: {
            action: "UPDATE",
            entity: "LOYALTY_REWARD",
            entityId: updatedReward.id,
            oldValue: JSON.stringify(currentReward),
            newValue: JSON.stringify(updatedReward),
            userId,
            businessId,
            ipAddress: ipAddress || null,
            logType: "CATALOG_MANAGEMENT",
            details: `Loyalty reward parameters modified for item id template index record.`,
          }
        });

        return {
          success:true,
          message: `${updatedReward.title} reward updated successfully`,
          data: updatedReward,
          status:200,
        } as AppResponse;
      });
    } catch (error) {
        console.log("ERROR_UPDATING _REWARD: ", error)
        return {
          success:false,
          error: "Error updating reward",
          status:500,
        } as AppResponse;
    }
  }

  //CREATE LOYALTY TIER METHOD
  static async createTier(
    data: TierFormValues,
    userId: string,
    businessId: string,
    // shopId?: string | null,
    ipAddress?: string | null
  ) {
    try {
      // 1. Structural schema parsing & structural safety validation
      const validatedData = tierSchema.parse(data);

      // 2. Execute transaction to safely isolate state overrides and logs
    const newTier = await prisma.$transaction(async (tx) => {
        
        // Safety Guard: If this new tier is marked as default, unset any existing default tier first
        if (validatedData.isDefault) {
          await tx.loyaltyTier.updateMany({
            where: { businessId, isDefault: true },
            data: { isDefault: false }
          });
        }

        const newTier = await tx.loyaltyTier.create({
          data: {
            businessId,
            name: validatedData.name,
            description: validatedData.description || null,
            color: validatedData.color || null,
            icon: validatedData.icon || null,
            minimumLifetimePoints: validatedData.isDefault ? 0 : validatedData.minimumLifetimePoints,
            earnMultiplier: new Prisma.Decimal(validatedData.earnMultiplier),
            redemptionMultiplier: new Prisma.Decimal(validatedData.redemptionMultiplier),
            priority: validatedData.priority,
            isDefault: validatedData.isDefault,
            isActive: validatedData.isActive,
          }
        });

        await tx.auditLog.create({
          data: {
            action: "CREATE",
            entity: "LoyaltyTier",
            entityId: newTier.id,
            oldValue: null,
            newValue: JSON.stringify(newTier),
            userId,
            businessId,
            // shopId: shopId || null,
            ipAddress: ipAddress || null,
            logType: "TIER_MANAGEMENT",
            details: `Loyalty tier level status program "${validatedData.name}" created successfully.`,
          }
        });

        return newTier;
      });

      return {
          success:true,
          message: `${newTier.name} tier created successfully`,
          data: newTier,
          status:200,
        } as AppResponse;

    } catch (error) {
      console.log("ERROR_CREATING_TIER: ", error)
        return {
          success:false,
          error: "Error creating tier",
          status:500,
        } as AppResponse;
    }
  }

  //UPDATE LOYALTY TIER METHOD
  static async updateTier(
    tierId: string,
    data: TierFormValues,
    userId: string,
    businessId: string,
    // shopId?: string | null,
    ipAddress?: string | null
  ) {
    try {
      // 1. Structural schema parsing & structural safety validation
      const validatedData = tierSchema.parse(data);

      // 2. Multi-tenant checkpoint verification verification check
      const currentTier = await prisma.loyaltyTier.findUnique({
        where: { id: tierId }
      });

      if (!currentTier || currentTier.businessId !== businessId) {
        throw new Error("Target tier level not found or unauthorized resource execution access.");
      }

      // 3. Execute atomicity wrapped transactional modifications
      const updatedTier = await prisma.$transaction(async (tx) => {
        
        // Safety Guard: If this tier is updating to become the default, unset old default references
        if (validatedData.isDefault && !currentTier.isDefault) {
          await tx.loyaltyTier.updateMany({
            where: { businessId, isDefault: true },
            data: { isDefault: false }
          });
        }

        const updatedTier = await tx.loyaltyTier.update({
          where: { id: tierId },
          data: {
            name: validatedData.name,
            description: validatedData.description || null,
            color: validatedData.color || null,
            icon: validatedData.icon || null,
            minimumLifetimePoints: validatedData.isDefault ? 0 : validatedData.minimumLifetimePoints,
            earnMultiplier: new Prisma.Decimal(validatedData.earnMultiplier),
            redemptionMultiplier: new Prisma.Decimal(validatedData.redemptionMultiplier),
            priority: validatedData.priority,
            isDefault: validatedData.isDefault,
            isActive: validatedData.isDefault ? true : validatedData.isActive, // Enforce active status if default
          }
        });

        await tx.auditLog.create({
          data: {
            action: "UPDATE",
            entity: "LoyaltyTier",
            entityId: updatedTier.id,
            oldValue: JSON.stringify(currentTier),
            newValue: JSON.stringify(updatedTier),
            userId,
            businessId,
            // shopId: shopId || null,
            ipAddress: ipAddress || null,
            logType: "TIER_MANAGEMENT",
            details: `Loyalty tier criteria modified for metadata profile tracking row configurations.`,
          }
        });

        return updatedTier;
      });

      return {
          success:true,
          message: `${updatedTier.name} tier created successfully`,
          data: updatedTier,
          status:200,
        } as AppResponse;
    } catch (error) {
        console.log("ERROR_UPDATING_TIER: ", error)
        return {
          success:false,
          error: "Error updating tier",
          status:500,
        } as AppResponse;
    }
  }


  //LOYALTY HISTORY LEDGER
  /**
   * 1. ACCRUE POINTS (Triggered when a checkout sale completes successfully)
   */
  static async accruePoints(
    saleId: string,
    pointsToEarn: number,
    customerId: string,
    businessId: string,
    shopId: string
  ) {
    if (pointsToEarn <= 0) return null;

    return await prisma.$transaction(async (tx) => {
      // Upsert wallet profile to ensure structure exists safely
      const wallet = await tx.loyaltyWallet.upsert({
        where: { customerId },
        update: {
          availablePoints: { increment: pointsToEarn },
          lifetimeEarned: { increment: pointsToEarn }
        },
        create: {
          customerId,
          businessId,
          availablePoints: pointsToEarn,
          lifetimeEarned: pointsToEarn,
        }
      });

      // Write row to audit ledger statement trail tracking history
      return await tx.loyaltyHistory.create({
        data: {
          walletId: wallet.id,
          customerId,
          businessId,
          shopId,
          saleId,
          points: pointsToEarn,
          type: "EARNED" as const,
          reason: `Points accumulated from order sale sequence reference index: ${saleId}`,
        }
      });
    });
  }

  /**
   * 2. REDEEM REWARD (Triggered when processing a claims catalog item checkout)
   */
  static async redeemReward(
    rewardId: string,
    customerId: string,
    businessId: string,
    shopId: string,
    performedById?: string | null
  ) {
    return await prisma.$transaction(async (tx) => {
      // Verify reward parameters cost baseline matrix
      const reward = await tx.loyaltyReward.findUnique({ where: { id: rewardId } });
      if (!reward || !reward.isActive) throw new Error("Target reward item option is currently unavailable.");

      const wallet = await tx.loyaltyWallet.findUnique({ where: { customerId } });
      if (!wallet || wallet.availablePoints < reward.pointsRequired) {
        throw new Error(`Insufficient point balances. Required: ${reward.pointsRequired}, Current: ${wallet?.availablePoints ?? 0}`);
      }

      // Decrement balance safely inside transaction lock thread window boundary
      const updatedWallet = await tx.loyaltyWallet.update({
        where: { customerId },
        data: {
          availablePoints: { decrement: reward.pointsRequired },
          lifetimeRedeemed: { increment: reward.pointsRequired }
        }
      });

      return await tx.loyaltyHistory.create({
        data: {
          walletId: updatedWallet.id,
          customerId,
          businessId,
          shopId,
          rewardId,
          performedById: performedById || null,
          points: -reward.pointsRequired, // Logged as a negative point movement indicator entry ledger
          type: "REDEEMED" as const,
          reason: `Claimed reward item asset layout: "${reward.title}"`,
        }
      });
    });
  }

  /**
   * 3. ADMINISTRATIVE ADJUSTMENT (Triggered from a manual override form)
   */


  static async adjustPoints(input: PointAdjustmentInput) {
    return await prisma.$transaction(async (tx) => {
      
      const wallet = await tx.loyaltyWallet.upsert({
        where: { customerId: input.customerId },
        update: {},
        create: {
          customerId: input.customerId,
          businessId: input.businessId,
          availablePoints: 0,
        }
      });

      // Enforce point math safety restrictions based on input action types
      const processedPoints = input.actionType === "MANUAL_REMOVE" 
        ? -Math.abs(input.points) 
        : Math.abs(input.points);

      if (processedPoints < 0 && wallet.availablePoints + processedPoints < 0) {
        throw new Error(`Invalid manual adjustment. Wallet balance cannot fall below zero. Current balance: ${wallet.availablePoints}`);
      }

      const updatedWallet = await tx.loyaltyWallet.update({
        where: { customerId: input.customerId },
        data: {
          availablePoints: { increment: processedPoints },
          ...(processedPoints > 0 
            ? { lifetimeEarned: { increment: processedPoints } } 
            : { lifetimeRedeemed: { increment: Math.abs(processedPoints) } }
          )
        }
      });

      // 2. Type safe execution using the exact Prisma generated enum fields
      return await tx.loyaltyHistory.create({
        data: {
          walletId: updatedWallet.id,
          customerId: input.customerId,
          businessId: input.businessId,
          shopId: input.shopId,
          performedById: input.performedById,
          points: processedPoints,
          type: input.actionType as LoyaltyActionType, // Safe mapping because input matches exactly
          reason: input.reason.trim(),
        }
      });
    });
  }

  //FETCHING LOYALTY DATA
  static async getConfiguration(businessId: string) {
    try {
      const config = await prisma.loyaltyConfiguration.findUnique({
        where: { businessId },
      });

      // Optional: If no configuration exists yet for this business, you can return a safe fallback default object matching your Prisma model initial states
      if (!config) {
        const defaultConfig =  {
          id: "",
          businessId,
          isEnabled: false,
          amountRequiredPerPoint: new Prisma.Decimal(10.00),
          pointValue: new Prisma.Decimal(0.10),
          minimumPointsToRedeem: 50,
          maxRedeemPercentage: 30,
          pointsExpiryMonths: 12,
          earnOnPromotions: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          success: true,
          data: defaultConfig,
          status: 200
        }
      }

      return {
        success: true,
        data: config,
        status: 200
      } as AppResponse;

    } catch (error) {
      // Allow upstream execution pipelines to catch and display validation or database errors directly
        console.error("Error Saving Loyalty Configuration:", error);
        return {
          success: false,
          error: "An internal operational database fault disrupted your invoice data stream processing.",
          status: 500,
        } as AppResponse;
    }
  }

  static async getMembersList(
    businessId: string,
    filters: { search?: string; tierId?: string; status?: "ACTIVE" | "BLOCKED"; page?: number; limit?: number }
  ) {
    try {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 10;
      const skip = (page - 1) * limit;

      const whereClause: Prisma.CustomerWhereInput = {
        businessId,
        isDeleted: false,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.tierId ? { loyaltyTierId: filters.tierId } : {}),
        ...(filters.search ? {
          OR: [
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } }
          ]
        } : {})
      };

      const [customers, totalCount] = await Promise.all([
        prisma.customer.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            customId: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            lastVisit: true,
            loyaltyTier: {
              select: {
                name: true,
                color: true
              }
            },
            loyaltyWallet: {
              select: {
                availablePoints: true,
                lifetimeEarned: true,
                lifetimeRedeemed: true
              }
            }
          }
        }),
        prisma.customer.count({ where: whereClause })
      ]);

      return {
        success: true,
        data: customers,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        },
        status: 200,
      } as AppResponse;

    } catch (error) {

        console.log("Error Fetching Rewards: ",error)
        return {
          success: false,
          error:"Error fetching Rewards",
          status: 500
      } as AppResponse;   
    }
  }

  //LOYALTY HISTORY
  static async getHistoryLedger(
    businessId: string,
    filters: { shopId?: string | null; search?: string; type?: LoyaltyActionType; page?: number; limit?: number }
  ) {
    try {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const skip = (page - 1) * limit;

      const whereClause: Prisma.LoyaltyHistoryWhereInput = {
        businessId,
        ...(filters.shopId ? { shopId: filters.shopId } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.search ? {
          customer: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
              { phone: { contains: filters.search } }
            ]
          }
        } : {})
      };

      const [transactions, totalCount] = await Promise.all([
        prisma.loyaltyHistory.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            },
            sale: {
              select: {
                id: true,
                customId: true,
                totalAmount: true,
                createdAt: true
              }
            },
            reward: {
              select: {
                title: true,
                rewardType: true
              }
            },
            shop: {
              select: {
                id: true,
                name: true
              }
            },
            performedBy: {
              select: {
                id: true,
                firstName:true,
                lastName: true,
              }
            }
          }
        }),
        prisma.loyaltyHistory.count({ where: whereClause })
      ]);

      return {
        success: true,
        data: transactions,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        },
        status: 200,
      };
    } catch (error) {
      console.log("Error Fetching Rewards: ",error)
      return {
          success: false,
          error:"Error fetching Rewards",
          status: 500,
        } as AppResponse;
    }
  }

 static async getRewardsCatalog(businessId: string) {
    try {
       const rewards = await prisma.loyaltyReward.findMany({
        where: { businessId, isDeleted: false },
        orderBy: { pointsRequired: "asc" },
        include: {
          _count: {
            select: { histories: { where: { type: "REDEEMED" } } }
          }
        }
      });

      return {
        success: true,
        data: rewards,
        status: 200
      } as AppResponse;  

    } catch (error) {
      console.log("Error Fetching Rewards: ",error)
        return {
          success: false,
          error:"Error fetching Rewards",
          status: 500
      } as AppResponse;   
    }
  }
  
  
  
  static async getTiersConfigurationList(businessId: string) {
    try {
      const tiers = await prisma.loyaltyTier.findMany({
        where: { businessId },
        orderBy: { priority: "asc" },
        include: {
          _count: {
            select: { customers: { where: { isDeleted: false } } }
          }
        }
      });

      return {
        success: true,
        data: tiers,
        status: 200
      } as AppResponse;  

    } catch (error) {
      console.log("Error Fetching Rewards: ",error)
        return {
          success: false,
          error:"Error fetching Rewards",
          status: 500
      } as AppResponse;
    }
  }

  static async getSummaryMetrics(businessId: string) {
    try {
      const totalPointsAggregate = await prisma.loyaltyWallet.aggregate({
        where: { businessId },
        _sum: { availablePoints: true }
      });

      const [totalMembers, totalRedeemedHistory, activeMembers] = await Promise.all([
        prisma.customer.count({ where: { businessId, isDeleted: false } }),
        prisma.loyaltyHistory.count({ where: { businessId, type: "REDEEMED" } }),
        prisma.customer.count({ where: { businessId, status: "ACTIVE", isDeleted: false } })
      ]);

      return {
        success: true,
        message: "Summary Metrics fetched",
        data: {
          totalMembers,
          totalPoints: totalPointsAggregate._sum.availablePoints ?? 0,
          redeemedRewardsCount: totalRedeemedHistory,
          activeMembersCount: activeMembers,
        },
        status: 200,
      } as AppResponse;
    } catch (error) {
        console.log("Error Fetching Rewards: ",error)
        return {
          success: false,
          error:"Error fetching Rewards",
          status: 500
      } as AppResponse;
    }
  }

}