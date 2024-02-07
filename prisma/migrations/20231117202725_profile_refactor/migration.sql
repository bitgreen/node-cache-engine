/*
  Warnings:

  - You are about to drop the column `profilId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `profilAddress` on the `Investment` table. All the data in the column will be lost.
  - The primary key for the `KYC` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `profilAddress` on the `KYC` table. All the data in the column will be lost.
  - The primary key for the `Star` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `profilAddress` on the `Star` table. All the data in the column will be lost.
  - You are about to drop the `Profil` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `profileId` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileAddress` to the `KYC` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileAddress` to the `Star` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_profilId_fkey";

-- DropForeignKey
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_profilAddress_fkey";

-- DropForeignKey
ALTER TABLE "KYC" DROP CONSTRAINT "KYC_profilAddress_fkey";

-- DropForeignKey
ALTER TABLE "Star" DROP CONSTRAINT "Star_profilAddress_fkey";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "profilId",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Investment" DROP COLUMN "profilAddress",
ADD COLUMN     "profileAddress" TEXT;

-- AlterTable
ALTER TABLE "KYC" DROP CONSTRAINT "KYC_pkey",
DROP COLUMN "profilAddress",
ADD COLUMN     "profileAddress" TEXT NOT NULL,
ADD CONSTRAINT "KYC_pkey" PRIMARY KEY ("profileAddress");

-- AlterTable
ALTER TABLE "Star" DROP CONSTRAINT "Star_pkey",
DROP COLUMN "profilAddress",
ADD COLUMN     "profileAddress" TEXT NOT NULL,
ADD CONSTRAINT "Star_pkey" PRIMARY KEY ("profileAddress", "projectId");

-- DropTable
DROP TABLE "Profil";

-- CreateTable
CREATE TABLE "Profile" (
    "address" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "orginatorName" TEXT DEFAULT E'',
    "orginatorDescription" TEXT DEFAULT E'',
    "email" TEXT,
    "emailStatus" "VerificationStatus" NOT NULL DEFAULT E'NOT_VERIFIED',
    "emailVerifiedAt" TIMESTAMP(3),
    "activityTransactionReceipts" BOOLEAN NOT NULL DEFAULT false,
    "activityOffersFilled" BOOLEAN NOT NULL DEFAULT false,
    "marketingNews" BOOLEAN NOT NULL DEFAULT false,
    "userType" "UserType" NOT NULL DEFAULT E'Individual',

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("address")
);

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_profileAddress_fkey" FOREIGN KEY ("profileAddress") REFERENCES "Profile"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KYC" ADD CONSTRAINT "KYC_profileAddress_fkey" FOREIGN KEY ("profileAddress") REFERENCES "Profile"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Star" ADD CONSTRAINT "Star_profileAddress_fkey" FOREIGN KEY ("profileAddress") REFERENCES "Profile"("address") ON DELETE CASCADE ON UPDATE CASCADE;
