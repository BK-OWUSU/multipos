-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('PRODUCT', 'FIXED_AMOUNT', 'PERCENTAGE', 'FREE_SERVICE');

-- DropForeignKey
ALTER TABLE "loyalty" DROP CONSTRAINT "loyalty_customerId_fkey";

-- AlterTable
ALTER TABLE "loyalty_history" ADD COLUMN     "performedById" TEXT,
ADD COLUMN     "rewardId" TEXT;

-- CreateTable
CREATE TABLE "loyalty_rewards" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" VARCHAR(255),
    "pointsRequired" INTEGER NOT NULL,
    "rewardType" "RewardType" NOT NULL DEFAULT 'PRODUCT',
    "rewardValue" DECIMAL(10,2),
    "applicableSku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loyalty_rewards_businessId_idx" ON "loyalty_rewards"("businessId");

-- AddForeignKey
ALTER TABLE "loyalty" ADD CONSTRAINT "loyalty_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
