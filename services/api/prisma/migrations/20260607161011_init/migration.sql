-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "costPerUnit" DOUBLE PRECISION,
ADD COLUMN     "supplier" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION;
