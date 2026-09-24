## Why

A gestão de usuários confia na interface para limitar quais papéis cada perfil pode atribuir. O backend (`backend/src/routes/usuarios.ts`) só verifica a Unidade, o que permite escalonamento de privilégio por requisição direta:

- Gestor ou Diretor cria um usuário `ADMIN` via `POST /api/usuarios` — o select esconde a opção, a API aceita.
- Qualquer perfil edita o próprio cadastro via `PUT` e se promove (Gestor → Diretor/Admin), efetivo no próximo login.
- Gestor edita ou desativa o Diretor da Unidade — ou um Admin cuja `unidadeId` coincida com a sua.
- Gestor cria, edita e desativa Técnicos de outra área, contrariando o escopo por Tipo de Ocorrência introduzido em `gestor-escopo-por-setor`.

Isso fura o isolamento de dados, que é a restrição central do projeto.

## What Changes

- Matriz de papéis gerenciáveis, validada no servidor e centralizada em `backend/src/lib/rbac.ts`:
  - **Admin** gerencia todos os papéis, em qualquer Unidade.
  - **Diretor** gerencia Solicitante, Técnico e Gestor da própria Unidade.
  - **Gestor** gerencia Solicitante da própria Unidade e Técnico da própria Unidade **e** da própria área.
- A regra vale para listar, criar, editar e desativar; na edição, vale para o papel **atual** do alvo e para o papel **de destino**.
- Alvo fora do escopo → HTTP 404 (padrão do projeto). Papel ou área não permitidos no payload → HTTP 403.
- Ninguém altera o próprio papel, Unidade ou área; os dados pessoais (nome, CPF, telefone, e-mail, senha) continuam editáveis pelo próprio usuário.
- A listagem devolve apenas os usuários gerenciáveis, mais o próprio usuário logado.
- **BREAKING (API interna):** a lista de destinatários de reatribuição deixa de vir de `GET /api/usuarios` (que, filtrada, não traria outros Gestores da área) e passa a vir de `GET /api/tickets/:id/reassign-candidates`.
- O frontend espelha a matriz: opções de papel no select, Editar/Desativar só para alvos gerenciáveis, Tipo de Ocorrência fixo na área do Gestor ao cadastrar Técnico.
- O manual (`docs/manual/perfis/gestor-diretor.md`, `administrador.md`) descreve a matriz.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `user-management`: matriz de papéis gerenciáveis; bloqueio de auto-alteração de papel/Unidade/área; listagem restrita aos gerenciáveis.
- `rbac`: o Gestor passa a ser escopado por área também na gestão de usuários; o Diretor deixa de gerenciar outros Diretores.
- `ticket-assignment`: destinatários de reatribuição obtidos de endpoint dedicado, escopado pelo chamado.

## Non-goals

- Reativar e excluir usuários, máscaras de CPF/telefone e rótulo "Área de atuação" — ficam para uma change própria.
- Gestor com mais de uma área ou Unidade.
- Auditoria (log) de alterações de cadastro.
- Revogar JWTs já emitidos: uma promoção indevida anterior ao deploy só é desfeita corrigindo o cadastro.
- Revisar dados existentes em busca de promoções indevidas passadas.

## Impact

- **Backend:** `lib/rbac.ts` (novos helpers), `routes/usuarios.ts` (todas as rotas), `routes/tickets.ts` (novo endpoint `GET /api/tickets/:id/reassign-candidates`).
- **Frontend:** `pages/usuarios/Usuarios.tsx`, `pages/DetalhesChamado.tsx`, `api/tickets.ts`.
- **Shared:** sem mudança de schema; opcionalmente a matriz de papéis exportada para paridade front↔back.
- **Banco:** nenhuma migration.
- **Smoke script:** `backend/src/test-integration.ts` ganha casos de recusa.
