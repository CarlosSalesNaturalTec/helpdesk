# Proposal: Comunicação — Mensagens e Notificações

## Why

Com o núcleo do ticket funcionando (Change 2), Técnicos e Solicitantes precisam se comunicar dentro do chamado sem recorrer a canais externos (e-mail pessoal, WhatsApp, telefone). Além disso, os participantes precisam ser proativamente notificados sobre eventos relevantes — um chamado parado por falta de resposta é tão ruim quanto um chamado não registrado. As notificações são o motor de engajamento que faz o sistema ser adotado na rotina diária.

## What Changes

- Envio de mensagens dentro do chamado por Técnico e Solicitante, registradas na timeline
- Histórico unificado exibindo abertura + mensagens + mudanças de status em ordem cronológica
- Disparo de e-mails transacionais via SendGrid/Resend nos eventos: chamado assumido, chamado em Aguardando, chamado resolvido, fechamento administrativo, reabertura, nova mensagem em Aguardando, reatribuição
- Indicador visual de notificações não lidas (badge com contador) no header da aplicação
- Listagem de notificações pendentes com link direto para o chamado correspondente
- Serviço de e-mail independente de infraestrutura corporativa (RNF08)

## Capabilities

### New Capabilities

- `ticket-messaging`: Envio de mensagens textuais por Técnico e Solicitante dentro do chamado, respeitando o escopo de participação. Cada mensagem é registrada no histórico com autor, data e hora
- `email-notifications`: Disparo automático de e-mails transacionais em 7 eventos do ciclo de vida do ticket. Utiliza serviço externo (SendGrid/Resend) sem dependência de servidor de e-mail corporativo. Falha no envio de e-mail não bloqueia a ação principal nem as notificações visuais
- `in-app-notifications`: Indicador visual de notificações não lidas no header, com contador de atualizações pendentes. Ao clicar, lista as notificações agrupadas com link para o chamado correspondente

### Modified Capabilities

_Nenhuma — este change adiciona capacidades novas que consomem eventos do `ticket-workflow` e `ticket-assignment` sem alterar seus requisitos._

## Impact

- **Database**: Nova tabela `notification` para notificações visuais (tipo, ticketId, userId, lida, criadoEm)
- **Backend**: Endpoint `POST /api/tickets/:id/messages`, endpoints de notificações (`GET /api/notifications`, `PATCH /api/notifications/:id/read`), serviço de e-mail, hooks nos eventos de ticket para disparar notificações
- **Frontend**: Campo de mensagem na tela de detalhes do chamado, badge de notificações no header, dropdown de notificações, tela de detalhes do chamado com timeline unificada
- **Dependências externas**: SendGrid ou Resend (free tier, 100 e-mails/dia)
- **Dependências internas**: Change 2 (tickets, timeline), Change 1 (auth, usuários)

## Non-goals

- Chat em tempo real (WebSocket/long-polling) — as notificações visuais são atualizadas via polling ou refetch no React Query
- Templates de e-mail customizáveis por Unidade — template único para todo o Instituto no MVP
- Notificações push para mobile — fora do MVP
- Resposta a e-mails (reply-to) que atualiza o chamado — fora do MVP
