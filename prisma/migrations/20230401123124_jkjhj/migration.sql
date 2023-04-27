/*
  Warnings:

  - The primary key for the `AssetTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `account` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `assetLogo` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `assetName` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `balanceUsd` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `nftImage` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `account` on the `TokenTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `TokenTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `balanceUsd` on the `TokenTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `tokencode` on the `TokenTransaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TokenTransaction_account_key";

-- AlterTable
ALTER TABLE "AssetTransaction" DROP CONSTRAINT "AssetTransaction_pkey",
DROP COLUMN "account",
DROP COLUMN "assetLogo",
DROP COLUMN "assetName",
DROP COLUMN "balance",
DROP COLUMN "balanceUsd",
DROP COLUMN "nftImage",
ADD COLUMN     "amount" TEXT,
ADD COLUMN     "blockNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "recipient" VARCHAR(48) NOT NULL DEFAULT E'',
ADD COLUMN     "sender" VARCHAR(48) NOT NULL DEFAULT E'',
ADD CONSTRAINT "AssetTransaction_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TokenTransaction" DROP COLUMN "account",
DROP COLUMN "balance",
DROP COLUMN "balanceUsd",
DROP COLUMN "tokencode",
ADD COLUMN     "amount" TEXT,
ADD COLUMN     "blockNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recipient" VARCHAR(48) NOT NULL DEFAULT E'',
ADD COLUMN     "sender" VARCHAR(48) NOT NULL DEFAULT E'',
ADD COLUMN     "tokenId" TEXT NOT NULL DEFAULT E'';

-- CreateTable
CREATE TABLE "AssetInfo" (
    "id" SERIAL NOT NULL,
    "assetName" TEXT,
    "assetLogo" TEXT,
    "nftImage" TEXT,

    CONSTRAINT "AssetInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssetInfo" ADD CONSTRAINT "AssetInfo_id_fkey" FOREIGN KEY ("id") REFERENCES "AssetTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
