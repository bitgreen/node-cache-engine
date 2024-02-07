/*
  Warnings:

  - Added the required column `owner` to the `CreditTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "owner" TEXT NOT NULL,
ALTER COLUMN "from" DROP NOT NULL,
ALTER COLUMN "to" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "buyer" VARCHAR(48) NOT NULL DEFAULT E'',
ADD COLUMN     "seller" VARCHAR(48) NOT NULL DEFAULT E'';
