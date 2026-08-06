/*
  Warnings:

  - Added the required column `updatedAt` to the `time_cards` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TimeCardStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'MISSED_CLOCK_OUT');

-- AlterTable
ALTER TABLE "time_cards" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "TimeCardStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "time_cards_employeeId_idx" ON "time_cards"("employeeId");

-- CreateIndex
CREATE INDEX "time_cards_shopId_idx" ON "time_cards"("shopId");

-- CreateIndex
CREATE INDEX "time_cards_status_idx" ON "time_cards"("status");

-- AddForeignKey
ALTER TABLE "time_cards" ADD CONSTRAINT "time_cards_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
