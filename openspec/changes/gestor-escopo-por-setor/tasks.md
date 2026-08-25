# Tarefas — Gestor escopado por área

Ordem importa: schema → shared → backend → frontend → seed → docs. O `shared` precisa ser construído antes de backend e frontend (`npm run build --workspace=shared`).

## 1. Banco de dados

- [ ] 1.1 Renomear o valor do enum no `prisma/schema.prisma` (`GESTOR_TI` → `GESTOR`) e gerar a migration com `--create-only`, substituindo o SQL gerado por `ALTER TYPE "Role" RENAME VALUE 'GESTOR_TI' TO 'GESTOR';`. O SQL padrão do Prisma faz drop/recreate do tipo e falha com colunas dependentes. (~1h)
- [ ] 1.2 Tornar `Ticket.sectorId` NOT NULL no schema e acrescentar o `ALTER TABLE` à mesma migration. Verificar antes que não há linhas com `sectorId` nulo no banco local; se houver, rodar `npx prisma db seed` (recria os tickets). (~1h)
- [ ] 1.3 Aplicar com `npx prisma migrate dev`, rodar `npx prisma generate` e confirmar que o client tipado expõe `Role.GESTOR`. (~30min)

## 2. Schemas compartilhados

- [ ] 2.1 `shared/src/schemas/user.ts`: trocar `'GESTOR_TI'` por `'GESTOR'` no `RoleEnum` e estender o `superRefine` para exigir `sectorId` também quando `role === 'GESTOR'`, com mensagem em pt-BR. (~1h)
- [ ] 2.2 Construir o `shared` e corrigir os erros de tipo que surgirem em backend e frontend — eles são o mapa das próximas tarefas. (~30min)

## 3. Backend — escopo centralizado

- [ ] 3.1 `backend/src/lib/rbac.ts`: adicionar `scopeWhere(user)`, devolvendo `{ unidadeId?, sectorId? }` conforme o papel (SOLICITANTE → nenhum; TECNICO/GESTOR → ambos; DIRETOR → só unidade; ADMIN → vazio), e `sectorFilter(user, targetSectorId)` para checagem de registro único, no molde do `unitFilter()` existente. (~2h)
- [ ] 3.2 `backend/src/routes/tickets.ts` (~linha 188): substituir a condicional de escopo da listagem pelo `scopeWhere()`. (~1h)
- [ ] 3.3 `backend/src/routes/tickets.ts`: aplicar a checagem de setor nos acessos a chamado individual — linhas ~330, ~364, ~899, ~968 — mantendo o retorno 404 (nunca 403, para não distinguir inexistência de falta de permissão). (~2h)
- [ ] 3.4 `backend/src/routes/tickets.ts` `PATCH /:id/assign` (~linha 514): recusar a auto-atribuição quando o setor do chamado difere do setor do usuário. (~1h)
- [ ] 3.5 `backend/src/routes/tickets.ts` `PATCH /:id/reassign` (~linhas 588-618): validar que o Gestor é da área do chamado e que o destinatário pertence ao mesmo `sectorId`. (~2h)
- [ ] 3.6 `backend/src/routes/dashboard.ts` (~linha 33): estender a derivação de `sectorId` para incluir `GESTOR`. O SQL cru já parametriza `sectorId`; muda só a origem do valor. (~1h)
- [ ] 3.7 `backend/src/routes/reports.ts`: introduzir o escopo de setor, hoje inexistente — nos cards, no SQL de TMA (~linha 224) e no SQL de distribuição (~linha 257). É a tarefa de maior risco de vazamento; conferir cada query separadamente. (~3h)
- [ ] 3.8 Substituir os literais `'GESTOR_TI'` restantes por `'GESTOR'` em `usuarios.ts`, `middleware/auth.ts` e demais rotas; validar com `grep -rn "GESTOR_TI" backend/src` retornando vazio. (~1h)
- [ ] 3.9 `GET /api/auth/me` e o retorno de `GET /api/usuarios`: incluir `sector: { nome }` para alimentar o rótulo derivado da UI. (~1h)

## 4. Frontend

- [ ] 4.1 Atualizar as uniões de tipo: `context/AuthContext.tsx:9`, `components/Guards.tsx:7`, `pages/usuarios/Usuarios.tsx:20,45`. (~1h)
- [ ] 4.2 `App.tsx:82,92,102`: trocar `GESTOR_TI` por `GESTOR` nos `allowedRoles`. (~30min)
- [ ] 4.3 `components/Layout.tsx:42,52`: badge e rótulo derivados — `Gestor de ${sector.nome}`, com fallback "Gestor". (~1h)
- [ ] 4.4 `pages/usuarios/Usuarios.tsx:234,244,402`: rótulo derivado na listagem, texto da `<option>` para "Gestor" e exibição obrigatória do seletor de Tipo de Ocorrência quando o papel for `GESTOR`. (~2h)
- [ ] 4.5 `pages/DetalhesChamado.tsx:68,71,234,239,242`: atualizar as checagens de papel e filtrar `tecnicosDisponiveis` pelo `sectorId` do chamado. (~2h)
- [ ] 4.6 `grep -rn "GESTOR_TI" frontend/src` deve retornar vazio. (~15min)

## 5. Seed

- [ ] 5.1 `prisma/seed.ts`: atribuir o setor "Tecnologia" a `gestor@helpdesk.com` e criar um segundo Sector ("Manutenção") com um `gestor2@helpdesk.com` e um `tecnico3@helpdesk.com` daquela área, além de chamados nos dois setores — sem isso não há como exercitar o isolamento manualmente. (~2h)

## 6. Documentação

- [ ] 6.1 Atualizar `docs/manual/`: `perfis/gestor-diretor.md` (papel renomeado e escopado por área), `perfis/tecnico.md`, `perfis/administrador.md` (setor obrigatório ao cadastrar gestor) e `funcionalidades/relatorios-dashboard.md` (métricas agora escopadas). (~2h)
- [ ] 6.2 `mkdocs.yml`: ajustar o rótulo de nav "Gestor de TI e Diretor". Rodar `mkdocs build --strict` para validar os links. (~30min)
- [ ] 6.3 Atualizar as menções a `GESTOR_TI`/"Gestor de TI" em `CLAUDE.md` e no `context` de `openspec/config.yaml`. (~30min)

## 7. Verificação

Não há suíte automatizada no repositório; a verificação é manual, contra o banco semeado.

- [ ] 7.1 Logar como `gestor@helpdesk.com` (Tecnologia) e confirmar que a listagem, o dashboard e os relatórios não trazem nada de "Manutenção".
- [ ] 7.2 Logar como `gestor2@helpdesk.com` (Manutenção) e confirmar o espelho — e que a soma das duas visões não excede a do Diretor.
- [ ] 7.3 Requisitar por ID um chamado de outra área com o token do gestor e confirmar **404**, não 403 — inclusive em `/history`, `/messages` e `/anexo`.
- [ ] 7.4 Confirmar que o Diretor continua vendo todas as áreas da Unidade e que o Admin continua vendo tudo.
- [ ] 7.5 Tentar criar um Gestor sem Tipo de Ocorrência pela UI e pela API direta; ambos devem ser rejeitados.
- [ ] 7.6 Abrir o modal de reatribuição e confirmar que só aparecem destinatários da mesma área.
- [ ] 7.7 Confirmar que o badge exibe "Gestor de Manutenção" e que a UI não quebra se o nome do setor faltar.
- [ ] 7.8 Rodar `npx prisma migrate deploy` num banco limpo, simulando o start do container — uma migration inválida trava o deploy do Cloud Run.
- [ ] 7.9 Confirmar que `docs/manual/` foi atualizado nesta mesma mudança.
