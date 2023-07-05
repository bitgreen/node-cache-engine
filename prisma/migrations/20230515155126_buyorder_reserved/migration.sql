/*
  Warnings:

  - You are about to drop the column `investmentIdTemp` on the `BuyOrder` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BuyOrder" DROP CONSTRAINT "BuyOrder_investmentIdTemp_fkey";

-- AlterTable
ALTER TABLE "BuyOrder" DROP COLUMN "investmentIdTemp";

-- CreateTable
CREATE TABLE "BuyOrderReserved" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "creditPrice" DOUBLE PRECISION NOT NULL,
    "adress" TEXT NOT NULL,
    "buyorderId" INTEGER NOT NULL,
    "sellorderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "BuyOrderReserved_pkey" PRIMARY KEY ("id")
);
