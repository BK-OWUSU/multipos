-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "shopId" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_businessId_shopId_idx" ON "audit_logs"("businessId", "shopId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
