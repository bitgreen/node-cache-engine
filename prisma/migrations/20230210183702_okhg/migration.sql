/*
  Warnings:

  - You are about to drop the column `investmentIdForRetire` on the `BuyOrder` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BuyOrder" DROP CONSTRAINT "BuyOrder_investmentIdForRetire_fkey";

-- AlterTable
ALTER TABLE "BuyOrder" DROP COLUMN "investmentIdForRetire";

-- CreateTable
CREATE TABLE "CreditsOwnedPerGroup" (
    "id" TEXT NOT NULL,
    "addressGroupId" TEXT,
    "creditsOwned" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "investmentId" TEXT,

    CONSTRAINT "CreditsOwnedPerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditsOwnedPerGroup_addressGroupId_key" ON "CreditsOwnedPerGroup"("addressGroupId");

-- AddForeignKey
ALTER TABLE "CreditsOwnedPerGroup" ADD CONSTRAINT "CreditsOwnedPerGroup_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
