/*
  Warnings:

  - You are about to drop the column `groupId` on the `Batch` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[batchGroupId,index]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "groupId",
ADD COLUMN     "index" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchGroupId_index_key" ON "Batch"("batchGroupId", "index");
