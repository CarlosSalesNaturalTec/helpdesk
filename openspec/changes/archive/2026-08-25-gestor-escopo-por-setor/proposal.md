## Why

O Instituto deixou de ter apenas gestão de TI: existem gestores de Manutenção, Limpeza e outras áreas. O sistema não os representa — o papel se chama `GESTOR_TI` e, pior, **não é escopado por área**:

- `backend/src/routes/tickets.ts:190-193` — `TECNICO`, `GESTOR_TI` e `DIRETOR` filtram por `unidadeId`; só o `TECNICO` recebe o estreitamento por `sectorId`.
- `backend/src/routes/dashboard.ts:33` — mesma assimetria no SQL cru.
- `backend/src/routes/reports.ts:147` — **nenhum escopo de setor**, apenas `unidadeId`.

Um "Gestor de Limpeza" nasceria enxergando chamados, dashboard e relatórios de TI da sua Unidade, contrariando o isolamento de dados do projeto.

Não é preciso entidade nova: `Sector` ("Tipo de Ocorrência") já é o conceito de área e já tem CRUD. Falta ligar o Gestor a ele.

## What Changes

- Renomear `GESTOR_TI` para `GESTOR` no enum Prisma, no `RoleEnum` do `shared` e nos literais de backend e frontend (~40 pontos).
- Tornar `sectorId` **obrigatório** para `GESTOR`, espelhando a regra já existente para `TECNICO` em `shared/src/schemas/user.ts`.
- Estreitar o escopo do Gestor por `sectorId` em listagem de chamados, acesso individual, dashboard e **relatórios** (onde hoje não há escopo de setor).
- Restringir a reatribuição: o Gestor só reatribui chamados da sua área, e apenas para Técnicos da mesma área.
- Derivar o rótulo da UI de "Gestor de TI" fixo para **"Gestor de {Tipo de Ocorrência}"**.
- Tornar `Ticket.sectorId` NOT NULL. O campo já é obrigatório em `createTicketSchema`, mas a coluna nullable admite chamados órfãos — invisíveis a todo Gestor e Técnico escopados, o que anularia a garantia de isolamento.

Diretor e Admin permanecem **sem** escopo de setor: o Diretor supervisiona todas as áreas da sua Unidade; o Admin, todas as Unidades.

## Capabilities

### Modified Capabilities
- `rbac`: papel renomeado; isolamento por Unidade **e** área para Gestor e Técnico.
- `ticket-query`: listagem e acesso individual escopados por setor para o Gestor.
- `ticket-assignment`: reatribuição restrita à mesma área.
- `dashboard`: cards e série temporal escopados por setor para o Gestor.
- `reports-metrics`: escopo de setor introduzido (hoje inexistente).
- `user-management`: `sectorId` obrigatório ao criar/editar um Gestor.

## Impact

- **Banco:** migration SQL manual com `ALTER TYPE "Role" RENAME VALUE` (o Prisma geraria drop/recreate do tipo); `Ticket.sectorId` para NOT NULL. Migrations rodam no start do container — falha trava o deploy.
- **Sessões em voo:** JWTs emitidos antes do deploy carregam `GESTOR_TI` e falham no `requireRole(['GESTOR'])`. A expiração de 15 min limita a janela; gestores logados tomam 403 até renovar.
- **Backend:** `tickets.ts`, `dashboard.ts`, `reports.ts`, `usuarios.ts`, `lib/rbac.ts`, `middleware/auth.ts`.
- **Frontend:** uniões de tipo em `AuthContext`, `Guards`, `Usuarios`; `allowedRoles` em `App.tsx`; rótulos em `Layout` e `Usuarios`; permissões em `DetalhesChamado`.
- **Seed:** o gestor semeado ganha setor; entra um segundo gestor de outra área para exercitar o isolamento.
- **Docs:** `docs/manual/perfis/`, `mkdocs.yml`, `CLAUDE.md`, `openspec/config.yaml`.

## Non-goals

- CRUD de "Papel / Função" como entidade própria — descartado; a área é o `Sector` existente.
- Permissões dinâmicas por papel: o conjunto do Gestor segue fixo em código; só a **área** varia.
- Gestor com múltiplas áreas ou "gestor geral" sem área.
- Escopo de setor para Diretor ou Admin.
- Agrupar itens do menu de navegação.
- Renomear `Sector`/`sectorId` no código.
