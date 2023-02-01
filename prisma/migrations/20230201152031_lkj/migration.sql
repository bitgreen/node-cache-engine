-- AlterTable
ALTER TABLE "SellOrder" ADD COLUMN     "investmentId" INTEGER,
ADD COLUMN     "isCancel" BOOLEAN DEFAULT false,
ADD COLUMN     "isSold" BOOLEAN DEFAULT false;

-- AddForeignKey
ALTER TABLE "SellOrder" ADD CONSTRAINT "SellOrder_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
