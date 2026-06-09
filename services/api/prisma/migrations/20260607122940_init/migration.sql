-- DropForeignKey
ALTER TABLE "StockLog" DROP CONSTRAINT "StockLog_staffId_fkey";

-- AlterTable
ALTER TABLE "StockLog" ALTER COLUMN "staffId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StockLog" ADD CONSTRAINT "StockLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
