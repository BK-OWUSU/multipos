/*
  Warnings:

  - The values [MANUAL_ADJUSTMENT] on the enum `LoyaltyActionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `amountPerPoint` on the `loyalty_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `minPointsToRedeem` on the `loyalty_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `valuePerPoint` on the `loyalty_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `applicableSku` on the `loyalty_rewards` table. All the data in the column will be lost.
  - You are about to drop the `loyalty` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `walletId` to the `loyalty_history` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterEnum
BEGIN;
CREATE TYPE "LoyaltyActionType_new" AS ENUM ('EARNED', 'REDEEMED', 'MANUAL_ADD', 'MANUAL_REMOVE', 'EXPIRED', 'REVERSAL');
ALTER TABLE "loyalty_history" ALTER COLUMN "type" TYPE "LoyaltyActionType_new" USING ("type"::text::"LoyaltyActionType_new");
ALTER TYPE "LoyaltyActionType" RENAME TO "LoyaltyActionType_old";
ALTER TYPE "LoyaltyActionType_new" RENAME TO "LoyaltyActionType";
DROP TYPE "public"."LoyaltyActionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "loyalty" DROP CONSTRAINT "loyalty_customerId_fkey";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "loyaltyTierId" TEXT,
ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "loyalty_configurations" DROP COLUMN "amountPerPoint",
DROP COLUMN "minPointsToRedeem",
DROP COLUMN "valuePerPoint",
ADD COLUMN     "amountRequiredPerPoint" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
ADD COLUMN     "minimumPointsToRedeem" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "pointValue" DECIMAL(10,2) NOT NULL DEFAULT 0.10;

-- AlterTable
ALTER TABLE "loyalty_history" ADD COLUMN     "shopId" TEXT,
ADD COLUMN     "walletId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "loyalty_rewards" DROP COLUMN "applicableSku",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productVariantId" TEXT;

-- DropTable
DROP TABLE "loyalty";

-- CreateTable
CREATE TABLE "loyalty_tiers" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" VARCHAR(255),
    "color" TEXT,
    "icon" TEXT,
    "minimumLifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "earnMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    "redemptionMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_wallets" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeRedeemed" INTEGER NOT NULL DEFAULT 0,
    "lifetimeExpired" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loyalty_tiers_businessId_idx" ON "loyalty_tiers"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_tiers_businessId_name_key" ON "loyalty_tiers"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_wallets_customerId_key" ON "loyalty_wallets"("customerId");

-- CreateIndex
CREATE INDEX "loyalty_wallets_businessId_idx" ON "loyalty_wallets"("businessId");

-- CreateIndex
CREATE INDEX "loyalty_history_walletId_idx" ON "loyalty_history"("walletId");

-- CreateIndex
CREATE INDEX "loyalty_history_shopId_idx" ON "loyalty_history"("shopId");

-- CreateIndex
CREATE INDEX "loyalty_history_saleId_idx" ON "loyalty_history"("saleId");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_loyaltyTierId_fkey" FOREIGN KEY ("loyaltyTierId") REFERENCES "loyalty_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_tiers" ADD CONSTRAINT "loyalty_tiers_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_wallets" ADD CONSTRAINT "loyalty_wallets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_wallets" ADD CONSTRAINT "loyalty_wallets_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_history" ADD CONSTRAINT "loyalty_history_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "loyalty_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_history" ADD CONSTRAINT "loyalty_history_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_history" ADD CONSTRAINT "loyalty_history_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_history" ADD CONSTRAINT "loyalty_history_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_history" ADD CONSTRAINT "loyalty_history_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "loyalty_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_history" ADD CONSTRAINT "loyalty_history_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
