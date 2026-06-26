## Why

A implementação do suporte a múltiplos setores (`multi-sector-support`) introduziu as tabelas `Sector` e `ProblemType` no banco de dados, mas deixou pontas soltas na integração com o frontend. O detalhe do chamado falha ou omite dados pois o backend não inclui as relações na query, e o dashboard do administrador não permite filtrar por setor. Este hotfix corrige essas falhas de integração e restaura o funcionamento correto da interface.

## What Changes

- Modifica a API de detalhes do chamado (`GET /api/tickets/:id`) e listagem (`GET /api/tickets`) para incluir (`include`) as relações `sector` e `problemType`.
- Atualiza a UI do detalhe do chamado (`DetalhesChamado.tsx`) para exibir corretamente `ticket.sector.nome` e `ticket.problemType.nome`.
- Adiciona um filtro de `SectorSelector` no painel do Dashboard para usuários Administradores.
- Atualiza a API do Dashboard (`GET /api/dashboard`) para processar o filtro de `sectorId` quando o usuário for Admin.

## Capabilities

### New Capabilities

### Modified Capabilities
- `dashboard`: O Dashboard deve permitir que Administradores filtrem os dados por Setor, além de Unidade.
- `ticket-query`: A API de chamados deve retornar os objetos de Setor e Tipo de Problema completos para exibição no frontend.

## Impact

- **APIs afetadas:** `GET /api/tickets/:id`, `GET /api/tickets`, e `GET /api/dashboard`.
- **UI afetada:** `DetalhesChamado.tsx` e `Dashboard.tsx`.
- Não afeta o schema de banco de dados.

## Non-goals
- Alterar o banco de dados.
- Adicionar novos relatórios além do dashboard.
