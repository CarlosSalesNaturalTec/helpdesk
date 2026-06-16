# Design: Comunicação — Mensagens e Notificações

## Context

O Change 2 entregou o núcleo do ticket com máquina de estados, timeline e atribuição. Este change adiciona a camada de comunicação sobre essa base: mensagens dentro do ticket e notificações (e-mail + visual). O backend Node.js/Fastify já possui middleware de auth e RBAC. O modelo `TicketHistory` já prevê o tipo `MENSAGEM`. O envio de e-mails usará SendGrid (free tier: 100/dia) por ser o mais maduro no ecossistema Node.

## Goals / Non-Goals

**Goals:**
- Endpoint de envio de mensagens no ticket
- Serviço de e-mail transacional com 7 gatilhos de eventos
- Tabela de notificações visuais com endpoints de listagem e marcação como lida
- Badge de notificações no header do frontend
- Resiliência: falha de e-mail não bloqueia ações nem notificações visuais

**Non-Goals:**
- WebSockets / SSE para notificações em tempo real (polling simples resolve)
- Templates de e-mail HTML ricos — texto simples com link no MVP
- Reply-to por e-mail que atualiza o ticket
- Notificações para Admin (eventos globais) — Admin recebe apenas notificações de tickets em que interagiu

## Decisions

### 1. Serviço de e-mail: SendGrid vs Resend

**Escolha: SendGrid (free tier: 100 e-mails/dia)**

Justificativa: Biblioteca `@sendgrid/mail` é madura, bem documentada e amplamente usada. Com volume estimado de 50-300 chamados/mês e ~7 eventos por chamado, o pior caso é ~2100 e-mails/mês (~70/dia), dentro do free tier. A configuração é uma API key no ambiente.

Alternativa considerada: Resend. Tem free tier similar (100/dia) e SDK moderno, mas é mais novo e menos testado em produção. SendGrid é o padrão de mercado.

### 2. Gatilhos de notificação: hook inline vs event emitter

**Escolha: Chamada direta ao `NotificationService` dentro de cada endpoint de ação do ticket**

```typescript
// Exemplo no endpoint de atribuição
async function assignTicket(req, res) {
  const ticket = await ticketService.assign(req.params.id, req.user);
  // Dispara notificações de forma síncrona, mas com catch isolado
  await notificationService.notifyAssigned(ticket).catch(logError);
  return ticket;
}
```

Justificativa: Com 1 desenvolvedor e sem message broker (Redis/PubSub), um event emitter interno adicionaria indireção sem benefício real. A chamada é explícita, fácil de rastrear e depurar. O `.catch(logError)` garante que falha de notificação nunca propague para o cliente.

Alternativa considerada: EventEmitter do Node.js. Rejeitada porque Cloud Run min-instances=0 perde listeners entre cold starts e o overhead de manter o padrão não compensa no MVP.

### 3. Envio de e-mail: síncrono vs background job

**Escolha: Síncrono (dentro do request), com timeout curto (3s)**

Justificativa: Sem infraestrutura de fila (Cloud Tasks, BullMQ), a opção mais simples é enviar o e-mail durante o request. O SendGrid geralmente responde em < 500ms. Se falhar, o erro é logado e a ação já foi concluída. O volume é baixo — não há risco de bloquear o event loop.

Alternativa considerada: Cloud Tasks no GCP. Rejeitada por adicionar complexidade de infra desnecessária para o MVP.

### 4. Notificações visuais: tabela dedicada vs view computada

**Escolha: Tabela `Notification` dedicada**

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  type      String   // ASSUMIDO, AGUARDANDO, RESOLVIDO, FECHADO_ADMIN, REABERTO, MENSAGEM, REATRIBUICAO
  message   String   // "Chamado #150 foi assumido por João"
  lida      Boolean  @default(false)
  criadoEm  DateTime @default(now())
}
```

Justificativa: Notificações visuais têm estado mutável (`lida`), exigindo persistência própria. Tentar derivar notificações do `TicketHistory` seria complexo (como saber quais eventos o usuário "já viu"?). A tabela dedicada é simples e escalável.

### 5. Frontend: polling vs push para atualizar badge

**Escolha: Polling leve com React Query `refetchInterval: 30_000` (30 segundos)**

O hook `useNotifications` faz polling a cada 30s quando o usuário está logado. Isso mantém o badge atualizado sem WebSocket. O intervalo de 30s é suficiente — notificações de helpdesk não exigem latência sub-segundo.

### 6. Mensagens no ticket

As mensagens reutilizam o modelo `TicketHistory` com `type: MENSAGEM`:

```typescript
// POST /api/tickets/:id/messages
// Body: { content: string (1-2000) }
// Regras:
// - Chamado não pode estar FECHADO
// - Autor deve ser Solicitante do ticket OU Técnico/Gestor/Diretor da Unidade do ticket
// - Se status === AGUARDANDO e autor é Solicitante → transita para EM_ANDAMENTO
```

O `content` do TicketHistory armazena `{ "mensagem": "texto da mensagem" }`.

### 7. APIs REST adicionadas

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/tickets/:id/messages` | Solicitante/Técnico+ | Enviar mensagem no chamado |
| GET | `/api/notifications` | Autenticado | Listar notificações do usuário (não lidas primeiro, paginado) |
| PATCH | `/api/notifications/:id/read` | Autenticado | Marcar notificação como lida |
| PATCH | `/api/notifications/read-all` | Autenticado | Marcar todas como lidas |
| GET | `/api/notifications/unread-count` | Autenticado | Retornar apenas o contador (para polling leve) |

## Risks / Trade-offs

**[Risco] SendGrid free tier (100/dia) pode ser insuficiente em picos**
→ Mitigação: O volume do MVP é conhecido (50-300 chamados/mês). Mesmo no pior mês (300 chamados × 7 eventos = 2100 e-mails), a média diária é ~70. Se exceder, o SendGrid rejeita com 429 e o erro é logado sem impactar o usuário.

**[Risco] Sem fila de e-mail, cold start do Cloud Run + envio de e-mail pode exceder o timeout do request**
→ Mitigação: O timeout do Cloud Run será configurado para 10s. O envio de e-mail tem timeout interno de 3s. Se estourar, o erro é capturado e a ação já foi concluída.

**[Risco] `NotificationService` chamado inline pode crescer descontroladamente com novos eventos**
→ Mitigação: Extrair para um event emitter interno é trivial se o número de eventos crescer. Para o MVP (7 eventos), a complexidade é administrável.

## Open Questions

- O contador de notificações deve incluir notificações já visualizadas mas não clicadas? Assumir que não — "lida" = clicou ou marcou como lida.
- As notificações visuais devem ser criadas para o próprio autor da ação? (Ex: Técnico ver notificação de que ele mesmo assumiu?) Assumir que NÃO — apenas para os outros participantes.
