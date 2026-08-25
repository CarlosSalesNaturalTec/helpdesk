# HelpDesk — Sistema de Chamados para Instituições

Plataforma centralizada de tickets para suporte de TI, projetada para organizações com múltiplas unidades. Gerencie chamados do início ao fim com fluxo de trabalho completo, notificações por e-mail, dashboard analítico e controle de acesso por perfil.

---

## Badges

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![Fastify](https://img.shields.io/badge/Fastify-4.26-000000?logo=fastify)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5.11-2D3748?logo=prisma)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Docker](https://img.shields.io/badge/Docker-✓-2496ED?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Funcionalidades

- **Abertura de chamados** com classificação por tipo de problema (hardware, software, rede, e-mail, impressora, acesso/senha, sistema interno, outro) e nível de urgência (baixa, média, alta, crítica)
- **Workflow completo de tickets**: Aberto → Em Andamento → Aguardando → Resolvido → Fechado, com suporte a reabertura
- **Atribuição automática e manual** de técnicos, com reassignação por gestores
- **Histórico completo** de cada ticket com registro de todas as transições e mensagens
- **Dashboard analítico** com cards de status, gráfico de tendências e métricas por unidade
- **Relatórios gerenciais** com exportação para PDF (métricas, distribuição por status/tipo/urgência)
- **Notificações por e-mail** (SendGrid) para transições relevantes de cada ticket
- **Isolamento de dados por unidade**: cada unidade vê apenas seus próprios chamados, técnicos e gestores
- **5 perfis de usuário**: Solicitante, Técnico, Gestor, Diretor e Administrador do Sistema
- **Autenticação JWT** com proteção contra força bruta (bloqueio temporário após 5 tentativas)

---

## Stack Tecnológica

| Camada       | Tecnologia                                                |
| ------------ | --------------------------------------------------------- |
| **Frontend** | React 18, TypeScript, Vite, React Router 6, TanStack React Query, Recharts, Axios |
| **Backend**  | Node.js 20, TypeScript, Fastify 4, JWT (jsonwebtoken), bcryptjs, PDFKit, SendGrid |
| **Banco**    | PostgreSQL 15, Prisma ORM 5                               |
| **Infra**    | Docker, Docker Compose, Google Cloud Platform (Cloud Run, Cloud SQL, Cloud Storage, Cloud Build) |
| **Tooling**  | npm workspaces (monorepo), Zod (validação), Prettier      |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                         │
│                    React SPA · Vite · Port 5173                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/REST (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Fastify API)                         │
│                         Port 3001                                 │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │  Auth    │ Tickets  │ Usuários │Dashboard │ Reports  │       │
│  │  (JWT)   │(Workflow)│  (RBAC)  │(Métricas)│  (PDF)   │       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │
│  ┌──────────────────────────────────────────────────┐           │
│  │              Middleware Layer                     │           │
│  │  authRequired · requirePasswordChange · RBAC     │           │
│  │  Data Isolation: unitFilter() por Unidade        │           │
│  └──────────────────────────────────────────────────┘           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Prisma Client
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL 15 · Port 5432                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │ Unidades │  Users   │ Tickets  │ History  │  Notif   │       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SendGrid (E-mail)                             │
│            Notificações de transições de tickets                  │
└─────────────────────────────────────────────────────────────────┘
```

**Monorepo (npm workspaces):**

```
helpdesk/
├── shared/          @helpdesk/shared      — Zod schemas & types
├── backend/         @helpdesk/backend     — Fastify REST API
├── frontend/        (SPA)                 — React + Vite
└── prisma/                                — Schema & migrations
```

---

## Personas

| Persona                  | Role no Sistema  | Ações Principais                                                                 |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------- |
| **Solicitante**          | `SOLICITANTE`    | Abre chamados, envia mensagens, fecha tickets com avaliação de satisfação (1-5), reabre chamados |
| **Técnico**              | `TECNICO`        | Visualiza tickets da sua unidade, assume chamados, atualiza status, envia mensagens |
| **Gestor**               | `GESTOR`         | Visualiza os tickets da sua unidade e do seu Tipo de Ocorrência, reassigna técnicos da mesma área, fecha tickets administrativamente, acessa dashboard e relatórios escopados à sua área |
| **Diretor**              | `DIRETOR`        | Mesmas permissões do Gestor, mas em todos os Tipos de Ocorrência da unidade + visão consolidada para tomada de decisão |
| **Administrador do Sistema** | `ADMIN`      | Acesso global (todas as unidades), gerencia unidades e usuários, configura o sistema |

---

## Estrutura do Repositório

```
helpdesk/
├── backend/
│   └── src/
│       ├── index.ts              # Entry point (Fastify server, CORS, routes)
│       ├── middleware/
│       │   └── auth.ts           # JWT auth, password change guard, RBAC
│       ├── lib/
│       │   ├── rbac.ts           # Data isolation helper (unitFilter)
│       │   ├── workflow.ts       # Ticket state machine (validateTransition)
│       │   └── email.ts          # SendGrid email service
│       └── routes/
│           ├── auth.ts           # Login, change-password, me
│           ├── tickets.ts        # CRUD + workflow transitions + messages
│           ├── usuarios.ts       # User CRUD (scoped by role)
│           ├── unidades.ts       # Unit CRUD (admin only)
│           ├── dashboard.ts      # Status cards + trend chart
│           ├── reports.ts        # Metrics + PDF export
│           └── notifications.ts  # In-app notifications
├── frontend/
│   └── src/
│       ├── App.tsx               # Route definitions with role-gated guards
│       ├── config.ts             # API_URL configuration
│       ├── api/
│       │   ├── client.ts         # Axios instance with JWT interceptors
│       │   ├── tickets.ts        # Ticket API functions
│       │   ├── dashboard.ts      # Dashboard API functions
│       │   └── reports.ts        # Reports API functions
│       ├── context/
│       │   └── AuthContext.tsx    # Auth state (user, login, logout)
│       ├── components/
│       │   ├── Layout.tsx        # Shared shell (navbar, role-based nav)
│       │   └── Guards.tsx        # ProtectedRoute, PasswordChangeGuard
│       └── pages/                # Page components by feature area
├── shared/
│   └── src/
│       ├── index.ts              # Re-exports all schemas & types
│       └── schemas/              # Zod schemas: auth, tickets, users, unidades
├── prisma/
│   ├── schema.prisma             # Database schema (PostgreSQL)
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Seed data (test users, units, tickets)
├── docs/
│   ├── Readme.md                 # This file
│   ├── Deploy_GCP.md             # GCP deployment guide
│   └── prd_helpdesk.md           # Product Requirements Document
├── docker-compose.yml            # PostgreSQL for local development
├── Dockerfile                    # Multi-stage backend image
├── cloudbuild.yaml               # Cloud Build CI/CD pipeline
├── .env.example                  # Environment variables template
└── package.json                  # Root workspace config
```

---

## Pré-requisitos

- **Node.js** 20+ (recomendado 20 LTS)
- **npm** 10+ (incluído com Node.js 20)
- **Docker** e **Docker Compose** (para o banco PostgreSQL local)
- **Git**

---

## Setup Local

### 1. Clone o repositório

```bash
git clone <repo-url>
cd helpdesk
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e preencha pelo menos `DATABASE_URL` e `JWT_SECRET`. As demais variáveis são opcionais para desenvolvimento local.

### 4. Suba o banco de dados PostgreSQL

```bash
docker-compose up -d
```

### 5. Execute as migrations e o seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 6. Inicie o ambiente de desenvolvimento

```bash
npm run dev
```

Este comando inicia simultaneamente:
- **Backend** em `http://localhost:3001` (com hot reload via tsx)
- **Frontend** em `http://localhost:5173` (com HMR via Vite)
- **Shared** em modo watch (recompila schemas automaticamente)

### 7. Verifique

Acesse `http://localhost:5173` e faça login com uma das credenciais de teste abaixo. Verifique também o health check do backend: `http://localhost:3001/api/health` deve retornar `{"status":"ok"}`.

---

## Usuários de Teste

| E-mail                      | Senha      | Role          | Unidade        |
| --------------------------- | ---------- | ------------- | -------------- |
| `admin@helpdesk.com`        | `admin123` | ADMIN         | Matriz         |
| `solicitante@helpdesk.com`  | `user123`  | SOLICITANTE   | Matriz         |
| `solicitante2@helpdesk.com` | `user123`  | SOLICITANTE   | Filial Norte   |
| `tecnico@helpdesk.com`      | `user123`  | TECNICO       | Matriz         |
| `tecnico2@helpdesk.com`     | `user123`  | TECNICO       | Filial Norte   |
| `tecnico3@helpdesk.com`     | `user123`  | TECNICO       | Matriz         |
| `gestor@helpdesk.com`       | `user123`  | GESTOR        | Matriz         |
| `gestor2@helpdesk.com`      | `user123`  | GESTOR        | Matriz         |

> **Nota:** Usuários criados via seed possuem `passwordResetRequired: true` — na primeira tentativa de acesso serão redirecionados para a tela de troca de senha. Para testes rápidos, o seed pode configurar usuários sem essa flag.

---

## Comandos Úteis

| Comando                                    | Descrição                                        |
| ------------------------------------------ | ------------------------------------------------ |
| `npm run dev`                              | Inicia todos os workspaces em paralelo           |
| `npm run build`                            | Builda todos os workspaces                       |
| `npm run dev --workspace=backend`          | Inicia apenas o backend com hot reload           |
| `npm run dev --workspace=frontend`         | Inicia apenas o frontend com HMR                 |
| `npx prisma migrate dev`                   | Aplica migrations pendentes                      |
| `npx prisma db seed`                       | Popula o banco com dados de teste                |
| `npx prisma studio`                        | Abre o Prisma Studio (browser DB explorer)       |
| `npx prisma generate`                      | Regenera o Prisma Client                         |
| `docker-compose up -d`                     | Sobe o container PostgreSQL                      |
| `docker-compose down`                      | Para e remove o container                        |
| `docker build -t helpdesk-backend .`       | Builda a imagem Docker do backend                |
| `npm run build --workspace=shared`         | Compila apenas o pacote shared                   |

---

## Workflow de Desenvolvimento

### Branches

- `main` — branch principal. Código em produção. Protegida (requer PR + review).
- `feature/<nome>` — branch para novas funcionalidades. Cria a partir de `main`.
- `fix/<nome>` — branch para correções de bugs.
- `docs/<nome>` — branch para alterações de documentação.

### Fluxo

1. Crie uma branch a partir de `main`: `git checkout -b feature/minha-feature`
2. Implemente as alterações seguindo os specs do OpenSpec
3. Execute `npm run build` para garantir que tudo compila
4. Execute `npx prisma migrate dev` se houver alterações no schema
5. Faça commit com mensagens descritivas em português
6. Abra um Pull Request para `main`
7. Após review e aprovação, faça merge

### Commits

Prefixo as mensagens de commit com o contexto:
- `feat:` — nova funcionalidade
- `fix:` — correção de bug
- `docs:` — documentação
- `refactor:` — refatoração
- `chore:` — tarefas de manutenção (deps, config)

### Observações

- **Isolamento de dados é crítico**: ao implementar queries no backend, sempre aplique `unitFilter()` para usuários não-Admin. Nunca exponha dados de outra unidade.
- **Workflow de tickets**: toda transição de status deve passar por `validateTransition()`. Consulte `backend/src/lib/workflow.ts` para as transições permitidas.
- **BigInt**: `Ticket.numero` é `BigInt` no Prisma. Sempre serialize como string nas respostas da API.
- **Senhas**: usuários criados manualmente devem ter `passwordResetRequired: true` — o middleware força a troca no primeiro login.

---

## Licença

MIT License — veja o arquivo [LICENSE](../LICENSE) (se disponível) ou consulte o mantenedor do projeto.

---

🤖 Documentação gerada como parte do OpenSpec change `docs-readme-deploy-gcp`.
