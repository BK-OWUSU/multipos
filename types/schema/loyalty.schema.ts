import { Prisma } from "@/generated/prisma/client";
import * as z from "zod";

// 1. Zod validation schema matching frontend state
export const configSchema = z.object({
  isEnabled: z.boolean(),
  applyToAllShops: z.boolean(),
  // An array of selected shop strings
  shopIds: z.array(z.string()).default([]),
  amountRequiredPerPoint: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  pointValue: z.coerce.number().min(0.01, "Value must be greater than 0"),
  minimumPointsToRedeem: z.coerce.number().int().min(0, "Cannot be negative"),
  maxRedeemPercentage: z.coerce
    .number()
    .min(1, "Minimum limit is 1%")
    .max(100, "Maximum limit is 100%"),
  pointsExpiryMonths: z.coerce
    .number()
    .int()
    .min(0, "Use 0 for infinite validity"),
  earnOnPromotions: z.boolean(), 
}).refine((data) => {
  // If loyalty is enabled, and it's NOT applied to all shops, they must pick at least one shop
  if (data.isEnabled && !data.applyToAllShops && data.shopIds.length === 0) {
    return false;
  }
  return true;
}, {
  message: "Please select at least one shop to apply this loyalty configuration.",
  path: ["shopIds"] 
});

export type ConfigFormValues = z.input<typeof configSchema>;


export const rewardSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  pointsRequired: z.coerce.number().int().min(1, "Must require at least 1 point"),
  rewardType: z.enum(["PRODUCT", "FIXED_AMOUNT", "PERCENTAGE", "FREE_SERVICE"]),
  rewardValue: z.coerce.number().min(0).optional(),
  applicableSku: z.string().optional(),
});

export type RewardFormValues = z.input<typeof rewardSchema>;
export type RewardType = z.infer<typeof rewardSchema>["rewardType"];



export const tierSchema = z.object({
  name: z.string().min(2, "Tier name must be at least 2 characters"),
  description: z.string().max(255, "Description must be under 255 characters").optional(),
  color: z.string().min(1, "Please select a color branding theme"),
  icon: z.string().optional(),
  minimumLifetimePoints: z.coerce.number().int().min(0, "Points requirement cannot be negative"),
  earnMultiplier: z.coerce.number().min(1.00, "Multiplier must be at least 1.00"),
  redemptionMultiplier: z.coerce.number().min(0.10, "Multiplier must be at least 0.10"),
  priority: z.coerce.number().int().min(1, "Priority must be 1 or higher"),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export type TierFormValues = z.input<typeof tierSchema>;


export interface ProcessSalePointsParams {
  tx: Prisma.TransactionClient;
  businessId: string;
  customerId: string;
  shopId: string;
  saleId: string;
  orderTotal: number;
  performedById: string;
  isPromotionalSale?: boolean;
}

export interface LoyaltyProcessorResult {
  processed: boolean;
  reason?: string;
  pointsEarned?: number;
}


// Define a strict enum layout locally matching your database schema schema configuration
export type LoyaltyActionType = "EARNED" | "REDEEMED" | "EXPIRED" | "ADJUSTED" | "REVERSAL" | "MANUAL_REMOVE" |"MANUAL_ADD";


export interface PointAdjustmentInput {
  customerId: string;
  businessId: string;
  shopId: string;
  points: number; 
  reason: string;
  performedById: string;
  // Let the wrapper explicitly dictate whether this is a manual add or remove
  actionType: "MANUAL_ADD" | "MANUAL_REMOVE"; 
}


export interface GetMembersFilterInput {
  businessId: string;
  search?: string;
  tierId?: string;
  status?: "ACTIVE" | "BLOCKED";
  page?: number;
  limit?: number;
}

export interface GetHistoryFilterInput {
  businessId: string;
  shopId?: string | null;
  search?: string;
  type?: LoyaltyActionType;
  page?: number;
  limit?: number;
}