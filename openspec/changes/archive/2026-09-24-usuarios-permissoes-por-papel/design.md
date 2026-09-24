## Context

`backend/src/routes/usuarios.ts` aplica apenas `unitFilter()` sobre o alvo. O papel e a área do payload não são checados contra o papel de quem opera, e o próprio cadastro pode ser editado sem restrição. A interface esconde a opção "Administrador" para não-Admins, mas nada impede a requisição direta.

`GET /api/usuarios` tem um segundo consumidor: o modal de reatribuição em `frontend/src/pages/DetalhesChamado.tsx:62-73`, que filtra no cliente Técnicos e Gestores ativos da área do chamado. Restringir a listagem quebraria esse modal para o Gestor, que não veria outros Gestores da própria área, embora o `PATCH /reassign` os aceite como destino.

## Goals / Non-Goals

**Goals:**
- Uma única regra "quem gerencia quem", aplicada em todas as rotas de usuário e espelhada na interface.
- Nenhuma escalada de privilégio via requisição direta.
- Reatribuição continua funcionando para todos os perfis.

**Non-Goals:** ver `proposal.md`.

## Decisions

### D1. Matriz declarada no `shared`, aplicada em `lib/rbac.ts`

```
                 pode gerenciar →   SOLICITANTE   TECNICO        GESTOR   DIRETOR   ADMIN
  ADMIN                             ✔ qualquer    ✔ qualquer     ✔        ✔         ✔
  DIRETOR (Unid. U)                 ✔ U           ✔ U            ✔ U      ✘         ✘
  GESTOR  (Unid. U, área S)         ✔ U           ✔ U + área S   ✘        ✘         ✘
  TECNICO / SOLICITANTE             — sem acesso à gestão de usuários (requireRole) —
```

- `shared/src/permissions.ts` exporta `MANAGEABLE_ROLES: Record<Role, Role[]>`. O frontend usa essa tabela para montar o select, e o backend para validar o payload. É o mesmo raciocínio dos schemas Zod compartilhados: paridade sem duplicação.
- `backend/src/lib/rbac.ts` ganha:
  - `canManageUser(user, target: { role, unidadeId, sectorId })`: papel do alvo ∈ `MANAGEABLE_ROLES[user.role]`, mais `unitFilter`, mais, para o Gestor com alvo `TECNICO`, `target.sectorId === user.sectorId`.
  - `manageableUsersWhere(user)`: cláusula Prisma para a listagem, derivada da mesma matriz. Para o Gestor: `unidadeId = U AND (role = SOLICITANTE OR (role = TECNICO AND sectorId = S))`.

A mesma função `canManageUser` avalia o alvo **atual** (existe e está no escopo?) e o alvo **proposto** (payload de criação ou estado final da edição). Assim, uma edição que move um Técnico para outra área, ou promove um Solicitante a Gestor, é pega pela mesma regra, sem casos especiais.

*Alternativa descartada:* checagens `if` inline em cada rota. Esse é o padrão que produziu a falha: fácil de esquecer num ponto.

### D2. 404 para o alvo, 403 para o payload

- Alvo atual fora do escopo, por papel, Unidade ou área → **404**, igual a `unitFilter`. Não revela que o usuário existe.
- Alvo no escopo, mas payload pede papel, Unidade ou área não permitidos → **403** com mensagem em pt-BR. O operador já vê o alvo, então não há o que esconder, e 403 comunica a regra.
- Na criação não existe alvo atual, então todo payload fora da matriz → 403.

### D3. Auto-edição: dados pessoais sim, papel/Unidade/área não

Quando `target.id === user.id`, a checagem de matriz é dispensada (o Gestor não gerencia Gestores, mas edita a si mesmo). Em troca, `role`, `unidadeId` e `sectorId` do payload precisam ser iguais aos atuais; se forem diferentes → 403. Vale também para o Admin: evita que o último Admin se rebaixe por engano. A regra de autodesativação existente permanece.

### D4. Listagem = gerenciáveis + o próprio usuário

`where: { OR: [manageableUsersWhere(user), { id: user.id }] }`. O próprio usuário aparece marcado "Você", como hoje, com Editar disponível e Desativar oculto.

### D5. Endpoint dedicado para destinatários de reatribuição

`GET /api/tickets/:id/reassign-candidates` (Gestor, Diretor, Admin) reaproveita o escopo do `PATCH /:id/reassign` (`unitFilter` + `sectorFilter` sobre o chamado → 404) e devolve `{ id, nome, role }` de Técnicos e Gestores **ativos** da Unidade e do Tipo de Ocorrência do chamado. Não há conflito de rota com `GET /api/tickets/:id`, porque o número de segmentos é diferente.

Ganho colateral: o modal deixa de baixar CPF, telefone e e-mail de toda a Unidade só para montar um dropdown.

*Alternativa descartada:* devolver na listagem também os não gerenciáveis, com uma flag `gerenciavel`. Acopla duas telas a um único payload e mantém a exposição de dados pessoais.

### D6. Interface

- Select de papel: `MANAGEABLE_ROLES[currentUser.role]`. Em auto-edição, o select, a Unidade e o Tipo de Ocorrência ficam desabilitados.
- Gestor cadastrando Técnico: Tipo de Ocorrência pré-preenchido com `currentUser.sectorId` e travado (o `sectorId` já está em `AuthContext`).
- Botões Editar/Desativar seguem as mesmas regras. Como a listagem já só contém alvos gerenciáveis e o próprio usuário, a lógica da tabela fica simples.

## Risks / Trade-offs

- **[Diretores/Admins criados indevidamente antes do deploy continuam existindo]** → Fora de escopo corrigir automaticamente. A nota de release sugere que o Admin revise a lista de Diretores e Admins.
- **[Diretor perde a capacidade de cadastrar outro Diretor]** → Decisão de produto registrada nesta change. Passa a ser atribuição exclusiva do Admin; o manual explica.
- **[Frontend antigo em cache chama `/api/usuarios` para reatribuir]** → O `index.html` é servido `no-cache`, então o novo bundle chega na próxima navegação. Na janela de transição, o Gestor vê a lista reduzida (só Técnicos da área), sem erro.
- **[Técnico existente com `sectorId` nulo]** → Não aparece para nenhum Gestor, só para Diretor e Admin, que podem corrigir. Aceitável.

## Migration Plan

Sem migration. Um deploy normal pelo `main`. Rollback = reverter o commit; não há estado persistido novo.

## Open Questions

Nenhuma. A matriz foi definida pelo usuário em sessão de exploração (2026-09-24).
