# Proposal

## Why

O status "Aguardando" já é, na prática, uma pendência: o motivo é obrigatório, o placeholder em produção sugere "Aguardando retorno da peça de reposição pelo fornecedor" e o TMA já desconta o tempo nesse status. Falta-lhe o nome certo, um vocabulário reaproveitável de razões e a correção de um comportamento que, sob o nome "Pendente", fica visivelmente errado: a mensagem do Solicitante retoma o chamado sozinho mesmo quando a pendência é falta de material, reiniciando a contagem do TMA sem que nada tenha se resolvido.

Na mesma entrega, a identidade publicada passa de `ISETS` para `ISETES`.

## What Changes

- Renomear o status "Aguardando" para **"Pendente"** na camada de texto/interface, seguindo o precedente `Sector` → "Tipo de Ocorrência": nenhum identificador de código muda.
- Trocar o campo livre "Motivo do Aguardo" por **"Razão da Pendência"**, apresentado como lista das razões já registradas com digitação livre — mesmo comportamento do campo "Onde está o problema?".
- Expor as razões em `GET /api/tickets/razoes-pendencia`, com escopo por Tipo de Ocorrência.
- Gravar a razão em nova coluna `Ticket.pendenciaMotivo`, zerada quando o chamado é retomado; o `TicketHistory` segue como trilha de auditoria.
- **BREAKING** (comportamento): remover a retomada automática. A mensagem do Solicitante em chamado Pendente deixa de alterar o status; o Técnico retoma explicitamente. A notificação ao Técnico (in-app e e-mail) permanece.
- Passar os rótulos de status a um único mapa em `@helpdesk/shared`. Hoje as etiquetas imprimem o valor cru do enum (`AGUARDANDO` em maiúsculas) em quatro pontos da interface, e sem isso a renomeação não aparece na tela.
- Publicar a identidade como `ISETES`.

## Capabilities

### New Capabilities

Nenhuma. Todo o comportamento novo pertence a capacidades existentes.

### Modified Capabilities

- `ticket-workflow`: o desvio passa a chamar-se "Pendente", exige Razão da Pendência escolhida de uma lista ou digitada, e só retorna a "Em Andamento" por ação explícita do Técnico.
- `ticket-messaging`: remove o requisito de transição automática de "Aguardando" para "Em Andamento" ao receber mensagem do Solicitante.
- `email-notifications`: assuntos e corpos passam a dizer "Pendente"; o e-mail deixa de anunciar mudança automática de status.
- `in-app-notifications`: eventos passam a referir-se a "Pendente".
- `reports-metrics`: o TMA desconta o tempo em "Pendente".
- `core-ui`: identidade publicada `ISETES`; rótulos de status derivados de um único mapa compartilhado, nunca do valor cru do enum.

## Non-goals

- Nenhum job automático de verificação de SLA.
- Nenhuma CRUD administrativa de razões (uma tabela `PendencyReason` fica para depois, tendo as razões já gravadas como semente).
- Nenhum valor novo no enum `TicketStatus` — "Pendente" é `AGUARDANDO` renomeado na interface.
- Nenhuma alteração no arquivo morto `openspec/changes/archive/`.

## Impact

- **Banco:** uma migração aditiva (`Ticket.pendenciaMotivo String?`).
- **API:** novo `GET /api/tickets/razoes-pendencia`; `PATCH /api/tickets/:id/status` grava a razão; `POST /api/tickets/:id/messages` deixa de transitar status.
- **Shared:** `STATUS_LABELS` exportado ao lado de `TicketStatusEnum`.
- **Frontend:** três etiquetas, a linha do tempo, o filtro da listagem e o modal de ação.
- **Backend:** rótulo do PDF, notificações e e-mails.
- **Deploy:** `cloudbuild.yaml` (`_APP_NAME`). **Documentação:** manual (5 arquivos).
