## 1. Matriz compartilhada

- [x] 1.1 Criar `shared/src/permissions.ts` com `MANAGEABLE_ROLES: Record<Role, Role[]>` (ADMIN → todos; DIRETOR → SOLICITANTE, TECNICO, GESTOR; GESTOR → SOLICITANTE, TECNICO; demais → vazio) e exportar em `shared/src/index.ts`. Rodar o build do `shared`. (~30min)

## 2. Backend — regra centralizada

- [x] 2.1 `backend/src/lib/rbac.ts`: implementar `canManageUser(user, target: { role, unidadeId, sectorId })`, combinando matriz + `unitFilter` + área do Técnico para o Gestor (design D1). (~1h)
- [x] 2.2 `backend/src/lib/rbac.ts`: implementar `manageableUsersWhere(user)`, que devolve a cláusula Prisma equivalente para a listagem. (~1h)

## 3. Backend — rotas de usuário

- [x] 3.1 `GET /api/usuarios`: substituir o `if ADMIN` pelo `where: { OR: [manageableUsersWhere(user), { id: user.id }] }` (design D4). (~30min)
- [x] 3.2 `POST /api/usuarios`: após o parse, validar `canManageUser(user, { role, unidadeId: targetUnidadeId, sectorId })`; recusar com 403 e mensagem em pt-BR. (~1h)
- [x] 3.3 `PUT /api/usuarios/:id`: se o alvo for o próprio usuário, exigir `role`/`unidadeId`/`sectorId` iguais aos atuais (403 se diferentes). Caso contrário, 404 se `!canManageUser(user, alvoAtual)` e 403 se `!canManageUser(user, estadoFinal)` (design D2, D3). Manter as checagens existentes de Unidade, e-mail e CPF. (~2h)
- [x] 3.4 `PATCH /api/usuarios/:id/deactivate`: trocar `unitFilter` por `canManageUser` (404 fora do escopo). (~30min)

## 4. Backend — destinatários de reatribuição

- [x] 4.1 `backend/src/routes/tickets.ts`: criar `GET /api/tickets/:id/reassign-candidates` (Gestor, Diretor, Admin). Aplicar o mesmo escopo do `PATCH /:id/reassign` (404) e retornar `{ id, nome, role }` de Técnicos e Gestores ativos da Unidade e do Tipo de Ocorrência do chamado, ordenados por nome (design D5). (~1h30)
- [x] 4.2 Adicionar o endpoint à tabela de rotas do `CLAUDE.md`. (~15min)

## 5. Frontend

- [x] 5.1 `frontend/src/api/tickets.ts`: função `getReassignCandidates(id)`. `DetalhesChamado.tsx`: trocar a query de `/api/usuarios` + filtro no cliente por esse endpoint (queryKey por chamado). (~1h)
- [x] 5.2 `Usuarios.tsx`: montar as opções do select de papel a partir de `MANAGEABLE_ROLES[currentUser.role]`. (~1h)
- [x] 5.3 `Usuarios.tsx`: na auto-edição, desabilitar papel, Unidade e Tipo de Ocorrência. Para o Gestor, pré-preencher e travar o Tipo de Ocorrência com `currentUser.sectorId`. (~1h30)
- [x] 5.4 `Usuarios.tsx`: tratar o 403 do backend exibindo a mensagem retornada no `modalError` (o fluxo atual já exibe `error` string, confirmar). (~30min)

## 6. Smoke script

- [x] 6.1 `backend/src/test-integration.ts`: acrescentar casos de recusa — Gestor cria ADMIN (403), Gestor edita a si mesmo com `role: DIRETOR` (403), Gestor edita Técnico de outra área (404), Diretor cria DIRETOR (403). (~2h)

## 7. Documentação

- [x] 7.1 `docs/manual/perfis/gestor-diretor.md`: substituir a seção "Gestão de usuários da Unidade" pela matriz (quem gerencia quem), incluindo a trava de área do Gestor e a proibição de alterar o próprio papel. (~1h)
- [x] 7.2 `docs/manual/perfis/administrador.md`: registrar que Diretores e Administradores são geridos exclusivamente pelo Admin. Rodar `mkdocs build --strict`. (~45min)
- [x] 7.3 `docs/prd_helpdesk.md` diverge (diz que o Gestor cria Diretores): anotar a divergência apontando para esta change. (~15min)

## 8. Verificação

Sem suíte automatizada; verificação manual contra o banco semeado (`gestor@` = Tecnologia, `gestor2@` = Manutenção, ambos da Unidade Central). Criar um Diretor via Admin para os casos de Diretor.

- [x] 8.1 Como `gestor@`: a listagem mostra Solicitantes da Unidade Central, `tecnico@` e o próprio usuário. **Não** mostra `tecnico3@`, `gestor2@` nem o Diretor. (~30min)
- [x] 8.2 Como `gestor@`, o select de papel oferece só Solicitante e Técnico, e o Tipo de Ocorrência fica travado em Tecnologia. (~15min)
- [x] 8.3 Requisições diretas (curl/Insomnia) como `gestor@`: criar ADMIN → 403; `PUT` em si mesmo com `role: DIRETOR` → 403; `PUT`/`deactivate` em `tecnico3@` → 404; `PUT` em Diretor → 404. (~1h)
- [x] 8.4 Como `gestor@`, editar o próprio telefone funciona; os campos de papel, Unidade e área aparecem desabilitados. (~15min)
- [x] 8.5 Como Diretor: cria Gestor (ok), tenta criar Diretor via API (403), não vê Admin nem outros Diretores na listagem. (~30min)
- [x] 8.6 Reatribuição: como `gestor@` num chamado de Tecnologia, o modal lista `tecnico@` e o próprio `gestor@`. Como Diretor, lista os de qualquer área conforme o chamado. `reassign-candidates` de chamado de Manutenção como `gestor@` → 404. (~45min)
- [x] 8.7 Como Admin, nada muda: lista todos, cria qualquer papel, mas não altera o próprio papel. (~30min)
- [x] 8.8 `docs/manual/` atualizado e `mkdocs build --strict` sem erros. (~item padrão)
