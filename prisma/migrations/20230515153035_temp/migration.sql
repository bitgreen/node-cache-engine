-- AlterTable
ALTER TABLE "BuyOrder" ADD COLUMN     "investmentIdTemp" TEXT;

-- AddForeignKey
ALTER TABLE "BuyOrder" ADD CONSTRAINT "BuyOrder_investmentIdTemp_fkey" FOREIGN KEY ("investmentIdTemp") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
