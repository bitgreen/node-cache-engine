-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "projectImageUrl" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "projectPrices" DECIMAL(65,30)[];
