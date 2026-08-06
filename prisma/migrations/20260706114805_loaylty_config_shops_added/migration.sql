-- AlterTable
ALTER TABLE "loyalty_configurations" ADD COLUMN     "applyToAllShops" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "loyalty_config_shops" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_config_shops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_config_shops_configId_shopId_key" ON "loyalty_config_shops"("configId", "shopId");

-- AddForeignKey
ALTER TABLE "loyalty_config_shops" ADD CONSTRAINT "loyalty_config_shops_configId_fkey" FOREIGN KEY ("configId") REFERENCES "loyalty_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_config_shops" ADD CONSTRAINT "loyalty_config_shops_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
