-- Rename Role enum value GESTOR_TI -> GESTOR (preserves existing rows;
-- the default Prisma-generated SQL would drop/recreate the type and fail
-- with dependent columns).
ALTER TYPE "Role" RENAME VALUE 'GESTOR_TI' TO 'GESTOR';

-- Ticket.sectorId becomes required: a ticket without a sector is invisible
-- to every scoped Gestor/Técnico. Drop the SET NULL foreign key first since
-- it is incompatible with a NOT NULL column, then recreate it as RESTRICT
-- (matching ProblemType_sectorId_fkey).
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_sectorId_fkey";

ALTER TABLE "Ticket" ALTER COLUMN "sectorId" SET NOT NULL;

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
