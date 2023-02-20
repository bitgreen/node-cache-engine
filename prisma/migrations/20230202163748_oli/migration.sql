-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_batchGroupId_fkey";

-- DropForeignKey
ALTER TABLE "BatchGroups" DROP CONSTRAINT "BatchGroups_projectId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_profilId_fkey";

-- DropForeignKey
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_profilAddress_fkey";

-- DropForeignKey
ALTER TABLE "KYC" DROP CONSTRAINT "KYC_profilAddress_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_projectId_fkey";

-- DropForeignKey
ALTER TABLE "RegistryDetails" DROP CONSTRAINT "RegistryDetails_registryId_fkey";

-- DropForeignKey
ALTER TABLE "Royalties" DROP CONSTRAINT "Royalties_projectId_fkey";

-- DropForeignKey
ALTER TABLE "SdgDetails" DROP CONSTRAINT "SdgDetails_projectId_fkey";

-- DropForeignKey
ALTER TABLE "SellOrder" DROP CONSTRAINT "SellOrder_investmentId_fkey";

-- DropForeignKey
ALTER TABLE "Star" DROP CONSTRAINT "Star_profilAddress_fkey";

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchGroups" ADD CONSTRAINT "BatchGroups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_batchGroupId_fkey" FOREIGN KEY ("batchGroupId") REFERENCES "BatchGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryDetails" ADD CONSTRAINT "RegistryDetails_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Royalties" ADD CONSTRAINT "Royalties_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdgDetails" ADD CONSTRAINT "SdgDetails_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_profilAddress_fkey" FOREIGN KEY ("profilAddress") REFERENCES "Profil"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellOrder" ADD CONSTRAINT "SellOrder_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KYC" ADD CONSTRAINT "KYC_profilAddress_fkey" FOREIGN KEY ("profilAddress") REFERENCES "Profil"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Star" ADD CONSTRAINT "Star_profilAddress_fkey" FOREIGN KEY ("profilAddress") REFERENCES "Profil"("address") ON DELETE CASCADE ON UPDATE CASCADE;
