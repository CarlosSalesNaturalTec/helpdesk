## Context

The helpdesk system currently assumes all tickets are IT-related. To support expanding into a Shared Services Center (CSC) that handles maintenance, cleaning, and other departmental requests, we need to generalize the categorization. Instead of just "Category", tickets will now be associated with a "Sector" (e.g., IT, Maintenance) and a "ProblemType" (e.g., Hardware, Plumbing). Furthermore, Technicians need to be mapped to a Sector so they only see relevant tickets.

## Goals / Non-Goals

**Goals:**
- Generalize ticket categorization by introducing Sector and ProblemType.
- Support SLA configuration per ProblemType.
- Restrict Technician access to tickets within their assigned Sector.
- Keep the ticket creation flow intuitive with cascading dropdowns (Sector -> ProblemType).

**Non-Goals:**
- Complex matrix organizational structures (e.g., a technician belonging to multiple sectors).
- Automated database migration scripts for production data (system is currently in testing, manual migration is acceptable).

## Decisions

1. **Database Schema Additions (Prisma):**
   - `Sector`: `id`, `name`, `active`, timestamps.
   - `ProblemType`: `id`, `name`, `slaMinutes`, `sectorId` (relation), `active`, timestamps.
   - We use `slaMinutes` to store the resolution time as an integer representing minutes to easily calculate deadlines.

2. **Database Schema Modifications (Prisma):**
   - `User`: Add `sectorId` (foreign key to `Sector`, nullable). Required at the application level if the user has a "Técnico" role.
   - `Ticket`: Add `sectorId` and `problemTypeId` (foreign keys). The existing `categoryId` (if present) will be removed or phased out.

3. **API & Data Access Logic:**
   - The ticket query logic (`GET /api/tickets`) will dynamically append a `sectorId: user.sectorId` filter to Prisma queries when the authenticated user has the Technician role.

4. **Frontend Architecture:**
   - The ticket creation form will utilize two dependent React state variables. When `selectedSector` changes, `selectedProblemType` will clear, and the ProblemType dropdown will filter its options based on the newly selected Sector.
   - Admin management screens will be added for CRUD operations on Sectors and ProblemTypes.

## Risks / Trade-offs

- **Risk:** Existing tickets in the testing database might lose their category reference if `categoryId` is dropped abruptly.
  - **Mitigation:** We will make the new fields (`sectorId`, `problemTypeId`) nullable initially or provide a basic seed script that creates a "Tecnologia" sector and maps existing data during the database update.
