/*
  Warnings:

  - The values [TRANSFERRED,TRADED,SELL_ORDER_CREATED,SELL_ORDER_CANCELLED] on the enum `AssetTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Trade` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[hash,owner]` on the table `AssetTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssetTransactionType_new" AS ENUM ('SENT', 'RECEIVED', 'PURCHASED', 'SOLD', 'RETIRED', 'ISSUED', 'ORDER_CREATED', 'ORDER_CANCELLED');
ALTER TABLE "AssetTransaction" ALTER COLUMN "type" TYPE "AssetTransactionType_new" USING ("type"::text::"AssetTransactionType_new");
ALTER TYPE "AssetTransactionType" RENAME TO "AssetTransactionType_old";
ALTER TYPE "AssetTransactionType_new" RENAME TO "AssetTransactionType";
DROP TYPE "AssetTransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_buyOrderId_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_sellOrderId_fkey";

-- DropIndex
DROP INDEX "AssetTransaction_hash_key";

-- AlterTable
ALTER TABLE "AssetTransaction" ADD COLUMN     "owner" VARCHAR(48) NOT NULL DEFAULT E'';

-- DropTable
DROP TABLE "Trade";

-- CreateIndex
CREATE UNIQUE INDEX "AssetTransaction_hash_owner_key" ON "AssetTransaction"("hash", "owner");
