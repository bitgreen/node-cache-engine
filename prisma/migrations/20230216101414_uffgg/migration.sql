/*
  Warnings:

  - You are about to drop the column `createdProjects` on the `Profil` table. All the data in the column will be lost.
  - You are about to drop the column `isOriginator` on the `Profil` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Individual', 'Originator');

-- AlterTable
ALTER TABLE "Profil" DROP COLUMN "createdProjects",
DROP COLUMN "isOriginator",
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT E'Individual';
