-- CreateTable
CREATE TABLE "SellOrder" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "units" INTEGER NOT NULL,
    "pricePerUnit" DECIMAL(65,30) NOT NULL,
    "owner" TEXT NOT NULL,

    CONSTRAINT "SellOrder_pkey" PRIMARY KEY ("id")
);
