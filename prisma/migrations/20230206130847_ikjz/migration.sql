/*
  Warnings:

  - You are about to alter the column `creditsOwned` on the `BuyOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `retiredCredits` on the `BuyOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `creditsOwned` on the `Investment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `retiredCredits` on the `Investment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `quantity` on the `Investment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "BuyOrder" ALTER COLUMN "creditsOwned" SET DATA TYPE INTEGER,
ALTER COLUMN "retiredCredits" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Investment" ALTER COLUMN "creditsOwned" SET DATA TYPE INTEGER,
ALTER COLUMN "retiredCredits" SET DATA TYPE INTEGER,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER;
