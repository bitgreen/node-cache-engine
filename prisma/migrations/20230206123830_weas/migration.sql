-- DropForeignKey
ALTER TABLE "BuyOrder" DROP CONSTRAINT "BuyOrder_investmentId_fkey";

-- AddForeignKey
ALTER TABLE "BuyOrder" ADD CONSTRAINT "BuyOrder_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
