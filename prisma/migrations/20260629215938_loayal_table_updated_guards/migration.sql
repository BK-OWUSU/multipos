-- AlterTable
ALTER TABLE "loyalty_configurations" ADD COLUMN     "earnOnPromotions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxRedeemPercentage" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "pointsExpiryMonths" INTEGER NOT NULL DEFAULT 12;
