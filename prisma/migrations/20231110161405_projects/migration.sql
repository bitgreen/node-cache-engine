/*
  Warnings:

  - A unique constraint covering the columns `[projectId,sdgType]` on the table `SdgDetails` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Batch_uuid_key";

-- CreateIndex
CREATE UNIQUE INDEX "SdgDetails_projectId_sdgType_key" ON "SdgDetails"("projectId", "sdgType");
