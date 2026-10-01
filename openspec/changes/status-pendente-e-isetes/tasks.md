# Tasks

Ordem ditada pelo Migration Plan do `design.md`: `shared` primeiro (backend e frontend consomem `dist/`), rótulos antes da cópia (sem eles a renomeação não aparece na tela), endpoint antes do modal (o `<datalist>` precisa de fonte), e rebranding por último.

Não há runner de teste no repositório — a verificação é build com `tsc`, os scripts manuais `backend/src/test-*.ts` contra banco local e comportamento observável na interface.

## 1. Fonte única de rótulos de status

- [ ] 1.1 Exportar `STATUS_LABELS: Record<TicketStatusType, string>` de `shared/src/schemas/ticket.ts`, ao lado de `TicketStatusEnum`, com `AGUARDANDO: 'Pendente'`. Re-exportar em `shared/src/index.ts`. Verificar: `npm run build --workspace=shared` passa e omitir uma chave do mapa quebra o build com erro de tipo. (~1h)
- [ ] 1.2 Exportar também `STATUS_BADGE_CLASSES: Record<TicketStatusType, string>` com os valores hoje repetidos nas três funções `getStatusBadgeClass`, mantendo `badge-aguardando` (identificador de código preservado, D1). Verificar: build do `shared` passa. (~30min)
- [ ] 1.3 Substituir `{ticket.status.replace('_', ' ')}` por `STATUS_LABELS[ticket.status]` em `TicketCard.tsx:59`, `Chamados.tsx:316` e `DetalhesChamado.tsx:464`, e remover as três funções `getStatusBadgeClass` locais em favor de `STATUS_BADGE_CLASSES`. Verificar: `npm run build --workspace=frontend` passa e as etiquetas exibem "Pendente", "Em Andamento", "Aberto" (não mais maiúsculas cruas). (~1h30)
- [ ] 1.4 Aplicar os rótulos à linha do tempo em `DetalhesChamado.tsx:338` (`content.from`/`content.to`). Verificar: um chamado com transição para pendência exibe "Em Andamento" → "Pendente" na timeline, conforme cenário do delta `core-ui`. (~30min)
- [ ] 1.5 Substituir o `STATUS_LABELS` local de `Chamados.tsx:14` e o de `reports.ts:56` pelo mapa compartilhado, removendo as duas duplicatas. Verificar: build de `frontend` e `backend` passa; filtro de status da listagem e PDF exibem "Pendente". (~1h)

## 2. Persistência e gravação da Razão da Pendência

- [ ] 2.1 Adicionar `pendenciaMotivo String?` ao `model Ticket` e gerar a migração aditiva (nullable, sem backfill). Verificar: `npx prisma migrate dev` aplica sem erro e `npx prisma migrate deploy` roda idempotente numa base já migrada. (~1h)
- [ ] 2.2 Criar `backend/src/lib/pendencia.ts` com `normalizePendenciaMotivo()` e `resolvePendenciaMotivo(valor, sectorId)` — irmão de `lib/local.ts`, resolvendo por `sectorId` (D4, Non-Goal de não parametrizar um genérico). Verificar: "  aguardando   material  " resolve para a grafia já gravada "Aguardando material" no mesmo Sector. (~1h30)
- [ ] 2.3 Estender `ticketStatusSchema` em `shared`: trocar a validação de `mensagem` para a Razão da Pendência com mínimo 2 e máximo 100 caracteres, e atualizar a mensagem de erro de `ticket.ts:76`. Verificar: build do `shared` passa e a transição sem razão é recusada pelo schema. (~1h)
- [ ] 2.4 Em `PATCH /api/tickets/:id/status`, gravar a razão resolvida em `Ticket.pendenciaMotivo` ao entrar em pendência e limpá-la (`null`) ao voltar para `EM_ANDAMENTO`, mantendo o registro no `content` do `TicketHistory`. Verificar: via `test-tickets.ts`, a coluna é preenchida na pendência, zerada na retomada, e o evento histórico persiste a razão. (~2h)
- [ ] 2.5 Corrigir `prisma/seed.ts:353`: a chave `motivo` passa a `mensagem`, alinhando-se ao que a rota grava e a tela lê. Verificar: após `npx prisma db seed`, a razão do chamado de exemplo aparece na linha do tempo em vez de em branco. (~30min)

## 3. Endpoint de razões já registradas

- [ ] 3.1 Implementar `GET /api/tickets/razoes-pendencia` espelhando `/api/tickets/locais`: `distinct` + ordenação, escopo por `sectorId` (Técnico/Gestor no próprio; Diretor nos Sectors de sua Unidade; Admin em todos, podendo estreitar com `?sectorId=`). Registrar **antes** de `/api/tickets/:id`. Verificar: Fastify não casa `:id = "razoes-pendencia"`, e um Técnico de Tecnologia não recebe razões de Manutenção (cenário do delta `ticket-workflow`). (~2h)
- [ ] 3.2 Adicionar ao `backend/src/test-tickets.ts` as asserções de escopo do novo endpoint, incluindo o isolamento entre Unidades. Verificar: o script passa contra banco semeado. (~1h)

## 4. Remoção da retomada automática

- [ ] 4.1 Remover o bloco de transição automática em `backend/src/routes/tickets.ts:1204-1222`, preservando a chamada a `notifyMessageInAguardando`. Verificar: mensagem do Solicitante em chamado pendente mantém o status e ainda notifica o Técnico (cenário do delta `ticket-workflow`). (~1h)
- [ ] 4.2 Ajustar `backend/src/test-notifications.ts:170-182`, que hoje afirma a transição automática, para asserir a permanência em pendência mais o disparo da notificação. Verificar: o script passa. (~1h)
- [ ] 4.3 Atualizar `docs/manual/perfis/solicitante.md:41`, `docs/manual/perfis/tecnico.md:15-17` e `docs/manual/funcionalidades/ciclo-de-vida.md:29,30,39` removendo a promessa de retomada automática e descrevendo "Retomar Atendimento". Verificar: `mkdocs build --strict` passa sem link quebrado. (~1h30)

## 5. Campo de razão no modal do Técnico

- [ ] 5.1 Trocar o `<textarea>` de `DetalhesChamado.tsx:950-960` por `<input list>` + `<datalist>`, no padrão de `AbrirChamado.tsx:302-316`, alimentado pelo novo endpoint via React Query. Verificar: as razões do Sector aparecem como sugestões, uma razão nova pode ser digitada e passa a sugerir-se na pendência seguinte. (~2h)
- [ ] 5.2 Tratar falha da consulta como conveniência perdida, não erro: campo segue editável, sem mensagem e fora de `referenciasIndisponiveis` (mesma postura documentada em `AbrirChamado.tsx:99-101`). Verificar: com o endpoint derrubado, a pendência ainda pode ser concluída e nenhum erro é exibido. (~1h)
- [ ] 5.3 Trocar a cópia do painel e do modal: `DetalhesChamado.tsx:826` ("Colocar em Pendente"), `:939` (título), `:952` e `:341` ("Razão da Pendência"), `:956` (placeholder). Verificar: nenhuma ocorrência de "Aguardando"/"Aguardo" voltada ao usuário resta em `DetalhesChamado.tsx`. (~1h)
- [ ] 5.4 Exibir a razão corrente do chamado pendente no cabeçalho de detalhes, lendo `pendenciaMotivo`, tratando nulo como ausência (chamados anteriores à coluna). Verificar: chamado pendente antigo não quebra a tela e não exibe rótulo vazio. (~1h)
- [ ] 5.5 Atualizar `docs/manual/perfis/tecnico.md` com o novo campo e o comportamento de sugestões. Verificar: `mkdocs build --strict` passa. (~1h)

## 6. Cópia em notificações, e-mails e relatório

- [ ] 6.1 Atualizar os textos de `backend/src/services/notification.ts:70` e `:196` para "Pendente", preservando os identificadores `'AGUARDANDO'`/`'MENSAGEM_AGUARDANDO'` de `Notification.type` (D1 — linhas em produção). Verificar: notificações antigas continuam com ícone próprio no `NotificationBell`, sem cair no tratamento de tipo desconhecido. (~1h)
- [ ] 6.2 Atualizar `backend/src/services/email.ts:62,65,128,131`: assunto e corpo passam a dizer "Pendente", e a frase de `:131` sobre atualização automática de status é removida em favor de "o atendimento será retomado pelo Técnico". Verificar: com `SENDGRID_API_KEY` ausente, o modo mock loga os textos novos. (~1h30)
- [ ] 6.3 Atualizar `docs/manual/funcionalidades/notificacoes.md:10-11`, `funcionalidades/ciclo-de-vida.md:9,21` e `funcionalidades/relatorios-dashboard.md:21,33` para "Pendente". Verificar: `mkdocs build --strict` passa e nenhuma ocorrência de "Aguardando" como nome de status resta em `docs/manual/`. (~1h)

## 7. Identidade publicada como ISETES

- [ ] 7.1 Trocar `_APP_NAME: ISETS` por `ISETES` em `cloudbuild.yaml:23`, conferindo que a sintaxe `^@^APP_NAME=...@CLIENT_NAME=` da linha 83 segue propagando a `CLIENT_NAME` vazia. Verificar: build local com `VITE_APP_NAME=ISETES VITE_CLIENT_NAME=""` exibe "ISETES" sozinho na aba, na navbar e no login, sem travessão residual. (~1h)
- [ ] 7.2 Backend local com `APP_NAME=ISETES CLIENT_NAME=""`: gerar um PDF de relatório e conferir cabeçalho "Relatório ISETES" e arquivo `relatorio_isetes.pdf` derivado de `brandingSlug()`. Verificar: o arquivo baixado tem o slug novo. (~30min)
- [ ] 7.3 Atualizar as menções em prosa: `.env.example:22`, `openspec/config.yaml:4` e `CLAUDE.md:7,9`. **Não tocar `openspec/changes/archive/`** — é registro histórico (Non-goal). Verificar: `grep -rn "ISETS" --include="*.yaml" --include="*.md" .` fora de `archive/` e `node_modules/` não retorna nada. (~30min)

## 8. Verificação integrada

- [ ] 8.1 Fluxo completo em banco local: abrir chamado → assumir → colocar em Pendente escolhendo razão da lista → Solicitante envia mensagem (status permanece Pendente, Técnico notificado) → Técnico retoma (razão zerada) → resolver → fechar. Verificar: cada passo bate com os cenários dos deltas `ticket-workflow` e `ticket-messaging`. (~2h)
- [ ] 8.2 Conferir que o cartão "Em Andamento" do Dashboard e o TMA do relatório seguem contando a pendência: `dashboard.ts:41` e `reports.ts:196` mantêm o literal `'AGUARDANDO'` e não foram tocados. Verificar: um chamado pendente aparece no cartão e seu tempo é descontado do TMA. (~1h)
- [ ] 8.3 Rodar `npm run build` na raiz (shared → backend → frontend) e `mkdocs build --strict`. Verificar: ambos passam sem erro. (~30min)
- [ ] 8.4 Confirmar que `docs/manual/` foi atualizado nos grupos 4, 5 e 6 e descreve o comportamento entregue, não o anterior. Verificar: leitura das páginas de Técnico, Solicitante e Ciclo de Vida. (~30min)
