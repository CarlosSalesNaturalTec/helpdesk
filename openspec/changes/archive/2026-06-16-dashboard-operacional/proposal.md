# Proposal: Dashboard Operacional

## Why

Com tickets fluindo no sistema, gestores e técnicos precisam de uma visão imediata da situação operacional ao acessar o sistema. O Dashboard é a tela de entrada para Técnico, Gestor de TI, Diretor e Admin — substitui a necessidade de garimpar a lista de chamados para responder perguntas básicas como "quantos tickets críticos estão abertos na minha unidade?" ou "a demanda está aumentando ou diminuindo?".

## What Changes

- Quatro cards numéricos no topo da tela: Abertos, Em Andamento, Resolvidos, Críticos
- Cada card com definição precisa de contagem (ex: "Críticos" = urgência Crítica E status ≠ Fechado)
- Gráfico de linha com duas séries temporais: chamados abertos e chamados fechados por dia nos últimos 30 dias
- Visibilidade restrita por Unidade para Técnico, Gestor de TI e Diretor
- Visão consolidada global para Admin, com seletor de Unidade para filtrar
- Dados atualizados a cada recarga da página

## Capabilities

### New Capabilities

- `dashboard`: Painel operacional com cards de totais por status e gráfico de tendência de 30 dias. Dados automaticamente restritos à Unidade do usuário (exceto Admin que possui visão global com filtro). Cada card possui regra de contagem específica: Abertos (status Aberto ou Reaberto), Em Andamento (status Em Andamento ou Aguardando), Resolvidos (status Resolvido), Críticos (urgência Crítica E status ≠ Fechado)

### Modified Capabilities

_Nenhuma — este change apenas consulta dados de tickets, não altera requisitos existentes._

## Impact

- **Backend**: Novo endpoint `GET /api/dashboard` que retorna dados agregados dos cards + séries temporais para o gráfico
- **Frontend**: Nova tela de Dashboard com 4 cards + gráfico Recharts, seletor de Unidade para Admin
- **Dependências**: Change 1 (auth, RBAC, unitFilter), Change 2 (tickets — fonte dos dados)
- **Performance**: Consultas de agregação no PostgreSQL (`COUNT`, `GROUP BY`)

## Non-goals

- Atualização em tempo real (WebSocket/SSE) — refresh manual ou polling simples
- Comparativo entre Unidades no Dashboard (essa funcionalidade está nos Relatórios — Change 5)
- Drill-down ao clicar no card (card é estático, não é link)
- Previsão ou projeção de tendências futuras
