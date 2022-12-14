-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('AGRICULTURE_FORESTRY_AND_OTHER_LAND_USE', 'CHEMICAL_INDUSTRY', 'ENERGY_DEMAND', 'ENERGY_DISTRIBUTION', 'ENERGY_INDUSTRIES', 'FUGITIVE_EMISSIONS_FROM_FUELS', 'FUGITIVE_EMISSIONS_FROM_CARBONS', 'LIVESTOCK', 'MANUFACTURING_INDUSTRIES', 'METAL_PRODUCTION', 'MINING_MINERAL_PRODUCTION', 'TRANSPORT', 'WASTE_HANDLING');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "type" "ProjectType" NOT NULL DEFAULT E'AGRICULTURE_FORESTRY_AND_OTHER_LAND_USE';
