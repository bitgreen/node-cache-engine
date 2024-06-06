-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "userType" DROP NOT NULL,
ALTER COLUMN "userType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "country" TEXT;
