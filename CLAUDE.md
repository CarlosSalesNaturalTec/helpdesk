# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SOLUTUS** (currently deployed for the client **Instituto Setes**) — a centralized ticketing platform for IT support across an Instituto with multiple Unidades. The system supports 5 personas (Solicitante, Técnico, Gestor de TI, Diretor, Administrador do Sistema) with strict data isolation between units (Unidades).

The displayed name is configurable at build/deploy time, not hardcoded: `APP_NAME` (default `SOLUTUS`) and `CLIENT_NAME` (default `Instituto Setes`) are two distinct concepts — see [Branding](#branding-configurable-app-name--client-name).

**Tech Stack:** React 18 + TypeScript (frontend), Node.js 20 + TypeScript + Fastify 4 (backend), PostgreSQL 15 + Prisma 5 (ORM), Zod (shared validation), JWT + bcryptjs (auth), PDFKit (PDF generation), Recharts + html-to-image (charts & chart snapshots), TanStack React Query (data fetching), React Router v6 (routing), `@fastify/multipart` + `@google-cloud/storage` (attachments), `@sendgrid/mail` (email notifications).

**Production hosting:** Google Cloud Platform — see [Deployment](#deployment-google-cloud-platform).

### Terminology (important)

The Prisma model `Sector` is surfaced to users as **"Tipo de Ocorrência"**, not "Setor". The rename happened at the UI/copy layer only — the database model, API paths (`/api/sectors`), and code identifiers (`sectorId`, `Sector`) kept the original names. Frontend files still live under `pages/setores/`. Do not rename code identifiers when touching this area; do keep all user-facing strings as "Tipo de Ocorrência".

`ProblemType` ("Tipo de Problema") is a child of `Sector` and carries the SLA in minutes.

### Branding (configurable app name / client name)

The application's displayed identity is not hardcoded — it is composed from two independent, build/deploy-time env vars: `APP_NAME` (the product, default `SOLUTUS`) and `CLIENT_NAME` (the current client, default `Instituto Setes`). `backend/src/lib/branding.ts` is the backend source of truth (`appName`, `clientName`, `fullName`, `brandingSlug()`); `frontend/src/config.ts` mirrors it for the frontend, reading `VITE_APP_NAME`/`VITE_CLIENT_NAME` (Vite requires the `VITE_` prefix to expose vars to client code). Both sides compose `fullName` as `` `${appName} — ${clientName}` `` (or just `appName` when `clientName` is empty), and derive a slug for downloaded filenames. Onboarding a new client is a new deploy with different env vars/substitutions, not a code change — see the `_APP_NAME`/`_CLIENT_NAME` substitutions in `cloudbuild.yaml`. There is no runtime/admin-UI branding configuration and no multi-tenancy — one deployed instance serves one client.

## Repository Structure

This is an **npm workspaces monorepo** with three packages:

```
shared/           # @helpdesk/shared — Zod schemas & TypeScript types shared front↔back
backend/          # @helpdesk/backend — Fastify REST API server
frontend/         # SPA with Vite + React + React Router
prisma/           # Database schema, migrations & seed (root level, NOT under backend/)
openspec/         # Spec-driven development: config, specs/, changes/archive/
docs/             # PRD, deploy guides, GCS bucket setup, historical docs
Dockerfile        # Multi-stage build for the backend image (Cloud Run)
cloudbuild.yaml   # Cloud Build CI/CD pipeline (build → Cloud Run → frontend → GCS)
docker-compose.yml# Local PostgreSQL 15 only
.env.example      # Documented environment variables
```

## Commands

```bash
# From repo root:
npm run dev          # Start all workspaces in parallel (backend + frontend + shared watch)
npm run build        # Build all workspaces (build shared before backend/frontend)

# Backend only:
npm run dev --workspace=backend       # tsx watch on port 3001
npm run build --workspace=backend     # tsc → backend/dist

# Frontend only:
npm run dev --workspace=frontend      # Vite dev server (default port 5173)
npm run build --workspace=frontend    # tsc -b && vite build → frontend/dist

# Shared (must be built first — backend and frontend import @helpdesk/shared):
npm run build --workspace=shared
npm run dev --workspace=shared        # tsc -w

# Database:
docker-compose up -d                  # Start PostgreSQL container (port 5432)
npx prisma migrate dev                # Apply/create migrations
npx prisma migrate deploy             # Apply migrations (production; runs on container start)
npx prisma generate                   # Regenerate the Prisma client
npx prisma db seed                    # Seed sample data
npx prisma studio                     # Visual DB browser
```

**Seed data** (`prisma/seed.ts`): two Unidades (`Unidade Central`, `Unidade Secundária`), one Sector (`Tecnologia`) with its ProblemTypes, six users, and tickets spanning the workflow statuses. The seed deletes and recreates all tickets/history/satisfaction on every run, but upserts users and units.

**Default test users** (password `user123`, except admin `admin123`):
- `admin@helpdesk.com` (ADMIN) — global access; `passwordResetRequired: true`, so it must change its password on first login
- `solicitante@helpdesk.com` (Unidade Central), `solicitante2@helpdesk.com` (Unidade Secundária)
- `tecnico@helpdesk.com` (Unidade Central, sector Tecnologia), `tecnico2@helpdesk.com` (Unidade Secundária, sector Tecnologia)
- `gestor@helpdesk.com` (GESTOR_TI, Unidade Central)

There is no seeded DIRETOR user — create one through the UI/API if you need to exercise that role.

## Architecture

### Authentication & Authorization

JWT-based auth (15-minute token expiry, `backend/src/lib/jwt.ts`) with three middleware hooks in `backend/src/middleware/auth.ts`:

1. **`authRequired`** — Validates the Bearer token and attaches `request.user` (`JwtPayload`: `id`, `nome`, `email`, `role`, `unidadeId`, `sectorId?`, `mustChangePassword`)
2. **`requirePasswordChange`** — Blocks every route except `/api/auth/change-password` when `mustChangePassword` is true, replying `403 { code: 'PASSWORD_CHANGE_REQUIRED' }`
3. **`requireRole(allowedRoles)`** — Role-gated access; returns a `preHandler` function

Login also implements brute-force protection: 5 failed attempts → 15-minute lockout (`failedLoginAttempts` / `lockedUntil` on `User`).

CORS is handled by a hand-rolled `onRequest` hook in `backend/src/index.ts` (not `@fastify/cors`), driven by `ALLOWED_ORIGIN` (defaults to `*`), and it short-circuits `OPTIONS` with 204.

### Data Isolation (RBAC + Unit and Sector Scoping)

The core security model: **Técnico, Gestor de TI and Diretor only see data from their own Unidade; Técnico is further narrowed to their own Sector. Admin sees everything. Solicitante sees only their own tickets.**

Enforced in two layers:
- **Backend routes** apply scoping in every query. The canonical pattern is in `backend/src/routes/tickets.ts` (ticket listing, ~lines 188-198): `SOLICITANTE` → `solicitanteId = user.id`; `TECNICO/GESTOR_TI/DIRETOR` → `unidadeId = user.unidadeId`, plus `sectorId = user.sectorId` when the user is a `TECNICO` with a sector; `ADMIN` → unfiltered. `backend/src/routes/dashboard.ts` applies the same rules inside its raw SQL, and lets Admin opt into `unidadeId`/`sectorId` query filters.
- **Frontend guards** (`frontend/src/components/Guards.tsx`): `ProtectedRoute` for auth + optional role check, `PasswordChangeGuard` redirects to the password-change page when required.

The `unitFilter()` helper in `backend/src/lib/rbac.ts` encapsulates the unit-scoping rule for single-record checks (Admin → always true, otherwise `user.unidadeId === targetUnidadeId`).

### Ticket Workflow State Machine

Defined in `backend/src/lib/workflow.ts`:

```
ABERTO → EM_ANDAMENTO → RESOLVIDO → FECHADO
               ↕                        ↓
          AGUARDANDO                 REABERTO → EM_ANDAMENTO
```

- `validateTransition(current, new)` enforces valid state changes server-side
- Auto-attribution (Técnico): ABERTO → EM_ANDAMENTO (`PATCH /:id/assign`)
- Reassignment (Gestor/Diretor/Admin): reassign to a Técnico in the same Unidade (`PATCH /:id/reassign`)
- Closing with satisfaction (Solicitante): `PATCH /:id/close` requires a nota 1-5
- Administrative close (Gestor/Diretor/Admin): `PATCH /:id/admin-close` — bypasses the satisfaction survey
- Reopen: `PATCH /:id/reopen` requires a motivo (min 10 chars)
- Messages: `POST /:id/messages` — if the ticket is AGUARDANDO and the sender is the Solicitante, it auto-transitions back to EM_ANDAMENTO

Every transition writes a `TicketHistory` row (`HistoryType`: ABERTURA, MENSAGEM, MUDANCA_STATUS, ATRIBUICAO, REATRIBUICAO, FECHAMENTO, REABERTURA) with a JSON `content` payload.

### Sectors & Problem Types

- `Sector` ("Tipo de Ocorrência") — Admin-only CRUD via `/api/sectors`. Has `ativo` for soft-disable.
- `ProblemType` ("Tipo de Problema") — Admin-only CRUD via `/api/problem-types`, belongs to a Sector, carries `slaMinutes`. `GET /api/problem-types?sectorId=` filters by sector.
- A `User` may have an optional `sectorId`; a `Ticket` carries both `sectorId` and `problemTypeId` (both optional) set at creation.
- `slaMinutes` is currently configuration/reporting metadata — no automated SLA breach job exists.

### Ticket Attachments (Google Cloud Storage)

One optional attachment per ticket, stored as denormalized columns on `Ticket` (`anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho`).

- **Validation** (`backend/src/lib/attachment.ts`): JPG, PNG, PDF, DOCX only; max 5 MB. `@fastify/multipart` enforces the same 5 MB limit at the transport level.
- **Storage** (`backend/src/lib/storage.ts`): uploads via `@google-cloud/storage` using Application Default Credentials (automatic in Cloud Run). Objects are made public and the public URL `https://storage.googleapis.com/<bucket>/<path>` is stored. Object path: `tickets/{ticketId}/{uuid}-{filename}`.
- **Endpoints:** `POST /api/tickets` accepts `multipart/form-data` with an optional file; `PATCH /api/tickets/:id/anexo` replaces it; `DELETE /api/tickets/:id/anexo` removes it.
- Ticket creation with an attachment creates the ticket first (the id is needed for the object path), then uploads; a failed upload deletes the ticket and returns 502.
- Requires `GCS_BUCKET_NAME`; without it, attachment requests fail with 500. See `docs/gcs-bucket-setup.md`.

### Notifications (in-app + email)

`backend/src/services/notification.ts` writes an in-app `Notification` row and fires an email through `backend/src/services/email.ts` for each event: `ASSUMIDO`, `AGUARDANDO`, `RESOLVIDO`, `FECHADO_ADMIN`, `REABERTO`, `MENSAGEM_AGUARDANDO`, `REATRIBUICAO`, plus a notice to the newly assigned `TECNICO`.

Both layers are **fail-soft by design** — errors are caught and logged, never propagated to the ticket operation. `EmailService.send` races SendGrid against a 3-second timeout and returns `false` on failure. When `SENDGRID_API_KEY` is unset the service runs in mock mode and logs the message instead of sending.

In-app notifications are read through `/api/notifications`, `/api/notifications/unread-count`, `PATCH /api/notifications/:id/read` and `PATCH /api/notifications/read-all`; the UI surfaces them in `frontend/src/components/NotificationBell.tsx`.

### Reports & Dashboard

- `GET /api/reports/metrics` — metric cards + distribution by `dimensao`, filtered by `periodo` (days) or a custom `dataInicio`/`dataFim` range, scoped by unit (Admin may pass `unidadeId`). Gestor/Diretor/Admin only.
- `POST /api/reports/pdf` — the frontend renders the Recharts chart to a PNG data URL with `html-to-image` and posts it together with the computed cards; the backend composes the PDF with PDFKit and streams it back as an attachment. **Chart rendering happens client-side** — the backend does not recompute metrics for the PDF.
- `GET /api/dashboard` — status cards and a 30-day trend series, both computed with `prisma.$queryRaw` (a `generate_series` day spine left-joined against tickets). Técnico/Gestor/Diretor/Admin only.

### Backend Route Organization

Each resource domain has its own route module under `backend/src/routes/`, all registered in `backend/src/index.ts` via `fastify.register()`:

| Module | Endpoints | Role gate |
| --- | --- | --- |
| `auth.ts` | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password` | public / authenticated |
| `tickets.ts` | `POST|GET /api/tickets`, `GET /api/tickets/niveis-urgencia`, `GET /api/tickets/:id`, `GET /api/tickets/:id/history`, `PATCH|DELETE /api/tickets/:id/anexo`, `PATCH /api/tickets/:id/{assign,reassign,status,close,admin-close,reopen}`, `POST /api/tickets/:id/messages` | per-endpoint (see workflow above) |
| `usuarios.ts` | `GET|POST /api/usuarios`, `PUT /api/usuarios/:id`, `PATCH /api/usuarios/:id/deactivate` | Admin, Diretor, Gestor |
| `unidades.ts` | `GET|POST /api/unidades`, `PUT|DELETE /api/unidades/:id` | Admin (writes) |
| `sectors.ts` | `GET|POST /api/sectors`, `PUT|DELETE /api/sectors/:id` | Admin (writes) |
| `problem-types.ts` | `GET|POST /api/problem-types`, `PUT|DELETE /api/problem-types/:id` | Admin (writes) |
| `dashboard.ts` | `GET /api/dashboard` | Técnico, Gestor, Diretor, Admin |
| `reports.ts` | `POST /api/reports/pdf`, `GET /api/reports/metrics` | Gestor, Diretor, Admin |
| `notifications.ts` | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` | authenticated |

`GET /api/health` is defined inline in `index.ts` and is the Cloud Run health check.

Note: routes with fixed segments must be registered **before** the matching `:id` route (see `/api/tickets/niveis-urgencia`).

The `backend/src/test-*.ts` files are standalone tsx scripts for manual smoke-testing against a live database — not an automated test suite. There is no test runner configured in this repo.

### Shared Schema Layer

`shared/src/schemas/` contains Zod schemas for `auth`, `user`, `unidade`, `sector`, `problem-type` and `ticket`. Types are inferred and re-exported from `shared/src/index.ts`. Both backend and frontend import from `@helpdesk/shared`, which guarantees validation parity between client and server. Because it is consumed as built output (`dist/`), **build `shared` before the other workspaces**.

### Frontend Structure

- **API layer:** `frontend/src/api/client.ts` — Axios instance with a JWT request interceptor and a 401 response interceptor that clears the token and redirects to `/login`. Base URL from `frontend/src/config.ts` (`VITE_API_URL`, defaults to `http://localhost:3001`).
- **Auth state:** `frontend/src/context/AuthContext.tsx` — provides `user`, `login`, `logout`, `refreshUser`
- **Routing:** `frontend/src/App.tsx` — all routes with role-gated `ProtectedRoute` wrappers; `/` redirects Solicitante to `/chamados` and everyone else to `/dashboard`
- **Layout:** `frontend/src/components/Layout.tsx` — shared shell with navbar, role-based nav links, notification bell
- **Pages:** `frontend/src/pages/` — `Login`, `ChangePassword`, `Dashboard`, `Relatorios`, `Chamados`, `DetalhesChamado`, `AbrirChamado`, plus admin areas `usuarios/`, `unidades/`, `setores/` (Tipos de Ocorrência) and `tipos-problema/`

## Deployment (Google Cloud Platform)

Production runs entirely on GCP. `docs/Deploy_GCP.md` is the step-by-step guide; `cloudbuild.yaml` is the executable pipeline.

| Concern | GCP service |
| --- | --- |
| Backend API | **Cloud Run** (`helpdesk-backend`, region `us-central1`, port 3001, 512 MiB / 1 vCPU, min-instances 0, max 3, unauthenticated) |
| Database | **Cloud SQL** PostgreSQL 15 (`helpdesk-db`), attached via `--add-cloudsql-instances` |
| Frontend | **Cloud Storage** static-website bucket (`_FRONTEND_BUCKET`) |
| Attachments | **Cloud Storage** bucket (`_GCS_BUCKET_NAME`), public objects |
| Container images | **Artifact Registry** (`helpdesk-repo`) |
| Secrets | **Secret Manager** — `helpdesk-database-url`, `helpdesk-jwt-secret`, `helpdesk-sendgrid-api-key` |
| CI/CD | **Cloud Build** trigger on push to `main` |
| Email | SendGrid (external SaaS) |

**Pipeline stages** (`cloudbuild.yaml`, sequential): build the Docker image → push to Artifact Registry → `gcloud run deploy` → `npm ci` + build `shared` + build `frontend` with `VITE_API_URL` → `gsutil rsync` `frontend/dist/` to the frontend bucket with cache headers (`max-age=3600` for JS/CSS, `no-cache` for `index.html`).

**Container** (`Dockerfile`): multi-stage Node 20 Alpine. The build stage installs the full workspace, runs `prisma generate`, then builds `shared` and `backend`. The runtime stage copies `dist/` outputs plus root **and** nested `node_modules` (the nested copies preserve workspace symlink resolution — the `mkdir -p` before the copy exists so the `COPY` cannot fail). `openssl` is installed because Prisma needs it on Alpine. Startup command: `npx prisma migrate deploy && node backend/dist/index.js` — **migrations run automatically on every deploy**.

The Cloud Run service account needs `roles/storage.objectAdmin` on the attachments bucket, otherwise uploads fail.

### Environment Variables

See `.env.example` for the full documented list. Required: `DATABASE_URL`, `JWT_SECRET`. Optional/contextual: `SENDGRID_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`, `ALLOWED_ORIGIN`, `PORT`, `HOST`, `GCS_BUCKET_NAME` (required for attachments), `VITE_API_URL` (frontend build-time), `APP_NAME`/`CLIENT_NAME` and their frontend build-time counterparts `VITE_APP_NAME`/`VITE_CLIENT_NAME` (see [Branding](#branding-configurable-app-name--client-name)).

The email variables are wired through the `_EMAIL_FROM` and `_FRONTEND_URL` substitutions in `cloudbuild.yaml`, and both names must stay in sync with `backend/src/services/email.ts` — it reads exactly `EMAIL_FROM` and `FRONTEND_URL`, silently falling back to `helpdesk@naturaltec.com.br` and `http://localhost:5173` when they are unset.

⚠️ `EMAIL_FROM` must be a sender/domain verified in SendGrid or delivery is rejected. `FRONTEND_URL` should point at a custom domain or load balancer in production: the email links are deep links (`/chamados/{id}`), and the direct Cloud Storage bucket endpoint serves objects without SPA rewriting, so those paths 404 until the frontend sits behind a load balancer with an `index.html` fallback.

## OpenSpec (Spec-Driven Development)

This project uses **OpenSpec** for planning and tracking changes. The configuration is in `openspec/config.yaml`. Base specs live in `openspec/specs/` (auth, rbac, unit-management, user-management, sector-management, ticket-creation, ticket-query, ticket-workflow, ticket-assignment, ticket-management, ticket-attachments, ticket-messaging, satisfaction, dashboard, reports-metrics, reports-pdf, in-app-notifications, email-notifications, core-ui, deploy-gcp, deploy-guide-powershell, project-readme). Completed changes are archived under `openspec/changes/archive/`.

OpenSpec CLI commands are available via `.claude/commands/opsx/` (slash commands) and `.claude/skills/openspec-*`. Key workflow:
- `opsx:new` — create a new change proposal
- `opsx:apply` — implement tasks from an approved change
- `opsx:archive` — archive a completed change and update base specs
- `opsx:verify` — verify implementation against specs

Rules from `openspec/config.yaml`: proposals under 500 words, always include a "Non-goals" section, tasks broken into max 4-hour chunks.

## Key Constraints

- **Data isolation is paramount** — never expose another Unidade's data to a non-Admin user. Always filter by `unidadeId` in backend queries, and by `sectorId` as well for Técnico.
- **Workflow state machine** must be respected — call `validateTransition()` before any status change, and record a `TicketHistory` entry.
- **Password change enforcement** — users with `passwordResetRequired: true` must change their password before accessing any other feature. `requirePasswordChange` handles it server-side; `PasswordChangeGuard` handles it client-side.
- **Consistency between enums** across the Prisma schema, the Zod enums in `shared`, and `ALLOWED_TRANSITIONS` in `workflow.ts`.
- **BigInt for ticket numbers** — `Ticket.numero` is Prisma `BigInt` (auto-increment). Always serialize with `.toString()` in API responses to avoid JSON precision loss (and because `JSON.stringify` throws on BigInt). The frontend receives `numero` as a string.
- **"Tipo de Ocorrência" in the UI, `Sector` in the code** — keep user-facing copy and code identifiers on their respective sides of that line.
- **Notifications must never break a ticket operation** — keep the catch-and-log posture in `NotificationService`/`EmailService`.
- **Migrations run on container start** — a migration that fails blocks the Cloud Run deployment. Keep them forward-compatible.
