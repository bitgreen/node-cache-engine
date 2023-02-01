-- AlterTable
ALTER TABLE "Profil" ADD COLUMN     "createdProjects" INTEGER[],
ADD COLUMN     "isOriginator" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "listedToMarketplace" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Investment" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "creditsOwned" DECIMAL(65,30) NOT NULL,
    "retiredCredits" DECIMAL(65,30) NOT NULL,
    "creditPrice" DECIMAL(65,30) NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "profilAddress" TEXT,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_profilAddress_fkey" FOREIGN KEY ("profilAddress") REFERENCES "Profil"("address") ON DELETE SET NULL ON UPDATE CASCADE;
