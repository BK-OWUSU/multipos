-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "logType" TEXT;

-- AlterTable
ALTER TABLE "stock_logs" ADD COLUMN     "action" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "logType" TEXT;
