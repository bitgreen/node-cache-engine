-- DropForeignKey
ALTER TABLE "AssetTransaction" DROP CONSTRAINT "AssetTransaction_assetId_fkey";

-- AlterTable
ALTER TABLE "AssetTransaction" ALTER COLUMN "amount" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "BatchGroups" ADD COLUMN     "availableCredits" JSONB;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "type" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "AssetTransaction" ADD CONSTRAINT "AssetTransaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "BatchGroups"("assetId") ON DELETE SET NULL ON UPDATE SET NULL;
