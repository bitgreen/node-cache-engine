/*
  Warnings:

  - You are about to alter the column `batchPrice` on the `BatchEntity` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `creditPrice` on the `BuyOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `projectPrices` on the `CartItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `creditPrice` on the `Investment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `pricePerUnit` on the `SellOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'SALE', 'RETIRE');

-- AlterTable
ALTER TABLE "BatchEntity" ALTER COLUMN "batchPrice" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "BuyOrder" ADD COLUMN     "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "creditPrice" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "projectPrices" SET DATA TYPE DOUBLE PRECISION[];

-- AlterTable
ALTER TABLE "Investment" ALTER COLUMN "creditPrice" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SellOrder" ADD COLUMN     "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "pricePerUnit" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "creditPrice" DOUBLE PRECISION NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fee" DOUBLE PRECISION NOT NULL,
    "profilAddress" TEXT,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_profilAddress_fkey" FOREIGN KEY ("profilAddress") REFERENCES "Profil"("address") ON DELETE CASCADE ON UPDATE CASCADE;
