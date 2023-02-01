/*
  Warnings:

  - The primary key for the `SellOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `SellOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SellOrder" DROP CONSTRAINT "SellOrder_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "SellOrder_pkey" PRIMARY KEY ("orderId");
