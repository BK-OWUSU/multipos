import { Prisma } from "@/generated/prisma/client";

// 1. Members List Return Type (Tab 1)
export type LoyaltyMembersListResponse = {
  customers: {
    id: string;
    customId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    status: "ACTIVE" | "BLOCKED";
    lastVisit: Date | null;
    loyaltyTier: {
      name: string;
      color: string | null;
    } | null;
    loyaltyWallet: {
      availablePoints: number;
      lifetimeEarned: number;
      lifetimeRedeemed: number;
    } | null;
  }[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// 2. Transactions Ledger Return Type (Tab 2)
export type LoyaltyHistoryLedgerResponse = {
  transactions: (Prisma.LoyaltyHistoryGetPayload<{
    include: {
      customer: { select: { firstName: true; lastName: true; phone: true } };
      sale: { select: { id: true; customId: true; totalAmount: true; createdAt: true } };
      shop: { select: { id: true; name: true } };
      reward: { select: { title: true; rewardType: true } };
      performedBy: { select: { firstName: true; lastName:true } };
    };
  }>)[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// 3. Rewards Catalog Return Type (Tab 3)
export type LoyaltyRewardsCatalogResponse = Prisma.LoyaltyRewardGetPayload<{
  include: {
    _count: {
      select: { histories: true };
    };
  };
}>[];

// 4. Tiers Configuration Return Type (Tab 4)
export type LoyaltyTiersConfigResponse = Prisma.LoyaltyTierGetPayload<{
  include: {
    _count: {
      select: { customers: true };
    };
  };
}>[];

// 5. Summary KPI Aggregates Return Type (Top Summary Cards)
export interface LoyaltySummaryMetricsResponse {
  totalMembers: number;
  totalPoints: number;
  redeemedRewardsCount: number;
  activeMembersCount: number;
}

// 6. Configuration Settings Return Type
// This mirrors your exact Prisma query structure safely
export type LoyaltyConfigurationWithRelations = Prisma.LoyaltyConfigurationGetPayload<{
  include: {
    targetShops: true;
  }}>;