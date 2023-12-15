-- AlterTable
ALTER TABLE "AssetTransaction" ADD COLUMN     "index" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reason" TEXT;
