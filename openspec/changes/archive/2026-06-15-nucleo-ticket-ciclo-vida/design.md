# Design: Núcleo do Ticket — Abertura, Ciclo de Vida e Satisfação

## Context

O Change 1 entregou autenticação JWT, RBAC com 5 papéis, CRUD de Usuários e Unidades, e o schema base (`unidades`, `users`). Este change implementa o coração do HelpDesk sobre essa fundação: tickets com ciclo de vida completo. O frontend React + backend Node.js/Fastify comunicam-se via API REST. O banco é PostgreSQL com Prisma ORM.

## Goals / Non-Goals

**Goals:**
- Schema para `tickets`, `ticket_history`, `satisfaction`
- API REST completa para CRUD de tickets, com escopo de Unidade
- Máquina de estados com transições validadas no backend
- Atribuição e reatribuição com regras de mesma Unidade
- Timeline cronológica do chamado
- Busca textual (ILIKE) + filtro por status combináveis
- Pesquisa de satisfação 1-5 estrelas integrada ao fluxo de fechamento
- API de criação desacoplada da UI (RF19)

**Non-Goals:**
- Mensagens internas do chamado (Change 3)
- Notificações (Change 3)
- Upload de anexos
- SLA / métricas de tempo (Change 5 — Relatórios)

## Decisions

### 1. Máquina de estados: enum + validação vs state pattern

**Escolha: Enum no banco + array de transições permitidas no backend**

```typescript
type TicketStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO' | 'REABERTO';

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  ABERTO:        ['EM_ANDAMENTO'],
  EM_ANDAMENTO:  ['AGUARDANDO', 'RESOLVIDO'],
  AGUARDANDO:    ['EM_ANDAMENTO'],
  RESOLVIDO:     ['FECHADO'],
  FECHADO:       ['REABERTO'],
  REABERTO:      ['EM_ANDAMENTO'],
};
```

Cada endpoint de transição valida `ALLOWED_TRANSITIONS[currentStatus].includes(requestedStatus)` antes de executar. Isso centraliza a lógica em um único objeto, fácil de testar e manter.

Alternativa considerada: State pattern com classes. Rejeitada por overengineering para 6 estados com regras simples.

### 2. Número sequencial do ticket: SERIAL vs contador manual

**Escolha: `BigSerial` nativo do PostgreSQL (`ticket_numero BIGSERIAL`)**

Justificativa: Atômico, sem race condition, sem código extra. O número é global (não por Unidade), conforme RF04. O Prisma suporta `BigInt` com `@default(autoincrement())`. Exibir como `#XXX` na UI.

### 3. Histórico do ticket: tabela polimórfica vs tabelas separadas

**Escolha: Tabela única `ticket_history` com campo `type`**

```prisma
model TicketHistory {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  type      HistoryType  // ABERTURA, MENSAGEM, MUDANCA_STATUS, ATRIBUICAO
  content   String   // JSON com dados específicos do evento
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  criadoEm  DateTime @default(now())
}

enum HistoryType {
  ABERTURA
  MENSAGEM
  MUDANCA_STATUS
  ATRIBUICAO
  REATRIBUICAO
  FECHAMENTO
  REABERTURA
}
```

O campo `content` armazena um JSON stringificado com dados específicos de cada tipo de evento:
- `MUDANCA_STATUS`: `{ "from": "EM_ANDAMENTO", "to": "RESOLVIDO", "solucao": "..." }`
- `ATRIBUICAO`: `{ "tecnicoId": 5, "tecnicoNome": "João" }`

Isso mantém a timeline flexível (novos tipos de evento não exigem migration) e a query de timeline é trivial: `SELECT * FROM ticket_history WHERE ticketId = ? ORDER BY criadoEm ASC`.

Alternativa considerada: Tabelas separadas por tipo de evento. Rejeitada por complexidade desnecessária na query de timeline (UNION de N tabelas).

### 4. Busca textual: ILIKE vs Full-Text Search (tsvector)

**Escolha: `ILIKE` do PostgreSQL**

Justificativa: Com volume de 50-300 chamados/mês, mesmo após anos o total de registros será baixo (alguns milhares). `ILIKE` com índice B-tree simples é suficiente. Full-text search (tsvector/tsquery) adicionaria complexidade de configuração de dicionário pt-BR sem benefício real nesse volume.

```sql
WHERE (titulo ILIKE '%termo%' OR solicitante.nome ILIKE '%termo%' OR unidade.nome ILIKE '%termo%')
  AND (status = 'ABERTO' OR $filtroStatus IS NULL)
  AND unidade.id = $userUnidadeId  -- escopo automático
```

Alternativa considerada: Prisma full-text search preview. Rejeitada por ainda ser preview no Prisma e trazer complexidade desnecessária.

### 5. Esquema do banco de dados

```prisma
enum TicketStatus {
  ABERTO
  EM_ANDAMENTO
  AGUARDANDO
  RESOLVIDO
  FECHADO
  REABERTO
}

enum TipoProblema {
  HARDWARE
  SOFTWARE
  REDE_INTERNET
  EMAIL
  IMPRESSORA
  ACESSO_SENHA
  SISTEMA_INTERNO
  OUTRO
}

enum NivelUrgencia {
  BAIXA
  MEDIA
  ALTA
  CRITICA
}

model Ticket {
  id            Int           @id @default(autoincrement())
  numero        BigInt        @default(autoincrement())
  titulo        String        @db.VarChar(100)
  descricao     String        @db.VarChar(2000)
  tipoProblema  TipoProblema
  urgencia      NivelUrgencia
  status        TicketStatus  @default(ABERTO)
  solicitanteId Int
  solicitante   User          @relation("Solicitante", fields: [solicitanteId], references: [id])
  tecnicoId     Int?
  tecnico       User?         @relation("Tecnico", fields: [tecnicoId], references: [id])
  unidadeId     Int
  unidade       Unidade       @relation(fields: [unidadeId], references: [id])
  history       TicketHistory[]
  satisfaction  Satisfaction?
  criadoEm      DateTime      @default(now())
  atualizadoEm  DateTime      @updatedAt
}

model TicketHistory {
  id        Int         @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket      @relation(fields: [ticketId], references: [id])
  type      HistoryType
  content   Json
  authorId  Int
  author    User        @relation(fields: [authorId], references: [id])
  criadoEm  DateTime    @default(now())
}

model Satisfaction {
  id        Int      @id @default(autoincrement())
  ticketId  Int      @unique
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  nota      Int      // 1 a 5
  criadoEm  DateTime @default(now())
}
```

Relações adicionadas ao modelo `User` (do Change 1):
```prisma
model User {
  // ... campos existentes
  ticketsSolicitados  Ticket[]       @relation("Solicitante")
  ticketsAtribuidos   Ticket[]       @relation("Tecnico")
  ticketHistory       TicketHistory[]
}
```

### 6. APIs REST

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/tickets` | Solicitante+ | Criar chamado (API desacoplada — RF19) |
| GET | `/api/tickets` | Autenticado | Listar chamados (com busca + filtro) |
| GET | `/api/tickets/:id` | Autenticado | Detalhes do chamado + timeline |
| PATCH | `/api/tickets/:id/assign` | Técnico | Auto-atribuição |
| PATCH | `/api/tickets/:id/reassign` | Gestor TI+ | Reatribuir a Técnico específico |
| PATCH | `/api/tickets/:id/status` | Autenticado | Transitar status |
| PATCH | `/api/tickets/:id/close` | Solicitante | Fechar com avaliação |
| PATCH | `/api/tickets/:id/admin-close` | Gestor TI+ | Fechamento administrativo |
| PATCH | `/api/tickets/:id/reopen` | Autenticado | Reabrir chamado fechado |
| GET | `/api/tickets/:id/history` | Autenticado | Timeline do chamado |
| GET | `/api/tickets/tipos-problema` | Autenticado | Lista de tipos de problema |
| GET | `/api/tickets/niveis-urgencia` | Autenticado | Lista de níveis de urgência |

Os endpoints de listagem (`GET /api/tickets`) aceitam query params: `?search=impressora&status=ABERTO&page=1&limit=20`.

### 7. Ponto de extensão para chatbot (RF19)

A arquitetura desacoplada é implementada por design: `POST /api/tickets` não depende da UI web. O endpoint:
- Autentica via JWT (mesmo token do login web)
- Valida o payload com o schema Zod `createTicketSchema`
- Preenche `solicitanteId` e `unidadeId` a partir do token JWT
- Retorna `{ id, numero, status, criadoEm }`

Um futuro chatbot obterá um JWT via login do usuário e postará no mesmo endpoint. Nenhuma rota separada ou lógica duplicada é necessária.

## Risks / Trade-offs

**[Risco] Sequencial global (BigSerial) gera gaps se uma transação der rollback**
→ Mitigação: Gaps em números sequenciais são aceitáveis e esperados. O RF04 exige unicidade e sequencialidade, não ausência de gaps.

**[Risco] Busca ILIKE com `%termo%` não usa índice para o primeiro `%`**
→ Mitigação: Com volume de MVP (< 5000 registros), o seq scan é irrelevante. Se necessário no futuro, adicionar índice GIN com `pg_trgm` (leva 5 minutos).

**[Risco] JSON no `content` do TicketHistory não é queryable no SQL**
→ Mitigação: O conteúdo é apenas para exibição na timeline, nunca para filtro. Consultas analíticas usam os campos estruturados de `Ticket` (status, datas, etc.).

**[Risco] Mudança de schema do Change 1 — adicionar relações ao model User**
→ Mitigação: Criar nova migration que apenas ADICIONA relações; os campos já existem. O Prisma gerencia isso sem perda de dados.

## Open Questions

- Paginação na listagem de chamados: 20 por página é suficiente para o MVP?
- O título do chamado deve ser único ou pode haver títulos repetidos? Assumir que podem repetir.
- O campo `solucao` na transição para "Resolvido" é obrigatório? Assumir que sim (mínimo 10 caracteres).
