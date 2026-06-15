# Design: Relatórios Gerenciais e Exportação PDF

## Context

Os Changes 1-4 estão completos: auth, tickets com ciclo de vida e satisfação, notificações, dashboard. Este change implementa a camada analítica final: métricas gerenciais calculadas (TMA, Taxa Fechamento, Satisfação Média), gráficos de distribuição e exportação PDF. O backend usa PostgreSQL window functions para o TMA e PDFKit para geração de PDF sem dependência de browser.

## Goals / Non-Goals

**Goals:**
- Endpoint de métricas com filtro de período e Unidade
- Cálculo do TMA com desconto de Aguardando via window functions
- Gráfico de distribuição dinâmico (dimensão selecionável)
- Geração de PDF server-side com PDFKit
- Indicador de progresso no frontend durante geração

**Non-Goals:**
- Cache de métricas (query direta, volume baixo)
- Templates de PDF customizáveis
- Exportação CSV/Excel
- Agendamento de relatórios

## Decisions

### 1. Cálculo do TMA: window functions vs aplicação

**Escolha: Window functions do PostgreSQL (`LAG` + `SUM` de intervalos)**

```sql
WITH status_times AS (
  SELECT
    ticket_id,
    status,
    criado_em,
    LAG(criado_em) OVER (PARTITION BY ticket_id ORDER BY criado_em) AS prev_time,
    LAG(status) OVER (PARTITION BY ticket_id ORDER BY criado_em) AS prev_status
  FROM ticket_history
  WHERE type = 'MUDANCA_STATUS'
),
aguardando_time AS (
  SELECT
    ticket_id,
    SUM(
      EXTRACT(EPOCH FROM (criado_em - prev_time)) / 3600.0
    ) FILTER (WHERE prev_status = 'AGUARDANDO') AS horas_aguardando
  FROM status_times
  WHERE prev_time IS NOT NULL
  GROUP BY ticket_id
)
SELECT AVG(
  EXTRACT(EPOCH FROM (t.resolvido_em - t.criado_em)) / 3600.0
  - COALESCE(a.horas_aguardando, 0)
) AS tma_horas
FROM tickets t
LEFT JOIN aguardando_time a ON a.ticket_id = t.id
WHERE t.status IN ('RESOLVIDO', 'FECHADO')
  AND t.criado_em >= $dataInicio
  AND t.unidade_id = $unidadeId;
```

`LAG` captura o timestamp da transição anterior. Para cada período em "Aguardando", acumula o tempo. Subtrai do tempo total até resolução. Isso é preciso e executado inteiramente no banco.

Alternativa considerada: Puxar histórico para o Node e calcular. Rejeitada por transferir dados desnecessários e ser mais lenta.

### 2. Geração de PDF: PDFKit vs Puppeteer

**Escolha: PDFKit (puro JavaScript, sem browser)**

Justificativa: PDFKit gera PDF programaticamente dentro do Node.js, sem precisar de Chrome headless. A imagem do container é menor (~50MB menor que com Puppeteer) e o cold start é mais rápido. Para o layout simples do relatório (cards + gráfico + texto), PDFKit é suficiente.

Alternativa considerada: Puppeteer + template HTML. Rejeitada por adicionar ~200MB de Chrome ao container, piorar cold start e ser desnecessária para um layout que PDFKit resolve.

### 3. Gráfico no PDF: gerar no frontend vs backend

**Escolha: Frontend gera o gráfico como imagem (canvas) e envia para o backend incluir no PDF**

O fluxo:
1. Usuário clica "Gerar PDF"
2. Frontend renderiza o gráfico Recharts em um `<div>` oculto
3. Converte o SVG para canvas via `html2canvas` ou `react-to-image`
4. Envia a imagem (base64 PNG) + dados dos cards para `POST /api/reports/pdf`
5. Backend usa PDFKit para montar o PDF com a imagem e texto
6. Retorna o PDF como stream (`Content-Type: application/pdf`)

Alternativa considerada: Gerar gráfico no backend com Chart.js (node-canvas). Rejeitada porque `node-canvas` tem dependências nativas (Cairo) que complicam o deploy no Cloud Run. Manter o gráfico no frontend reutiliza o Recharts já implementado.

### 4. Indicador de progresso: polling vs streaming

**Escolha: Estado local no frontend durante o fetch**

O botão "Gerar PDF" dispara:
1. `setGenerating(true)` — exibe spinner e desabilita botão
2. Chama `POST /api/reports/pdf` como blob
3. Quando a resposta chega, cria URL blob → dispara download → `setGenerating(false)`

Isso é suficiente porque a geração dura ≤10s (RNF10). Não precisa de polling de progresso granular.

### 5. APIs REST

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/reports/metrics` | Gestor TI+ | Cards-resumo + dados do gráfico. Query: `periodo`, `unidadeId` (Admin), `dimensao` |
| POST | `/api/reports/pdf` | Gestor TI+ | Gera PDF. Body: `{ cards, chartImage (base64), dimensao, periodo, unidadeId? }` |

O endpoint de métricas aceita:
- `periodo`: `30`, `60`, `90` ou `custom`
- `dataInicio`, `dataFim`: obrigatórios se `periodo=custom`
- `unidadeId`: opcional, só Admin pode usar
- `dimensao`: `status`, `prioridade`, `categoria`, `satisfacao`, `unidade` (Admin only)

### 6. Query do gráfico de distribuição

A query agrupa por dimensão dinamicamente. Usa SQL dinâmico com validação whitelist:

```typescript
const DIMENSION_COLUMNS = {
  status: 'status',
  prioridade: 'urgencia',
  categoria: 'tipo_problema',
  satisfacao: 's.nota',  // LEFT JOIN satisfaction
  unidade: 'u.nome',     // Admin only
};

const column = DIMENSION_COLUMNS[dimensao];
// Valida que dimensao está na whitelist antes de montar query
```

Para "Satisfação", faz LEFT JOIN com `satisfaction` e agrupa por nota (1-5). Para "Unidade", agrupa por `unidade.nome`.

### 7. Estrutura do PDF (PDFKit)

```
┌─────────────────────────────────┐
│  Relatório HelpDesk             │
│  Período: 16/05/2026 - 15/06/2026
│  Unidade: Unidade A             │
├─────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  │Total │ │Taxa  │ │ TMA  │ │Satis.│
│  │  45  │ │ 62%  │ │ 4.2h │ │ 4.3  │
│  └──────┘ └──────┘ └──────┘ └──────┘
├─────────────────────────────────┤
│                                 │
│  [Imagem do gráfico]            │
│                                 │
├─────────────────────────────────┤
│  Gerado por Maria Silva         │
│  em 15/06/2026 14:30            │
└─────────────────────────────────┘
```

PDFKit monta cada elemento programaticamente: texto para cabeçalho, retângulos para cards, `image()` para o gráfico, texto para rodapé.

## Risks / Trade-offs

**[Risco] Gráfico como imagem (canvas) pode ter qualidade baixa no PDF**
→ Mitigação: Renderizar o gráfico em um div oculto com dimensões maiores (2x) e converter para PNG em alta resolução. PDFKit suporta `image` com scale.

**[Risco] POST do PDF recebe imagem base64 grande (pode exceder limite do Cloud Run)**
→ Mitigação: Comprimir a imagem PNG antes de enviar. Cloud Run tem limite de 32MB por request — uma imagem de gráfico comprimida raramente passa de 500KB.

**[Risco] Complexidade do SQL dinâmico para dimensão do gráfico**
→ Mitigação: Usar whitelist rígida — se a dimensão não estiver na lista, retorna 400. Nunca concatenar input direto na query (usar parâmetros do Prisma ou `$1` placeholders).

## Open Questions

- O filtro de período "custom" deve usar date picker no frontend? Assumir que sim (componente de calendário nativo ou date input HTML5).
- O PDF deve incluir o nome do Instituto no cabeçalho? Assumir que não — apenas "Relatório HelpDesk".
