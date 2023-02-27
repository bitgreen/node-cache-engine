-- CreateTable
CREATE TABLE "CartItem" (
    "id" SERIAL NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "profilId" TEXT NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
