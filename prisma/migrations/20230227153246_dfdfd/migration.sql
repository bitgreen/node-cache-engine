/*
  Warnings:

  - Made the column `account` on table `TokenTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TokenTransaction" ALTER COLUMN "account" SET NOT NULL;
