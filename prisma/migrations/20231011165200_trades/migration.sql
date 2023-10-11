/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `AssetTransaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId]` on the table `BuyOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hash]` on the table `TokenTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hash` to the `AssetTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hash` to the `TokenTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AssetTransaction" ADD COLUMN     "hash" VARCHAR(68) NOT NULL;

-- AlterTable
ALTER TABLE "TokenTransaction" ADD COLUMN     "hash" VARCHAR(68) NOT NULL;

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "blockNumber" INTEGER NOT NULL DEFAULT 0,
    "projectId" INTEGER NOT NULL,
    "units" INTEGER NOT NULL,
    "creditPrice" TEXT NOT NULL,
    "buyOrderId" INTEGER NOT NULL,
    "sellOrderId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "hash" VARCHAR(68) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trade_hash_key" ON "Trade"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "AssetTransaction_hash_key" ON "AssetTransaction"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "BuyOrder_orderId_key" ON "BuyOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenTransaction_hash_key" ON "TokenTransaction"("hash");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_buyOrderId_fkey" FOREIGN KEY ("buyOrderId") REFERENCES "BuyOrder"("orderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_sellOrderId_fkey" FOREIGN KEY ("sellOrderId") REFERENCES "SellOrder"("orderId") ON DELETE CASCADE ON UPDATE CASCADE;
