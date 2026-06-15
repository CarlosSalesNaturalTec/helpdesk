# Tasks: Núcleo do Ticket — Abertura, Ciclo de Vida e Satisfação

## 1. Banco de Dados

- [ ] 1.1 Adicionar enums `TicketStatus`, `TipoProblema`, `NivelUrgencia`, `HistoryType` ao schema Prisma
- [ ] 1.2 Adicionar modelo `Ticket` com relações para `User` (solicitante, tecnico) e `Unidade`
- [ ] 1.3 Adicionar modelo `TicketHistory` com campo `content Json` para dados flexíveis por tipo de evento
- [ ] 1.4 Adicionar modelo `Satisfaction` com relação 1:1 para `Ticket`
- [ ] 1.5 Atualizar modelo `User` com relações reversas (`ticketsSolicitados`, `ticketsAtribuidos`, `ticketHistory`)
- [ ] 1.6 Gerar migration e aplicar no banco local
- [ ] 1.7 Atualizar seed script com tickets de exemplo em diferentes status e Unidades

## 2. Schemas Compartilhados (shared/)

- [ ] 2.1 Criar schema Zod `createTicketSchema` (titulo 5-100, descricao 10-2000, tipoProblema, urgencia)
- [ ] 2.2 Criar schema Zod `ticketStatusSchema` com validação de transições permitidas
- [ ] 2.3 Criar schema Zod `assignTicketSchema` (reassign: tecnicoId opcional)
- [ ] 2.4 Criar schema Zod `satisfactionSchema` (nota: 1-5)
- [ ] 2.5 Criar schema Zod `ticketQuerySchema` (search, status, page, limit)
- [ ] 2.6 Exportar tipos TypeScript inferidos

## 3. Backend — Criação de Chamado

- [ ] 3.1 Implementar `POST /api/tickets` com validação Zod, preenchimento automático de `solicitanteId` e `unidadeId` do JWT
- [ ] 3.2 Registrar evento `ABERTURA` no `TicketHistory` com os dados completos da abertura
- [ ] 3.3 Retornar resposta com `{ id, numero, status, criadoEm }` e mensagem de confirmação

## 4. Backend — Listagem, Busca e Filtro

- [ ] 4.1 Implementar `GET /api/tickets` com query params `search`, `status`, `page`, `limit`
- [ ] 4.2 Implementar lógica de escopo: Solicitante vê apenas seus tickets; Técnico/Gestor/Diretor veem da sua Unidade; Admin vê todos
- [ ] 4.3 Implementar busca textual com ILIKE em título, nome do solicitante e nome da Unidade
- [ ] 4.4 Implementar filtro por status com interseção com busca textual
- [ ] 4.5 Retornar resposta paginada com `{ data, total, page, limit }` e header `X-Total-Count`

## 5. Backend — Detalhes e Timeline

- [ ] 5.1 Implementar `GET /api/tickets/:id` com validação de escopo (unitFilter + solicitanteFilter)
- [ ] 5.2 Implementar `GET /api/tickets/:id/history` retornando `TicketHistory[]` ordenado por `criadoEm ASC`
- [ ] 5.3 Retornar ticket com dados do solicitante, técnico (se atribuído), unidade e contagem de eventos no histórico

## 6. Backend — Workflow (Máquina de Estados)

- [ ] 6.1 Criar utilitário `validateTransition(currentStatus, newStatus)` usando o mapa `ALLOWED_TRANSITIONS`
- [ ] 6.2 Implementar `PATCH /api/tickets/:id/status` com validação de transição e registro no histórico (`MUDANCA_STATUS`)
- [ ] 6.3 Implementar transições específicas: `Aguardando` exige mensagem do Técnico; `Resolvido` exige solução (min 10 chars)
- [ ] 6.4 Implementar `PATCH /api/tickets/:id/reopen` — restrito a chamados `FECHADO`, exige motivo, transita para `REABERTO`, registra `REABERTURA` no histórico
- [ ] 6.5 Bloquear qualquer alteração em chamados `FECHADO` que não use o endpoint de reabertura (retornar 422 com mensagem)

## 7. Backend — Atribuição e Reatribuição

- [ ] 7.1 Implementar `PATCH /api/tickets/:id/assign` — Técnico assume chamado `ABERTO` ou `REABERTO` da sua Unidade, transita para `EM_ANDAMENTO`, registra `ATRIBUICAO`
- [ ] 7.2 Validar que Técnico e ticket pertencem à mesma Unidade
- [ ] 7.3 Implementar `PATCH /api/tickets/:id/reassign` — Gestor/Diretor reatribui a qualquer Técnico da sua Unidade, registra `REATRIBUICAO`
- [ ] 7.4 Validar que o Técnico destino pertence à mesma Unidade do Gestor/Diretor

## 8. Backend — Pesquisa de Satisfação

- [ ] 8.1 Implementar `PATCH /api/tickets/:id/close` — Solicitante fecha chamado `RESOLVIDO`, exige nota 1-5, cria `Satisfaction`, transita para `FECHADO`, registra `FECHAMENTO`
- [ ] 8.2 Implementar `PATCH /api/tickets/:id/admin-close` — Gestor/Diretor/Admin fecha sem avaliação, transita para `FECHADO`, registra `FECHAMENTO`
- [ ] 8.3 Garantir que chamados fechados administrativamente NÃO geram registro em `Satisfaction`

## 9. Backend — Endpoints de Apoio

- [ ] 9.1 Implementar `GET /api/tickets/tipos-problema` retornando lista de tipos com label e value
- [ ] 9.2 Implementar `GET /api/tickets/niveis-urgencia` retornando lista de níveis com label e value

## 10. Frontend — Setup e Rotas

- [ ] 10.1 Adicionar rotas: `/abrir-chamado`, `/chamados`, `/chamados/:id`
- [ ] 10.2 Adicionar funções ao cliente API para todos os endpoints de ticket
- [ ] 10.3 Criar hook `useTickets` com React Query para listagem com busca/filtro/paginação

## 11. Frontend — Abrir Chamado

- [ ] 11.1 Implementar formulário "Abrir Chamado" com campos: título, descrição (textarea), select tipo de problema, select urgência
- [ ] 11.2 Preencher automaticamente dados do Solicitante (nome, e-mail, Unidade) do `AuthContext` e exibir como readonly
- [ ] 11.3 Implementar validação com Zod no frontend (mesmos schemas do shared/) e exibição de erros por campo
- [ ] 11.4 Exibir tela de confirmação com número do chamado após criação bem-sucedida
- [ ] 11.5 Contador de caracteres em tempo real para título e descrição com indicador de mínimo/máximo

## 12. Frontend — Gestão de Chamados (Lista)

- [ ] 12.1 Implementar tela "Gestão de Chamados" com campo de busca textual e dropdown de filtro por status
- [ ] 12.2 Exibir lista de chamados como cards/tabela com: número, título, solicitante, status (badge colorido), urgência (badge), data de abertura, dias em aberto
- [ ] 12.3 Exibir contador "X chamados encontrados" que atualiza dinamicamente
- [ ] 12.4 Implementar paginação (20 por página)
- [ ] 12.5 Adaptar visibilidade: Técnico/Gestor/Diretor veem chamados da Unidade; Solicitante vê apenas seus chamados (link "Meus Chamados")

## 13. Frontend — Detalhes do Chamado

- [ ] 13.1 Implementar tela de detalhes com: cabeçalho (número, título, status, urgência, datas), dados do solicitante, técnico responsável
- [ ] 13.2 Implementar timeline cronológica com eventos de abertura, mensagens, mudanças de status, atribuições
- [ ] 13.3 Implementar ações condicionais por papel e status: "Assumir Chamado" (Técnico, Aberto/Reaberto), "Reatribuir" (Gestor/Diretor), "Alterar Status" (Técnico/Gestor/Diretor), "Fechar Chamado" (Solicitante, Resolvido), "Fechar Administrativamente" (Gestor/Diretor, Resolvido), "Reabrir" (qualquer, Fechado)

## 14. Frontend — Pesquisa de Satisfação

- [ ] 14.1 Criar componente `StarRating` com 5 estrelas interativas (hover, seleção)
- [ ] 14.2 Integrar `StarRating` ao fluxo de fechamento: modal antes de confirmar "Fechar Chamado"
- [ ] 14.3 Bloquear botão "Confirmar Fechamento" até que uma nota seja selecionada

## 15. Testes Manuais e Integração

- [ ] 15.1 Fluxo completo: Solicitante abre chamado → Técnico assume → Técnico resolve → Solicitante avalia e fecha
- [ ] 15.2 Fluxo com desvios: Aguardando → retorno, Reabertura por Solicitante, Reabertura por Técnico
- [ ] 15.3 Testar isolamento: Técnico Unidade A não vê nem assume chamados da Unidade B
- [ ] 15.4 Testar busca + filtro combinados: "impressora" + status "Aberto"
- [ ] 15.5 Testar fechamento administrativo (sem avaliação) vs fechamento por Solicitante (com avaliação)
- [ ] 15.6 Testar bloqueio de ações em chamado Fechado (sem usar Reabrir)
