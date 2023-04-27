/*
  Warnings:

  - The primary key for the `Block` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `blockNumber` on the `Block` table. All the data in the column will be lost.
  - You are about to drop the column `count` on the `Block` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Block` table. All the data in the column will be lost.
  - Added the required column `number` to the `Block` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Block" DROP CONSTRAINT "Block_pkey",
DROP COLUMN "blockNumber",
DROP COLUMN "count",
DROP COLUMN "id",
ADD COLUMN     "fetchedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "number" INTEGER NOT NULL,
ALTER COLUMN "createdAt" DROP DEFAULT,
ADD CONSTRAINT "Block_pkey" PRIMARY KEY ("number");
