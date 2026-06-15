# Design: Dashboard Operacional

## Context

O Change 2 entregou tickets com status, urgência, datas e escopo por Unidade. O Change 3 adicionou notificações. Este change implementa uma camada de leitura agregada sobre os tickets — não modifica dados, apenas consulta com agregações SQL. O frontend usa Recharts para o gráfico de tendência.

## Goals / Non-Goals

**Goals:**
- Um endpoint `GET /api/dashboard` que retorna cards + séries temporais
- Tela de Dashboard como landing page para Técnico, Gestor, Diretor e Admin
- Seletor de Unidade para Admin filtrar dados
- Gráfico de linha com duas séries (aberturas diárias e fechamentos diários)

**Non-Goals:**
- Cache ou materialized view (volume baixo, query direta é suficiente)
- Drill-down nos cards
- Comparativo entre Unidades (Change 5)
- Exportação do Dashboard

## Decisions

### 1. Endpoint único vs múltiplos endpoints

**Escolha: Endpoint único `GET /api/dashboard?unidadeId=`**

Retorna JSON com cards e séries temporais em uma única resposta:

```json
{
  "cards": {
    "abertos": 12,
    "emAndamento": 8,
    "resolvidos": 25,
    "criticos": 3
  },
  "trend": [
    { "date": "2026-05-16", "abertos": 3, "fechados": 2 },
    { "date": "2026-05-17", "abertos": 5, "fechados": 4 },
    ...
  ]
}
```

Justificativa: Uma única chamada na montagem da página, sem cascata de requisições. O backend executa 2 queries (cards + trend) em paralelo com `Promise.all`.

### 2. Queries de agregação

**Cards — 1 query com CASE conditional:**

```sql
SELECT
  COUNT(*) FILTER (WHERE status IN ('ABERTO', 'REABERTO')) as abertos,
  COUNT(*) FILTER (WHERE status IN ('EM_ANDAMENTO', 'AGUARDANDO')) as em_andamento,
  COUNT(*) FILTER (WHERE status = 'RESOLVIDO') as resolvidos,
  COUNT(*) FILTER (WHERE urgencia = 'CRITICA' AND status <> 'FECHADO') as criticos
FROM tickets
WHERE unidade_id = $unidadeId  -- omitido para Admin global
```

**Trend — 1 query com generate_series para preencher dias vazios:**

```sql
WITH days AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '29 days',
    CURRENT_DATE,
    '1 day'::interval
  )::date AS date
)
SELECT
  days.date,
  COUNT(t_abertos.id)::int AS abertos,
  COUNT(t_fechados.id)::int AS fechados
FROM days
LEFT JOIN tickets t_abertos
  ON t_abertos.criado_em::date = days.date
  AND ($unidadeId IS NULL OR t_abertos.unidade_id = $unidadeId)
LEFT JOIN tickets t_fechados
  ON t_fechados.atualizado_em::date = days.date
  AND t_fechados.status = 'FECHADO'
  AND ($unidadeId IS NULL OR t_fechados.unidade_id = $unidadeId)
GROUP BY days.date
ORDER BY days.date ASC
```

`generate_series` garante que dias sem chamados apareçam com valor zero, sem gaps no gráfico. O `LEFT JOIN` duplo evita subqueries correlacionadas.

### 3. Escopo de Unidade

O Admin passa `?unidadeId=` opcional. Se omitido, a query omite a cláusula `WHERE unidade_id`, retornando dados globais. Para Técnico/Gestor/Diretor, o backend injeta `unidadeId` do JWT e ignora o query param (ou retorna 403 se tentar burlar).

```typescript
const unidadeId = req.user.role === 'ADMIN'
  ? req.query.unidadeId || null  // Admin pode filtrar ou ver tudo
  : req.user.unidadeId;          // Outros: sempre sua Unidade
```

### 4. Gráfico no frontend: Recharts

**Escolha: Recharts `LineChart` com `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Legend` e duas `Line`**

```tsx
<LineChart data={trend}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" tickFormatter={formatDate} />
  <YAxis allowDecimals={false} />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="abertos" stroke="#3B82F6" name="Abertos" />
  <Line type="monotone" dataKey="fechados" stroke="#10B981" name="Fechados" />
</LineChart>
```

As cores são do Tailwind (blue-500 e green-500 para consistência com o design system).

### 5. Layout da página

```
┌──────────────────────────────────────────────────┐
│  [Seletor de Unidade] (apenas Admin)              │
├──────────┬──────────┬──────────┬─────────────────┤
│  ABERTOS │ EM AND.  │ RESOLVID.│    CRÍTICOS     │
│    12    │    8     │    25    │       3         │
│  blue    │  amber   │  green   │      red        │
├──────────┴──────────┴──────────┴─────────────────┤
│                                                  │
│  📈 Tendência (30 dias)                          │
│  ─────────────────────────────────────           │
│  Linha azul: Abertos    Linha verde: Fechados    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 6. API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/dashboard` | Técnico+ | Dados do dashboard. Query: `?unidadeId=` (Admin only) |

## Risks / Trade-offs

**[Risco] Query de tendência com 2 LEFT JOINs sobre generate_series pode degradar com >100k tickets**
→ Mitigação: No MVP, mesmo após anos o volume é <10k tickets. Se degradar, adicionar índice em `(unidade_id, criado_em::date)` e `(unidade_id, status, atualizado_em::date)`.

**[Risco] Sem cache, cada acesso ao Dashboard executa 2 queries de agregação**
→ Mitigação: Com 5-15 usuários simultâneos, queries que executam em <100ms não são problema. Pode-se adicionar `staleTime: 60_000` no React Query para evitar refetch desnecessário.

**[Risco] Fuso horário: `criado_em::date` usa o timezone do banco**
→ Mitigação: Configurar PostgreSQL com `timezone = 'America/Sao_Paulo'` e Cloud Run com `TZ=America/Sao_Paulo`.

## Open Questions

- O Solicitante vê o Dashboard? Pelo PRD, o Solicitante vai direto para "Abrir Chamado" após login. Dashboard é para Técnico, Gestor, Diretor e Admin. Confirmado.
- Cards devem ser clicáveis com drill-down? Não no MVP — os cards são estáticos.
