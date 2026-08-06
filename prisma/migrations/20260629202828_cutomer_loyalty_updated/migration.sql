/*
  Warnings:

  - A unique constraint covering the columns `[phone,businessId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LoyaltyActionType" AS ENUM ('EARNED', 'REDEEMED', 'MANUAL_ADJUSTMENT');

-- DropIndex
DROP INDEX "customers_phone_idx";

-- CreateTable
CREATE TABLE "loyalty_configurations" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "amountPerPoint" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "valuePerPoint" DECIMAL(10,2) NOT NULL DEFAULT 0.10,
    "minPointsToRedeem" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_history" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "saleId" TEXT,
    "points" INTEGER NOT NULL,
    "type" "LoyaltyActionType" NOT NULL,
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_configurations_businessId_key" ON "loyalty_configurations"("businessId");

-- CreateIndex
CREATE INDEX "loyalty_history_customerId_idx" ON "loyalty_history"("customerId");

-- CreateIndex
CREATE INDEX "loyalty_history_businessId_idx" ON "loyalty_history"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_businessId_key" ON "customers"("phone", "businessId");

-- AddForeignKey
ALTER TABLE "loyalty_configurations" ADD CONSTRAINT "loyalty_configurations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_history" ADD CONSTRAINT "loyalty_history_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
