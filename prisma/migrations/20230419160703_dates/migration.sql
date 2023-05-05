/*
  Warnings:

  - You are about to drop the column `created` on the `BuyOrder` table. All the data in the column will be lost.
  - You are about to drop the column `created` on the `CreditTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `created` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `updated` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `created` on the `SellOrder` table. All the data in the column will be lost.
  - Added the required column `createdAt` to the `BuyOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAt` to the `CreditTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAt` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAt` to the `SellOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AssetTransaction" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BuyOrder" DROP COLUMN "created",
ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL;

-- AlterTable
ALTER TABLE "CreditTransaction" DROP COLUMN "created",
ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "created",
DROP COLUMN "updated",
ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "SellOrder" DROP COLUMN "created",
ADD COLUMN     "cancelledAt" TIMESTAMP(6),
ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL;

-- AlterTable
ALTER TABLE "TokenTransaction" ALTER COLUMN "createdAt" DROP DEFAULT;
