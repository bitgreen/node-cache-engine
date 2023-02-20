/*
  Warnings:

  - You are about to drop the column `amount` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `blockNumber` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `hash` on the `AssetTransaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AssetTransaction_hash_key";

-- AlterTable
ALTER TABLE "AssetTransaction" DROP COLUMN "amount",
DROP COLUMN "blockNumber",
DROP COLUMN "hash",
ADD COLUMN     "assetLogo" TEXT,
ADD COLUMN     "assetName" TEXT,
ADD COLUMN     "balance" TEXT,
ADD COLUMN     "balanceUsd" TEXT,
ADD COLUMN     "nftImage" TEXT,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "id" SERIAL NOT NULL,
    "sender" VARCHAR(48) NOT NULL,
    "recipient" VARCHAR(48) NOT NULL,
    "tokencode" TEXT NOT NULL,
    "tokenLogo" TEXT,
    "balance" TEXT,
    "balanceUsd" TEXT,
    "tokenName" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);
