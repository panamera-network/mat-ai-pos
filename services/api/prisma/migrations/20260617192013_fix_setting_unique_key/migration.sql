/*
  Warnings:

  - A unique constraint covering the columns `[key,outletId]` on the table `Setting` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "outletId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "outletId" TEXT;

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "outletId" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "outletId" TEXT;

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryItem_outletId_idx" ON "InventoryItem"("outletId");

-- CreateIndex
CREATE INDEX "Order_outletId_idx" ON "Order"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_outletId_key" ON "Setting"("key", "outletId");

-- CreateIndex
CREATE INDEX "Staff_outletId_idx" ON "Staff"("outletId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
