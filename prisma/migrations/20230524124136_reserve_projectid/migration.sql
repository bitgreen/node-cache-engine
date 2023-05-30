/*
  Warnings:

  - Added the required column `projectId` to the `BuyOrderReserved` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BuyOrderReserved" ADD COLUMN     "projectId" INTEGER NOT NULL;
