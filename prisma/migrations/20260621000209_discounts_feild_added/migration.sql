/*
  Warnings:

  - You are about to drop the column `notes` on the `discounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "discounts" DROP COLUMN "notes",
ADD COLUMN     "description" TEXT;
