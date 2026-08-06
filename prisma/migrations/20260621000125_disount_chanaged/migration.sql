/*
  Warnings:

  - A unique constraint covering the columns `[customId]` on the table `discounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customId` to the `discounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "discounts" ADD COLUMN     "customId" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "discounts_customId_key" ON "discounts"("customId");
