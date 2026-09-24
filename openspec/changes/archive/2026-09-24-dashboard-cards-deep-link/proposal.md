## Why

Os quatro cards do Dashboard são números mortos: exibem uma contagem e não levam a lugar nenhum. O caminho natural — ver *quais* são os chamados críticos — exige ir a Chamados e remontar o filtro à mão.

Ligar os cards à listagem esbarra num descompasso: **três dos quatro cards não são expressáveis pela API de chamados**. Os predicados do Dashboard (`dashboard.ts:40-44`) são compostos, enquanto `ticketQuerySchema` (`shared/src/schemas/ticket.ts:70-76`) aceita um único status e nenhum filtro de urgência:

| Card | Predicado no Dashboard | Expressável hoje |
| --- | --- | --- |
| Abertos | `ABERTO ∪ REABERTO` | não — status é enum único |
| Em Andamento | `EM_ANDAMENTO ∪ AGUARDANDO` | não |
| Resolvidos | `RESOLVIDO` | sim |
| Críticos | `urgencia=CRITICA ∧ status ≠ FECHADO` | não — não há filtro de urgência |

Ligar por aproximação seria pior que não ligar: o usuário clicaria num card marcado "12" e veria 9 chamados, corroendo a confiança no painel inteiro.

Some-se a isso que o Dashboard do Admin tem seletores de Unidade e Tipo de Ocorrência, mas a tela de Chamados não tem filtro de unidade — um Admin que filtrou o painel por uma Unidade perderia esse recorte ao navegar.

## What Changes

- `ticketQuerySchema`: `status` passa a aceitar **múltiplos valores**; entram `urgencia` e `unidadeId`.
- `unidadeId` é honrado **apenas para Admin**, espelhando `dashboard.ts:12-21`. Para os demais papéis o escopo derivado de `scopeWhere()` prevalece — ver `design.md`.
- Cards do Dashboard viram links que carregam o predicado exato, mais os recortes de Unidade e Tipo de Ocorrência ativos no painel.
- `Chamados.tsx` passa a ler e escrever os filtros na **URL** (hoje são `useState` puro), habilitando link direto, botão voltar e recarga preservando filtro.
- A barra de filtros ganha seleção múltipla de status, filtro de urgência e seletor de Unidade (só Admin).
- `StatusCard` ganha destino **opcional** — `Relatorios.tsx:146-149` usa o mesmo componente para Total/TMA/Satisfação, que não navegam.

## Capabilities

### Modified Capabilities
- `dashboard`: cards deixam de ser apenas numéricos e passam a navegar para a listagem com o mesmo predicado que contaram.
- `ticket-query`: filtros de status múltiplo, urgência e Unidade; persistência dos filtros na URL.

## Impact

- **Shared:** `schemas/ticket.ts` — `status` muda de forma. Mudança compatível se a serialização aceitar tanto valor único quanto lista.
- **Backend:** `routes/tickets.ts` (~linha 188) — ponto de risco de isolamento de dados, detalhado em `design.md`.
- **Frontend:** `pages/Dashboard.tsx`, `pages/Chamados.tsx`, `components/StatusCard.tsx`.
- Sem migration.
- **Docs:** `docs/manual/funcionalidades/`.

## Non-goals

- Filtro por técnico responsável, por Tipo de Problema ou por faixa de datas na listagem.
- Tornar clicáveis os cards da tela de Relatórios.
- Atualização em tempo real dos cards (segue exigindo recarga).
- Salvar filtros favoritos ou por usuário.
- Alterar as regras de contagem dos cards — os predicados do Dashboard permanecem como estão.
