/*
  Warnings:

  - The primary key for the `Investment` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "BuyOrder" DROP CONSTRAINT "BuyOrder_investmentId_fkey";

-- DropForeignKey
ALTER TABLE "SellOrder" DROP CONSTRAINT "SellOrder_investmentId_fkey";

-- AlterTable
ALTER TABLE "BuyOrder" ALTER COLUMN "investmentId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Investment_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Investment_id_seq";

-- AlterTable
ALTER TABLE "SellOrder" ALTER COLUMN "investmentId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "BuyOrder" ADD CONSTRAINT "BuyOrder_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellOrder" ADD CONSTRAINT "SellOrder_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
