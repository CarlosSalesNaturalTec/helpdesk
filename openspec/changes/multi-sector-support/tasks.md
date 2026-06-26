## 1. Database & Schema

- [x] 1.1 Update Prisma schema: Add `Sector` and `ProblemType` models.
- [x] 1.2 Update Prisma schema: Add `sectorId` to `User` and `Ticket`; add `problemTypeId` to `Ticket`.
- [x] 1.3 Create and apply Prisma migration for the schema changes.
- [x] 1.4 Optional: Create a seed script or manual SQL script to populate a default "Tecnologia" sector for testing data.

## 2. Backend API - Sectors & Problem Types

- [x] 2.1 Implement `Sector` CRUD API endpoints (`GET`, `POST`, `PUT`, `DELETE` at `/api/sectors`).
- [x] 2.2 Implement `ProblemType` CRUD API endpoints (`GET`, `POST`, `PUT`, `DELETE` at `/api/problem-types`).

## 3. Backend API - Ticket & User Adjustments

- [x] 3.1 Update User API (`POST` and `PUT` `/api/users`) to enforce `sectorId` requirement for users with the `Técnico` role.
- [x] 3.2 Update Ticket Creation API (`POST` `/api/tickets`) to require and validate `sectorId` and `problemTypeId`.
- [x] 3.3 Update Ticket Query API (`GET` `/api/tickets`) to append a sector filter for users with the `Técnico` role.
- [x] 3.4 Update Dashboard API (metrics/charts) to append a sector filter for users with the `Técnico` role.

## 4. Frontend - Admin Screens

- [x] 4.1 Create Admin UI for managing Sectors (List, Create, Edit, Inactivate).
- [x] 4.2 Create Admin UI for managing Problem Types within a Sector (List, Create, Edit, Set SLA).

## 5. Frontend - User & Ticket Flows

- [x] 5.1 Update User Management UI to include a `Setor` dropdown when editing or creating a "Técnico".
- [x] 5.2 Update Ticket Creation UI to replace "Categoria" with cascading dropdowns for "Setor" and "Tipo de Problema".
- [x] 5.3 Verify Dashboard UI correctly handles and displays the sector-filtered data for Technicians.
- [x] 5.4 Update Ticket List UI (Query) to display Sector/ProblemType columns instead of Category, and verify filtering.
