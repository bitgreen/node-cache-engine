/*
  Warnings:

  - A unique constraint covering the columns `[addressProjectId]` on the table `Investment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BuyOrder" ADD COLUMN     "investmentIdForRetire" TEXT;

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "addressProjectId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Investment_addressProjectId_key" ON "Investment"("addressProjectId");

-- AddForeignKey
ALTER TABLE "BuyOrder" ADD CONSTRAINT "BuyOrder_investmentIdForRetire_fkey" FOREIGN KEY ("investmentIdForRetire") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
