> Pré-requisito: `chamado-local-titulo-derivado` implementada (usa `Ticket.local`, `lib/local.ts` e `GET /api/tickets/locais`).

## 1. Enum de histórico

- [ ] 1.1 `prisma/schema.prisma`: acrescentar `EDICAO` a `HistoryType` e gerar a migration aditiva. (~45min)
- [ ] 1.2 `shared/`: acrescentar `EDICAO` ao enum Zod de tipos de histórico, mantendo a paridade exigida pelo `CLAUDE.md`. Rebuild do `shared`. (~30min)

## 2. Endpoint de correção

- [ ] 2.1 `routes/tickets.ts`: `PATCH /api/tickets/:id/local` — validação do corpo, escopo com `unitFilter`/`sectorFilter` (404) e direito de edição por papel (403), conforme design D1. (~2h)
- [ ] 2.2 `routes/tickets.ts`: recusar a correção quando o chamado estiver `FECHADO`, com a mensagem já usada no bloqueio de chamado fechado (design D2). (~30min)
- [ ] 2.3 `routes/tickets.ts`: aplicar `resolveLocal` com a Unidade **do chamado** e recompor o título com `buildTicketTitulo`, gravando local e título na mesma operação (design D3 e D4). (~1h30)
- [ ] 2.4 `routes/tickets.ts`: registrar o evento `EDICAO` no histórico com campo, valor anterior e valor novo (design D5). (~45min)

## 3. Notificação

- [ ] 3.1 `services/notification.ts`: evento de correção de local para o Técnico atribuído, disparado apenas quando houver técnico e o autor não for ele (design D6). (~1h30)
- [ ] 3.2 `services/email.ts`: mensagem correspondente, com o local anterior, o novo e o link direto para o chamado. (~1h)
- [ ] 3.3 `components/NotificationBell.tsx`: ícone do novo tipo de notificação. (~15min)

## 4. Interface

- [ ] 4.1 `api/tickets.ts`: função de correção do local e consulta das sugestões pela Unidade do chamado. (~45min)
- [ ] 4.2 `pages/DetalhesChamado.tsx`: ação de edição junto ao local, visível apenas a quem pode corrigir, com sugestões e exibição de 403/409 no próprio campo (design D7). (~2h30)
- [ ] 4.3 `pages/DetalhesChamado.tsx`: caso `EDICAO` na linha do tempo e no seletor de ícone, apresentando "de X para Y" com autor e data/hora. (~1h)
- [ ] 4.4 Invalidar as queries do chamado e do histórico ao concluir a correção. (~30min)

## 5. Documentação

- [ ] 5.1 `docs/manual/perfis/solicitante.md`: como corrigir o local de um chamado já aberto e até quando. (~45min)
- [ ] 5.2 `docs/manual/perfis/tecnico.md`: o Técnico atribuído pode corrigir o local ao constatar divergência em campo. (~45min)
- [ ] 5.3 `docs/manual/perfis/gestor-diretor.md`: correção de local dentro do escopo, inclusive para padronizar grafias. (~45min)
- [ ] 5.4 `CLAUDE.md`: acrescentar `PATCH /api/tickets/:id/local` à tabela de rotas e `EDICAO` à lista de `HistoryType`. Rodar `mkdocs build --strict`. (~30min)

## 6. Verificação

Sem suíte automatizada; verificação manual contra o banco semeado.

- [ ] 6.1 Como Solicitante dono, corrigir o local de um chamado Aberto: o local muda, o título é recomposto e a linha do tempo registra "de X para Y". (~30min)
- [ ] 6.2 Como Solicitante, tentar corrigir o local de um chamado de outra pessoa → 404. (~15min)
- [ ] 6.3 Como Técnico atribuído, corrigir o local: funciona, e nenhuma notificação é enviada a ele próprio. (~20min)
- [ ] 6.4 Como Técnico do mesmo Setor e Unidade, **não** atribuído, tentar corrigir → **403** (e não 404), já que ele enxerga o chamado. (~20min)
- [ ] 6.5 Como Técnico de outro Setor, tentar corrigir → **404**. (~15min)
- [ ] 6.6 Como Gestor do Setor, corrigir um chamado com Técnico atribuído: o Técnico recebe notificação em aplicação e e-mail com o local anterior e o novo. (~30min)
- [ ] 6.7 Tentar corrigir o local de um chamado Fechado → recusado com a mensagem de chamado fechado. Corrigir em Resolvido e Aguardando → permitido. (~30min)
- [ ] 6.8 Corrigir informando uma grafia divergente apenas na caixa de um local já existente na Unidade do chamado: grava a grafia canônica. (~20min)
- [ ] 6.9 Como Admin, corrigir um chamado de outra Unidade: as sugestões apresentadas são as da Unidade do chamado, não as da Unidade do Admin. (~20min)
- [ ] 6.10 Corrigir o local de um chamado aberto antes da change anterior: o título digitado é substituído pelo composto. (~20min)
- [ ] 6.11 Com o SendGrid em modo mock, confirmar que uma falha de notificação não impede a correção. (~20min)
- [ ] 6.12 Conferir que o evento `EDICAO` aparece com rótulo e ícone próprios na linha do tempo, sem cair no ramo padrão. (~15min)
- [ ] 6.13 `docs/manual/` atualizado e `mkdocs build --strict` sem erros. (~item padrão)
