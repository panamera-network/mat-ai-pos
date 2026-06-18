/*
  Warnings:

  - A unique constraint covering the columns `[menuItemId,inventoryItemId]` on the table `MenuItemIngredient` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "MenuItemIngredient" DROP CONSTRAINT "MenuItemIngredient_inventoryItemId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItemIngredient" DROP CONSTRAINT "MenuItemIngredient_menuItemId_fkey";

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "unitOfMeasure" TEXT DEFAULT 'g',
ADD COLUMN     "unitPrice" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "cost" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "profitMargin" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "MenuItemIngredient" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MenuItemIngredient_menuItemId_idx" ON "MenuItemIngredient"("menuItemId");

-- CreateIndex
CREATE INDEX "MenuItemIngredient_inventoryItemId_idx" ON "MenuItemIngredient"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemIngredient_menuItemId_inventoryItemId_key" ON "MenuItemIngredient"("menuItemId", "inventoryItemId");

-- AddForeignKey
ALTER TABLE "MenuItemIngredient" ADD CONSTRAINT "MenuItemIngredient_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemIngredient" ADD CONSTRAINT "MenuItemIngredient_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
