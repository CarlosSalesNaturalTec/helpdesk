## 1. Backend (API)

- [x] 1.1 Atualizar `backend/src/routes/tickets.ts` para incluir as relações `sector` e `problemType` nas consultas (`GET /api/tickets` e `GET /api/tickets/:id`).
- [x] 1.2 Atualizar `backend/src/routes/dashboard.ts` para permitir que Administradores filtrem por `sectorId` quando recebido via query params.

## 2. Frontend (UI)

- [x] 2.1 Atualizar `frontend/src/pages/DetalhesChamado.tsx` para renderizar `ticket.sector.nome` e `ticket.problemType.nome`, removendo referências incorretas como `tipoProblema.replace`.
- [x] 2.2 Atualizar `frontend/src/pages/Dashboard.tsx` para adicionar o componente `SectorSelector` (ao lado de `UnitSelector`) e enviar o `sectorId` selecionado para a API quando o usuário for Admin.
