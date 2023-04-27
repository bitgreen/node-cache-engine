/*
  Warnings:

  - The primary key for the `AssetTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `recipient` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `recipient` on the `TokenTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `TokenTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[account]` on the table `TokenTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AssetTransaction" DROP CONSTRAINT "AssetTransaction_pkey",
DROP COLUMN "id",
DROP COLUMN "recipient",
DROP COLUMN "sender",
ADD COLUMN     "account" VARCHAR(48) NOT NULL DEFAULT E'',
ADD CONSTRAINT "AssetTransaction_pkey" PRIMARY KEY ("account", "assetId");

-- AlterTable
ALTER TABLE "TokenTransaction" DROP COLUMN "recipient",
DROP COLUMN "sender",
ADD COLUMN     "account" VARCHAR(48);

-- CreateIndex
CREATE UNIQUE INDEX "TokenTransaction_account_key" ON "TokenTransaction"("account");
