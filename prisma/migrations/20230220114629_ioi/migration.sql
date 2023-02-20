/*
  Warnings:

  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_projectId_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "location" TEXT NOT NULL DEFAULT E'';

-- DropTable
DROP TABLE "Location";
