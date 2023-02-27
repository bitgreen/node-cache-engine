/*
  Warnings:

  - The `regName` column on the `RegistryDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "RegistryDetails" DROP COLUMN "regName",
ADD COLUMN     "regName" "RegistryName";
