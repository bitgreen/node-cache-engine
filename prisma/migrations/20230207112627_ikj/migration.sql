/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[assetId]` on the table `BatchGroups` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Batch_uuid_key" ON "Batch"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "BatchGroups_assetId_key" ON "BatchGroups"("assetId");
