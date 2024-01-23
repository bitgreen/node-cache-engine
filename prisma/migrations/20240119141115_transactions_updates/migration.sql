/*
  Warnings:

  - You are about to drop the column `isMinted` on the `BatchGroups` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,groupId]` on the table `BatchGroups` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `BatchGroups` table without a default value. This is not possible if the table is not empty.
  - Made the column `groupId` on table `BatchGroups` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `projectId` to the `RegistryDetails` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BatchGroupType" AS ENUM ('CREDITS', 'DONATIONS', 'SHARES', 'FORWARDS');

-- DropForeignKey
ALTER TABLE "RegistryDetails" DROP CONSTRAINT "RegistryDetails_registryId_fkey";

-- AlterTable
ALTER TABLE "BatchGroups" DROP COLUMN "isMinted",
ADD COLUMN     "convertedToCredits" INTEGER,
ADD COLUMN     "convertedToForwards" INTEGER,
ADD COLUMN     "filled" INTEGER,
ADD COLUMN     "type" "BatchGroupType" NOT NULL,
ALTER COLUMN "assetId" DROP NOT NULL,
ALTER COLUMN "groupId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RegistryDetails" ADD COLUMN     "projectId" INTEGER NOT NULL,
ALTER COLUMN "registryId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TokenTransaction" ALTER COLUMN "from" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BatchGroups_projectId_groupId_key" ON "BatchGroups"("projectId", "groupId");

-- AddForeignKey
ALTER TABLE "RegistryDetails" ADD CONSTRAINT "RegistryDetails_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransaction" ADD CONSTRAINT "AssetTransaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "BatchGroups"("assetId") ON DELETE CASCADE ON UPDATE CASCADE;
