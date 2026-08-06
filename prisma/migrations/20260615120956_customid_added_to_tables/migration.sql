/*
  Warnings:

  - You are about to drop the column `poNumber` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `referenceNo` on the `StockTransfer` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNo` on the `invoices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customId]` on the table `PurchaseOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customId]` on the table `StockTransfer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customId]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customId]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customId,businessId]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customId]` on the table `sales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customId]` on the table `stock_logs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customId]` on the table `time_cards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customId` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customId` to the `StockTransfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customId` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customId` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customId` to the `stock_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customId` to the `time_cards` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EmployeeShop_businessId_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_poNumber_key";

-- DropIndex
DROP INDEX "StockTransfer_referenceNo_key";

-- DropIndex
DROP INDEX "invoices_invoiceNo_businessId_key";

-- AlterTable
ALTER TABLE "EmployeeShop" ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "assignedBy" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "poNumber",
ADD COLUMN     "customId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockTransfer" DROP COLUMN "referenceNo",
ADD COLUMN     "customId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "module" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "customId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "customId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "invoiceNo",
ADD COLUMN     "customId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "customId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "customId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stock_logs" ADD COLUMN     "customId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "time_cards" ADD COLUMN     "customId" TEXT NOT NULL,
ALTER COLUMN "totalHours" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "Sequence" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currentNo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sequence_businessId_idx" ON "Sequence"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Sequence_businessId_type_key" ON "Sequence"("businessId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_customId_key" ON "PurchaseOrder"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransfer_customId_key" ON "StockTransfer"("customId");

-- CreateIndex
CREATE INDEX "brands_businessId_name_idx" ON "brands"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customId_key" ON "customers"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_customId_key" ON "employees"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_customId_key" ON "invoices"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_customId_businessId_key" ON "invoices"("customId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_customId_key" ON "payments"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_customId_key" ON "sales"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_logs_customId_key" ON "stock_logs"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "time_cards_customId_key" ON "time_cards"("customId");
