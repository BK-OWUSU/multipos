/*
  Warnings:

  - A unique constraint covering the columns `[customId]` on the table `loyalty` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customId` to the `loyalty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "loyalty" ADD COLUMN     "customId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_customId_key" ON "loyalty"("customId");
