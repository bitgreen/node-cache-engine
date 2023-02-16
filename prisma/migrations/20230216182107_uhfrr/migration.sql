/*
  Warnings:

  - You are about to drop the column `orderId` on the `BatchEntity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BatchEntity" DROP COLUMN "orderId",
ADD COLUMN     "calls" TEXT[];
