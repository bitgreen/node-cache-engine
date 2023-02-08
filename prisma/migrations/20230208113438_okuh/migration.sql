/*
  Warnings:

  - You are about to drop the column `batchPrice` on the `BatchEntity` table. All the data in the column will be lost.
  - Added the required column `assetId` to the `BatchEntity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creditPrice` to the `BatchEntity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `BatchEntity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BatchEntity" DROP COLUMN "batchPrice",
ADD COLUMN     "assetId" INTEGER NOT NULL,
ADD COLUMN     "creditPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "orderId" INTEGER NOT NULL;
