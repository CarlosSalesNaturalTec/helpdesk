/*
  Warnings:

  - You are about to drop the column `tipoProblema` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "tipoProblema",
ADD COLUMN     "problemTypeId" INTEGER,
ADD COLUMN     "sectorId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sectorId" INTEGER;

-- DropEnum
DROP TYPE "TipoProblema";

-- CreateTable
CREATE TABLE "Sector" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemType" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slaMinutes" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "sectorId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sector_nome_key" ON "Sector"("nome");

-- AddForeignKey
ALTER TABLE "ProblemType" ADD CONSTRAINT "ProblemType_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_problemTypeId_fkey" FOREIGN KEY ("problemTypeId") REFERENCES "ProblemType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
