/*
  Warnings:

  - You are about to drop the column `recipient` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `recipient` on the `TokenTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `TokenTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `recipient` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `AssetInfo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CreditTransaction` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `AssetTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `AssetTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `from` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssetTransactionType" AS ENUM ('TRANSFERRED', 'TRADED', 'RETIRED', 'ISSUED', 'SELL_ORDER_CREATED', 'SELL_ORDER_CANCELLED');

-- DropForeignKey
ALTER TABLE "AssetInfo" DROP CONSTRAINT "AssetInfo_id_fkey";

-- DropForeignKey
ALTER TABLE "CreditTransaction" DROP CONSTRAINT "CreditTransaction_profilAddress_fkey";

-- AlterTable
ALTER TABLE "AssetTransaction" DROP COLUMN "recipient",
DROP COLUMN "sender",
ADD COLUMN     "feesPaid" TEXT,
ADD COLUMN     "from" VARCHAR(48) NOT NULL DEFAULT E'',
ADD COLUMN     "pricePerUnit" TEXT,
ADD COLUMN     "projectId" INTEGER,
ADD COLUMN     "to" VARCHAR(48) NOT NULL DEFAULT E'',
ADD COLUMN     "type" "AssetTransactionType" NOT NULL,
ALTER COLUMN "assetId" DROP NOT NULL,
DROP COLUMN "amount",
ADD COLUMN     "amount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TokenTransaction" DROP COLUMN "recipient",
DROP COLUMN "sender",
ADD COLUMN     "from" VARCHAR(48) NOT NULL DEFAULT E'',
ADD COLUMN     "to" VARCHAR(48) NOT NULL DEFAULT E'';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "recipient",
DROP COLUMN "sender",
ADD COLUMN     "from" VARCHAR(64) NOT NULL,
ADD COLUMN     "to" VARCHAR(64) NOT NULL;

-- DropTable
DROP TABLE "AssetInfo";

-- DropTable
DROP TABLE "CreditTransaction";

-- DropEnum
DROP TYPE "CreditTransactionType";
