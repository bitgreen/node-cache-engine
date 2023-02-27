/*
  Warnings:

  - The primary key for the `Block` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `number` on the `Block` table. All the data in the column will be lost.
  - Added the required column `blockNumber` to the `Block` table without a default value. This is not possible if the table is not empty.
  - Added the required column `count` to the `Block` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Block" DROP CONSTRAINT "Block_pkey",
DROP COLUMN "number",
ADD COLUMN     "blockNumber" INTEGER NOT NULL,
ADD COLUMN     "count" INTEGER NOT NULL,
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "Block_pkey" PRIMARY KEY ("id");
