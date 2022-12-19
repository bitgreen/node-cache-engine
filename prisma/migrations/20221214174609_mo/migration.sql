-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "SdgType" AS ENUM ('NoPoverty', 'ZeroHunger', 'GoodHealthAndWellBeing', 'QualityEducation', 'GenderEquality', 'CleanWaterAndSanitation', 'AffordableAndCleanEnergy', 'DecentWorkAndEconomicGrowth', 'IndustryInnovationAndInfrastructure', 'ReducedInequalities', 'SustainableCitiesAndCommunities', 'ResponsibleConsumptionAndProduction', 'ClimateAction', 'LifeBelowWater', 'LifeOnLand', 'PeaceJusticeAndStrongInstitutions', 'ParternshipsForTheGoals');

-- CreateEnum
CREATE TYPE "ProjectState" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "RegistryName" AS ENUM ('Verra', 'GoldStandard', 'AmericanCarbonRegistry', 'ClimateActionReserve');

-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL,
    "originator" VARCHAR(64) NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "images" TEXT[],
    "videos" TEXT[],
    "documents" TEXT[],
    "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "approved" BOOLEAN DEFAULT false,
    "state" "ProjectState" NOT NULL DEFAULT E'SUBMITTED',

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "projectId" INTEGER,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchGroups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR,
    "uuid" TEXT,
    "assetId" INTEGER NOT NULL,
    "totalSupply" INTEGER,
    "minted" INTEGER,
    "retired" INTEGER,
    "projectId" INTEGER,

    CONSTRAINT "BatchGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR,
    "uuid" TEXT,
    "issuanceYear" INTEGER,
    "startDate" INTEGER,
    "endDate" INTEGER,
    "totalSupply" INTEGER,
    "minted" INTEGER,
    "retired" INTEGER,
    "batchGroupId" INTEGER NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistryDetails" (
    "id" TEXT NOT NULL,
    "registry" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "regName" TEXT NOT NULL,
    "registryId" INTEGER NOT NULL,

    CONSTRAINT "RegistryDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Royalties" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "accountId" VARCHAR(64) NOT NULL,
    "percentOfFees" REAL,

    CONSTRAINT "Royalties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdgDetails" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "sdgType" "SdgType",
    "description" TEXT,
    "references" TEXT,

    CONSTRAINT "SdgDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profil" (
    "address" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "email" TEXT,
    "emailStatus" "VerificationStatus" NOT NULL DEFAULT E'NOT_VERIFIED',
    "emailVerifiedAt" TIMESTAMP(3),
    "activityTransactionReceipts" BOOLEAN NOT NULL DEFAULT false,
    "activityOffersFilled" BOOLEAN NOT NULL DEFAULT false,
    "marketingNews" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Profil_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "KYC" (
    "profilAddress" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT E'NOT_VERIFIED',
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Address" TEXT NOT NULL,
    "Country" TEXT NOT NULL,

    CONSTRAINT "KYC_pkey" PRIMARY KEY ("profilAddress")
);

-- CreateTable
CREATE TABLE "Star" (
    "profilAddress" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "Star_pkey" PRIMARY KEY ("profilAddress","projectId")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" INTEGER NOT NULL,
    "owner" VARCHAR(48),
    "issuer" VARCHAR(48),
    "admin" VARCHAR(48),
    "freezer" VARCHAR(48),
    "supply" INTEGER,
    "deposit" INTEGER,
    "minBalance" INTEGER,
    "isSufficient" BOOLEAN NOT NULL DEFAULT false,
    "accounts" INTEGER,
    "sufficients" INTEGER,
    "approvals" INTEGER,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "kyc_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransaction" (
    "id" SERIAL NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "hash" VARCHAR(66) NOT NULL,
    "sender" VARCHAR(48) NOT NULL,
    "recipient" VARCHAR(48) NOT NULL,
    "amount" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "AssetTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "hash" VARCHAR(66) NOT NULL,
    "sender" VARCHAR(64) NOT NULL,
    "recipient" VARCHAR(64) NOT NULL,
    "amount" DECIMAL(32,0) NOT NULL,
    "gasFees" DECIMAL(32,0) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "number" INTEGER NOT NULL,
    "hash" VARCHAR(66) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("number")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistryDetails_registryId_key" ON "RegistryDetails"("registryId");

-- CreateIndex
CREATE UNIQUE INDEX "Profil_email_key" ON "Profil"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AssetTransaction_hash_key" ON "AssetTransaction"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_hash_key" ON "Transaction"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Block_hash_key" ON "Block"("hash");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchGroups" ADD CONSTRAINT "BatchGroups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_batchGroupId_fkey" FOREIGN KEY ("batchGroupId") REFERENCES "BatchGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryDetails" ADD CONSTRAINT "RegistryDetails_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Royalties" ADD CONSTRAINT "Royalties_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdgDetails" ADD CONSTRAINT "SdgDetails_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KYC" ADD CONSTRAINT "KYC_profilAddress_fkey" FOREIGN KEY ("profilAddress") REFERENCES "Profil"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Star" ADD CONSTRAINT "Star_profilAddress_fkey" FOREIGN KEY ("profilAddress") REFERENCES "Profil"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
