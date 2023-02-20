-- CreateTable
CREATE TABLE "BuyOrder" (
    "id" SERIAL NOT NULL,
    "creditsOwned" DECIMAL(65,30) NOT NULL,
    "retiredCredits" DECIMAL(65,30) NOT NULL,
    "creditPrice" DECIMAL(65,30) NOT NULL,
    "orderId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "investmentId" INTEGER,

    CONSTRAINT "BuyOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BuyOrder" ADD CONSTRAINT "BuyOrder_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
