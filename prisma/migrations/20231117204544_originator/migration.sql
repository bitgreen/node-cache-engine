/*
  Warnings:

  - You are about to drop the column `orginatorDescription` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `orginatorName` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "orginatorDescription",
DROP COLUMN "orginatorName",
ADD COLUMN     "originatorDescription" TEXT DEFAULT E'',
ADD COLUMN     "originatorName" TEXT DEFAULT E'';
