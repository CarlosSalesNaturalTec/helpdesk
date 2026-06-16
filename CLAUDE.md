# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HelpDesk system for an Instituto with multiple Unidades — a centralized ticketing platform for IT support. The system supports 5 personas (Solicitante, Técnico, Gestor de TI, Diretor, Administrador do Sistema) with strict data isolation between units (Unidades).

**Tech Stack:** React 18 + TypeScript (frontend), Node.js + TypeScript + Fastify (backend), PostgreSQL 15 + Prisma ORM, Zod (shared validation), JWT + bcrypt (auth), PDFKit (PDF generation), Recharts (charts), TanStack React Query (data fetching), React Router v6 (routing).

## Repository Structure

This is an **npm workspaces monorepo** with three packages:

```
shared/         # @helpdesk/shared — Zod schemas & TypeScript types shared front↔back
backend/        # @helpdesk/backend — Fastify REST API server
frontend/       # SPA with Vite + React + React Router
openspec/       # Spec-driven development: config, specs/, changes/
prisma/         # Database schema & migrations (singular, not under backend/)
```

## Commands

```bash
# From repo root:
npm run dev          # Start all workspaces in parallel (backend + frontend + shared watch)
npm run build        # Build all workspaces

# Backend only:
npm run dev --workspace=backend       # Start backend with tsx watch on port 3001

# Frontend only:
npm run dev --workspace=frontend      # Vite dev server (default port 5173)

# Database:
docker-compose up -d                  # Start PostgreSQL container
npx prisma migrate dev                # Apply migrations
npx prisma db seed                    # Seed with sample data (two units, all roles, tickets in all statuses)

# Prisma Studio:
npx prisma studio                     # Visual DB browser
```

**Default test users** (password: `user123`, admin: `admin123`):
- `admin@helpdesk.com` (Admin) — global access
- `solicitante@helpdesk.com`, `solicitante2@helpdesk.com`
- `tecnico@helpdesk.com`, `tecnico2@helpdesk.com`
- `gestor@helpdesk.com`

## Architecture

### Authentication & Authorization

JWT-based auth with three middleware hooks in `backend/src/middleware/auth.ts`:

1. **`authRequired`** — Validates Bearer token, attaches `request.user` (JwtPayload with id, nome, email, role, unidadeId, mustChangePassword)
2. **`requirePasswordChange`** — Blocks access to all routes except `/api/auth/change-password` if `mustChangePassword` is true. Enforced at first login after creation with temporary password.
3. **`requireRole(allowedRoles)`** — Role-gated access. Returns a preHandler function.

Login also implements brute-force protection: 5 failed attempts → 15-minute lockout.

### Data Isolation (RBAC + Unit Scoping)

The core security model: **Técnico, Gestor de TI, and Diretor can only see data from their own Unidade. Admin sees everything. Solicitante sees only their own tickets.**

Enforced in two layers:
- **Backend routes** apply scoping in every query (see `backend/src/routes/tickets.ts` lines 82-88 for the pattern). Every endpoint that returns data checks `user.role` / `user.unidadeId` and filters accordingly.
- **Frontend guards** (`frontend/src/components/Guards.tsx`): `ProtectedRoute` for auth + optional role check, `PasswordChangeGuard` redirects to password change if required.

The `unitFilter()` helper in `backend/src/lib/rbac.ts` encapsulates the unit-scoping rule.

### Ticket Workflow State Machine

Defined in `backend/src/lib/workflow.ts`:

```
ABERTO → EM_ANDAMENTO → RESOLVIDO → FECHADO
               ↕                        ↓
          AGUARDANDO                 REABERTO → EM_ANDAMENTO
```

- `validateTransition(current, new)` enforces valid state changes server-side
- Auto-attribution (Técnico): ABERTO → EM_ANDAMENTO (via `PATCH /:id/assign`)
- Reassignment (Gestor/Diretor): can reassign to any Técnico in the same Unidade (via `PATCH /:id/reassign`)
- Closing with satisfaction (Solicitante): `PATCH /:id/close` requires a nota 1-5
- Administrative close (Gestor/Diretor): `PATCH /:id/admin-close` — bypasses satisfaction survey
- Reopen: `PATCH /:id/reopen` requires motivo (min 10 chars)
- Messages: `POST /:id/messages` — if ticket is AGUARDANDO and sent by Solicitante, auto-transitions back to EM_ANDAMENTO

### Shared Schema Layer

`shared/src/schemas/` contains Zod schemas for auth, tickets, users, and unidades. Types are inferred and re-exported from `shared/src/index.ts`. Both backend and frontend import from `@helpdesk/shared` — this ensures validation parity between client and server.

### Backend Route Organization

Each resource domain has its own route module under `backend/src/routes/`:
- `auth.ts` — login, change-password, me
- `tickets.ts` — full ticket CRUD + workflow transitions + messages
- `usuarios.ts` — user CRUD (scoped by role)
- `unidades.ts` — unit CRUD (Admin only)
- `dashboard.ts` — status cards + trend chart data
- `reports.ts` — metrics cards + PDF export
- `notifications.ts` — in-app notification listing + mark-read

All routes are registered in `backend/src/index.ts` via `fastify.register()`.

### Frontend Structure

- **API layer:** `frontend/src/api/client.ts` — Axios instance with JWT interceptors
- **Auth state:** `frontend/src/context/AuthContext.tsx` — provides `user`, `login`, `logout`, `refreshUser`
- **Routing:** `frontend/src/App.tsx` defines all routes with role-gated `ProtectedRoute` wrappers
- **Layout:** `frontend/src/components/Layout.tsx` — shared shell with navbar, role-based nav links, notification bell
- **Pages:** `frontend/src/pages/` — one page per feature area

### PDF Generation

Backend generates PDFs server-side using PDFKit (`backend/src/routes/reports.ts`). The report includes metric cards, distribution charts, and metadata (timestamp, user). Frontend requests the PDF endpoint and triggers a download.

## OpenSpec (Spec-Driven Development)

This project uses **OpenSpec** for planning and tracking changes. The configuration is in `openspec/config.yaml`. Active specs live in `openspec/specs/`, and completed changes are archived in `openspec/changes/archive/`.

OpenSpec CLI commands are available via `.claude/commands/opsx/` (slash commands) and `.claude/skills/openspec-*`. Key workflow:
- `opsx:new` — create a new change proposal
- `opsx:apply` — implement tasks from an approved change
- `opsx:archive` — archive a completed change and update base specs
- `opsx:verify` — verify implementation against specs

Rules from `openspec/config.yaml`: proposals under 500 words, always include a "Non-goals" section, tasks broken into max 4-hour chunks.

## Key Constraints

- **Data isolation is paramount** — never expose another Unidade's data to a non-Admin user. Always filter by `unidadeId` in backend queries.
- **Workflow state machine** must be respected — use `validateTransition()` before any status change.
- **Password change enforcement** — users with `passwordResetRequired: true` must change password before accessing any other feature. The `requirePasswordChange` middleware handles this server-side; the `PasswordChangeGuard` handles it client-side.
- **Consistency between status enums** across Prisma schema, Zod enums in shared, and `ALLOWED_TRANSITIONS` in workflow.ts.
- **BigInt for ticket numbers** — `Ticket.numero` is Prisma `BigInt` (auto-increment). Always serialize to string in API responses to avoid JSON precision loss. The frontend receives `numero` as a string.
