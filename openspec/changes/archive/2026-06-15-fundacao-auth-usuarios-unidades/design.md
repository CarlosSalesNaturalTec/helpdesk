# Design: Fundação — Autenticação, Usuários e Unidades

## Context

Este é o primeiro change do sistema HelpDesk. Não há código existente. O projeto usa React + TypeScript (frontend), Node.js + TypeScript (backend Express/Fastify), PostgreSQL + Prisma ORM, Zod para validação compartilhada, e JWT + bcrypt para autenticação. A infraestrutura é GCP Cloud Run + Cloud SQL.

## Goals / Non-Goals

**Goals:**
- Schema do banco para `unidades` e `users` com migrations Prisma
- API de autenticação com JWT (login, me, change-password)
- Middleware de autorização RBAC com escopo por Unidade
- CRUD de Usuários com regras de escopo descentralizado
- CRUD de Unidades restrito ao Admin
- Proteção contra força bruta com bloqueio temporário

**Non-Goals:**
- Recuperação de senha por e-mail ("esqueci minha senha")
- Refresh token / sliding sessions
- Integração com diretório externo (AD/SSO)
- Auditoria de ações administrativas

## Decisions

### 1. JWT (stateless) vs Sessões no banco (stateful)

**Escolha: JWT stateless com curto TTL (15min)**

Justificativa: Com Cloud Run min-instances=0, sessões stateful exigiriam banco ou Redis (custo extra). JWT permite que qualquer instância Cloud Run valide o token sem consultar o banco. O TTL de 15 min mitiga o risco de token roubado. Para UX, o frontend chama `/api/auth/me` no mount para renovar silenciosamente se o token estiver válido.

Alternativa considerada: Sessões no banco com refresh token. Rejeitada por adicionar latência extra a cada requisição (DB lookup) e complexidade desnecessária para o MVP.

### 2. Bloqueio por força bruta: contador no banco vs in-memory

**Escolha: Contador no banco (`failedLoginAttempts` + `lockedUntil` na tabela `users`)**

Justificativa: Cloud Run com min-instances=0 perde estado em memória entre requisições. Armazenar o contador no banco garante que o bloqueio persista independentemente de qual instância serve a requisição. Com volume de 50-300 chamados/mês e 5-15 técnicos, o overhead de 1 UPDATE extra no login é insignificante.

Alternativa considerada: Redis/Memstore. Rejeitada por adicionar custo e complexidade de infra para um requisito simples.

### 3. Estrutura do middleware de autorização

**Escolha: Middleware composto `authRequired` → `requireRole([...])` com `unitFilter` injetado**

```
Requisição → authRequired (valida JWT, popula req.user)
           → requireRole(['TECNICO', 'GESTOR_TI']) (verifica papel)
           → Handler usa req.user.unidadeId como filtro implícito
```

O `unitFilter` é um helper que o handler chama: `unitFilter(req.user, targetUnidadeId)`. Para Admin, retorna `true` sempre. Para outros, compara `req.user.unidadeId === targetUnidadeId`. Isso centraliza a lógica de isolamento sem duplicação.

### 4. Senha temporária: flag booleana vs campo separado

**Escolha: Campo `passwordResetRequired BOOLEAN DEFAULT TRUE` na tabela `users`**

Quando um usuário é criado, o campo inicia como `true`. O middleware de autorização verifica essa flag após validar o JWT: se `true` e a rota não for `/api/auth/change-password`, retorna HTTP 403 com código `PASSWORD_CHANGE_REQUIRED`. Após o usuário definir nova senha, a flag vira `false`.

### 5. Esquema do banco de dados

**Escolha: Duas tabelas iniciais com enums nativos do PostgreSQL**

```prisma
enum Role {
  SOLICITANTE
  TECNICO
  GESTOR_TI
  DIRETOR
  ADMIN
}

model Unidade {
  id        Int      @id @default(autoincrement())
  nome      String   @unique
  criadoEm  DateTime @default(now())
  users     User[]
}

model User {
  id                    Int       @id @default(autoincrement())
  nome                  String
  email                 String    @unique
  senhaHash             String
  role                  Role
  unidadeId             Int
  unidade               Unidade   @relation(fields: [unidadeId], references: [id])
  ativo                 Boolean   @default(true)
  passwordResetRequired Boolean   @default(true)
  failedLoginAttempts   Int       @default(0)
  lockedUntil           DateTime?
  criadoEm              DateTime  @default(now())
  atualizadoEm          DateTime  @updatedAt
}
```

A relação `User → Unidade` é `N:1`. Um User pertence a exatamente uma Unidade. Isso implementa o modelo do Instituto onde cada usuário está vinculado a uma unidade específica.

### 6. APIs REST

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | Pública | Login, retorna JWT |
| GET | `/api/auth/me` | Autenticado | Retorna dados do usuário logado |
| POST | `/api/auth/change-password` | Autenticado | Altera a própria senha |
| GET | `/api/usuarios` | Gestor TI+ | Lista usuários (escopo por papel) |
| POST | `/api/usuarios` | Gestor TI+ | Cria usuário |
| PUT | `/api/usuarios/:id` | Gestor TI+ | Edita usuário |
| PATCH | `/api/usuarios/:id/deactivate` | Gestor TI+ | Desativa usuário |
| GET | `/api/unidades` | Autenticado | Lista unidades |
| POST | `/api/unidades` | Admin | Cria unidade |
| PUT | `/api/unidades/:id` | Admin | Edita unidade |
| DELETE | `/api/unidades/:id` | Admin | Exclui unidade (se sem vínculos) |

### 7. Estrutura do projeto (monorepo)

```
helpdesk/
├── frontend/          # React + TypeScript (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── ChangePassword.tsx
│       │   ├── usuarios/
│       │   └── unidades/
│       ├── hooks/
│       ├── api/       # fetch wrapper com JWT
│       └── types/     # tipos compartilhados
├── backend/           # Node.js + TypeScript (Fastify)
│   └── src/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       └── lib/       # prisma client, jwt helpers
├── shared/            # Schemas Zod + tipos TypeScript
│   └── src/
│       ├── schemas/   # auth.ts, user.ts, unidade.ts
│       └── types/
└── prisma/
    └── schema.prisma
```

`shared/` permite importar os mesmos schemas Zod no frontend (validação de formulários) e no backend (validação de API), garantindo que as regras fiquem sincronizadas.

## Risks / Trade-offs

**[Risco] JWT sem refresh token: usuário é deslogado após 15min de inatividade**
→ Mitigação: O frontend chama `/api/auth/me` a cada 10min para renovar o token antes da expiração. Se o usuário estiver ativo na aplicação, a sessão se mantém.

**[Risco] Bloqueio de força bruta pode ser explorado para DoS em contas conhecidas**
→ Mitigação: O volume é baixo (ambiente corporativo interno). Em iteração futura, pode-se adicionar rate limiting por IP no Cloud Run.

**[Risco] Cloud SQL db-f1-micro pode ter latência em cold start**
→ Mitigação: Cold start do Cloud SQL (~2-3s no primeiro request após inatividade) é aceitável para o volume do MVP. Pode-se configurar um keep-alive se necessário.

## Open Questions

- O nome da Unidade tem limite de caracteres? Assumir 60 caracteres (equivalente a VARCHAR comum).
- A senha temporária tem critério de complexidade? Assumir mínimo 6 caracteres para senhas pessoais, sem restrição para a temporária gerada pelo gestor.
