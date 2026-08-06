/*
  Warnings:

  - A unique constraint covering the columns `[customId]` on the table `cash_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customId` to the `cash_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cash_sessions" ADD COLUMN     "customId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cash_sessions_customId_key" ON "cash_sessions"("customId");
