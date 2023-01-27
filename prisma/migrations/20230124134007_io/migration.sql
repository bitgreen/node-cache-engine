-- CreateTable
CREATE TABLE "BatchEntity" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "batchPrice" DECIMAL(65,30) NOT NULL,
    "batchEntityId" INTEGER NOT NULL,

    CONSTRAINT "BatchEntity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BatchEntity" ADD CONSTRAINT "BatchEntity_batchEntityId_fkey" FOREIGN KEY ("batchEntityId") REFERENCES "CartItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
