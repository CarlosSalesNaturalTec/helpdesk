## Why

O cadastro de usuários tem atritos apontados pelo cliente:

- O CPF só é aceito se o operador digitar pontos e hífen (`000.000.000-00`); o campo não formata nada.
- O telefone só aceita dígitos. `(71) 99965-5578`, a forma natural de escrever, é recusado.
- Um usuário desativado não pode ser reativado nem excluído. O botão Editar fica desabilitado para inativos, então um desligamento por engano não tem volta pela interface, e cadastros criados por erro ficam para sempre na lista.
- O campo "Tipo de Ocorrência" no cadastro de Técnico e Gestor não se explica: o termo descreve um chamado, não uma pessoa. O cliente perguntou por que o Gestor tem esse campo.

## What Changes

- **CPF:** máscara aplicada durante a digitação. O operador digita apenas números e o formato armazenado (`000.000.000-00`) não muda.
- **Telefone:** máscara durante a digitação, alternando entre fixo `(71) 3333-4444` e celular `(71) 99965-5578`. O valor é enviado e armazenado **só com dígitos**, como hoje. A listagem exibe o número formatado.
- **Reativar:** nova ação para usuários inativos (`PATCH /api/usuarios/:id/activate`). Zera o bloqueio por tentativas de login.
- **Excluir:** nova ação para usuários inativos **sem nenhum vínculo** (nunca abriram, atenderam ou comentaram um chamado e não têm notificações). Com vínculo, a exclusão é recusada e a mensagem orienta a manter o usuário inativo.
- **Rótulo:** no formulário, o campo passa a se chamar "Área de atuação", com uma dica explicando que ele define os Tipos de Ocorrência que o usuário atende ou gerencia.
- O manual de administração e o de Gestor/Diretor passam a descrever as máscaras, a reativação e a exclusão.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `user-management`: formato de entrada de CPF e telefone; reativação; exclusão de usuário inativo sem histórico; rótulo do campo de área.

## Non-goals

- Anonimização ou exclusão de usuários com histórico (LGPD) — possível evolução futura.
- Validação dos dígitos verificadores do CPF.
- Mudar o formato armazenado de CPF ou telefone, ou migrar dados existentes.
- Gestor com mais de uma área ou Unidade (pedido descartado).
- Reatribuir chamados automaticamente ao reativar ou desativar um Técnico.

## Dependências

Depende de `usuarios-permissoes-por-papel`: reativar e excluir usam o mesmo `canManageUser()` das demais ações. Implementar depois dela.

## Impact

- **Backend:** `routes/usuarios.ts` (duas rotas novas: `PATCH /:id/activate` e `DELETE /:id`).
- **Frontend:** `pages/usuarios/Usuarios.tsx` (máscaras, botões, modais de confirmação, rótulo); utilitário de máscara em `frontend/src/utils/`.
- **Shared:** mensagens do `userSchema` que citam "Setor"/"Tipo de Ocorrência" no campo de área passam a dizer "Área de atuação". Regex inalteradas.
- **Banco:** nenhuma migration.
- **Docs:** `docs/manual/perfis/administrador.md`, `gestor-diretor.md`; tabela de rotas do `CLAUDE.md`.
