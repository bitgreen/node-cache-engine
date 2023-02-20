-- DropForeignKey
ALTER TABLE "BatchEntity" DROP CONSTRAINT "BatchEntity_batchEntityId_fkey";

-- AddForeignKey
ALTER TABLE "BatchEntity" ADD CONSTRAINT "BatchEntity_batchEntityId_fkey" FOREIGN KEY ("batchEntityId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
