# Tasks: Comunicação — Mensagens e Notificações

## 1. Banco de Dados e Setup

- [x] 1.1 Adicionar modelo `Notification` ao schema Prisma com relações para `User` e `Ticket`
- [x] 1.2 Gerar migration e aplicar no banco local
- [x] 1.3 Instalar dependência `@sendgrid/mail` no backend
- [x] 1.4 Configurar variáveis de ambiente: `SENDGRID_API_KEY`, `EMAIL_FROM` (endereço do remetente)

## 2. Backend — Serviço de E-mail

- [x] 2.1 Criar `EmailService` com método `send(to, subject, body)` usando SendGrid
- [x] 2.2 Configurar timeout de 3s e catch de erros que loga sem propagar exceção
- [x] 2.3 Criar templates de texto para os 7 eventos: ASSUMIDO, AGUARDANDO, RESOLVIDO, FECHADO_ADMIN, REABERTO, MENSAGEM_AGUARDANDO, REATRIBUICAO
- [x] 2.4 Cada template extrai dados do ticket (número, título, nomes) e monta corpo com link para o sistema

## 3. Backend — Serviço de Notificações

- [x] 3.1 Criar `NotificationService` com método `create(userId, ticketId, type, message)` para persistir na tabela `Notification`
- [x] 3.2 Criar método `notifyAssigned(ticket)` — notifica Solicitante (visual + e-mail)
- [x] 3.3 Criar método `notifyAguardando(ticket, mensagem)` — notifica Solicitante (visual + e-mail)
- [x] 3.4 Criar método `notifyResolved(ticket)` — notifica Solicitante (visual + e-mail)
- [x] 3.5 Criar método `notifyAdminClose(ticket)` — notifica Solicitante (visual + e-mail)
- [x] 3.6 Criar método `notifyReopened(ticket)` — notifica Técnico anterior (visual + e-mail)
- [x] 3.7 Criar método `notifyMessageInAguardando(ticket, mensagem)` — notifica Técnico (visual + e-mail)
- [x] 3.8 Criar método `notifyReassignment(ticket, novoTecnico)` — notifica novo Técnico + Solicitante (visual + e-mail)

## 4. Backend — Integração nos Endpoints de Ticket

- [x] 4.1 Integrar `NotificationService` no endpoint de atribuição (`PATCH /api/tickets/:id/assign`)
- [x] 4.2 Integrar no endpoint de mudança de status para Aguardando (`PATCH /api/tickets/:id/status`)
- [x] 4.3 Integrar no endpoint de mudança de status para Resolvido
- [x] 4.4 Integrar no endpoint de fechamento administrativo (`PATCH /api/tickets/:id/admin-close`)
- [x] 4.5 Integrar no endpoint de reabertura (`PATCH /api/tickets/:id/reopen`)
- [x] 4.6 Integrar no endpoint de reatribuição (`PATCH /api/tickets/:id/reassign`)

## 5. Backend — Endpoint de Mensagens

- [x] 5.1 Implementar `POST /api/tickets/:id/messages` com validação Zod (content: 1-2000 caracteres)
- [x] 5.2 Validar que autor é Solicitante do ticket OU Técnico/Gestor/Diretor da Unidade do ticket
- [x] 5.3 Bloquear envio se ticket está FECHADO (retornar 422)
- [x] 5.4 Se status é AGUARDANDO e autor é Solicitante, transitar automaticamente para EM_ANDAMENTO
- [x] 5.5 Registrar mensagem no `TicketHistory` com `type: MENSAGEM` e disparar notificação correspondente

## 6. Backend — Endpoints de Notificações Visuais

- [x] 6.1 Implementar `GET /api/notifications/unread-count` retornando `{ count: number }` para polling leve
- [x] 6.2 Implementar `GET /api/notifications` com paginação, ordenado por não lidas primeiro, depois mais recentes
- [x] 6.3 Implementar `PATCH /api/notifications/:id/read` marcando notificação como lida (validar que pertence ao usuário)
- [x] 6.4 Implementar `PATCH /api/notifications/read-all` marcando todas do usuário como lidas

## 7. Frontend — Mensagens no Chamado

- [x] 7.1 Adicionar campo de texto + botão "Enviar" na tela de detalhes do chamado (abaixo da timeline)
- [x] 7.2 Exibir mensagens na timeline com balão estilizado: autor, data/hora, conteúdo (diferenciar visualmente Técnico de Solicitante)
- [x] 7.3 Desabilitar campo de mensagem quando chamado está FECHADO com mensagem explicativa
- [x] 7.4 Implementar validação de 1-2000 caracteres com contador no frontend

## 8. Frontend — Badge de Notificações

- [x] 8.1 Criar hook `useUnreadCount` com React Query e `refetchInterval: 30_000`
- [x] 8.2 Criar componente `NotificationBell` no header com ícone de sino e badge numérico condicional
- [x] 8.3 Criar componente `NotificationDropdown` com lista de notificações, cada item com ícone do tipo, descrição, link para o chamado e tempo relativo ("há 5 min")
- [x] 8.4 Implementar ação "Marcar todas como lidas" no dropdown
- [x] 8.5 Implementar clique no item → marcar como lida → redirecionar para `/chamados/:id`
- [x] 8.6 Atualizar contador do badge em tempo real ao marcar itens como lidos

## 9. Testes Manuais e Integração

- [x] 9.1 Testar envio de mensagem: Técnico envia → registra na timeline → Solicitante visualiza
- [x] 9.2 Testar transição Aguardando → Em Andamento quando Solicitante responde
- [x] 9.3 Testar bloqueio de mensagem em chamado Fechado
- [x] 9.4 Testar envio de e-mail em cada um dos 7 eventos (verificar inbox ou log do SendGrid)
- [x] 9.5 Testar resiliência: simular falha do SendGrid e verificar que ação principal conclui e notificação visual é criada
- [x] 9.6 Testar badge: login → badge mostra contagem → clicar notificação → redireciona → badge decrementa
- [x] 9.7 Testar "Marcar todas como lidas" zera o badge
