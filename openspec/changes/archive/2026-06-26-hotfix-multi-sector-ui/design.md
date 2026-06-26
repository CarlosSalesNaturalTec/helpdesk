## Context

O sistema teve o backend de banco de dados atualizado para suportar setores (`multi-sector-support`), trocando o enum `tipoProblema` por relações com `Sector` e `ProblemType`. Porém, o backend falhou ao não incluir essas relações ao retornar os dados de um chamado nas queries, o que quebrou a UI de detalhes do chamado que tentava usar a string antiga. Adicionalmente, o frontend não tinha um seletor de setor no dashboard de administradores, fazendo com que o dashboard não refletisse o filtro de setor implementado para os técnicos.

## Goals / Non-Goals

**Goals:**
- Ajustar a API do backend para retornar os dados relacionais de `sector` e `problemType` no ticket.
- Corrigir a UI de Detalhes do Chamado para exibir os dados baseados nessas relações em vez de quebrar tentando parsear a string de `tipoProblema`.
- Permitir que os Administradores filtrem o Dashboard por Setor.

**Non-Goals:**
- Refazer a modelagem de dados do banco.
- Alterar o comportamento dos técnicos ou gestores no sistema.

## Decisions

- **Include nas Queries**: Modificar o arquivo `tickets.ts` para adicionar `sector: { select: { id: true, nome: true } }` e `problemType: { select: { id: true, nome: true } }` nas APIs `GET /api/tickets` e `GET /api/tickets/:id`.
- **Filtro no Dashboard**: Na tela de Dashboard (`Dashboard.tsx`), adicionar um componente `SectorSelector` (semelhante ao `UnitSelector`). A prop `sectorId` será passada para a query e enviada para `GET /api/dashboard`. No backend `dashboard.ts`, verificar se o usuário é Admin e, se `sectorId` for passado na query, aplicar o filtro.

## Risks / Trade-offs

- **Risk:** Alterações nas queries Prisma podem ter impacto de performance.
- **Trade-off:** Como as tabelas `Sector` e `ProblemType` são pequenas, os `JOINS` adicionados com os includes não devem adicionar latência notável às queries de `tickets`.
