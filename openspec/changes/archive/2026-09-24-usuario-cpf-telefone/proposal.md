## Why

O cadastro de usuários guarda hoje apenas nome, e-mail, função, Unidade e Tipo de Ocorrência (`prisma/schema.prisma`, modelo `User`). Faltam **CPF** e **telefone**, necessários para identificar inequivocamente a pessoa e para contato fora do sistema.

Nome completo e e-mail já são obrigatórios — o spec de `user-management` inclusive já os descreve como "nome completo". O que falta na interface é só o rótulo do campo, que diz "Nome".

O ponto sensível é a obrigatoriedade sobre uma base que já tem usuários. O `CLAUDE.md` adverte que as migrations rodam no start do container e que **uma migration que falha trava o deploy** — um `ADD COLUMN ... NOT NULL` numa tabela populada falha na hora.

Três fatos fazem o desenho fechar sem engenharia extra:

- O PostgreSQL admite **múltiplos NULL** numa coluna com restrição de unicidade, então CPF único e usuários legados sem CPF convivem.
- Uma coluna adicionada nula em tabela existente não quebra a migration.
- `userSchema` é o **único** schema compartilhado por criação e edição, nos dois lados (`usuarios.ts:47,103` e `Usuarios.tsx:164`) — torná-lo exigente já cobre os dois fluxos.

Resultado: obrigatório na entrada, nulo no banco para quem é anterior à mudança, com preenchimento acontecendo naturalmente na próxima edição de cada usuário.

## What Changes

- `User` ganha `cpf` (único) e `telefone`, ambos nulos no banco.
- `userSchema` passa a exigir os dois, tornando-os obrigatórios em criação **e** edição.
- CPF validado apenas quanto ao **formato** `000.000.000-00` — sem conferência de dígitos verificadores.
- Telefone com DDD, aceitando fixo e celular, **sem máscara** (apenas dígitos).
- O formulário ganha os dois campos; o rótulo "Nome" passa a "Nome completo".
- CPF duplicado recebe mensagem amigável, como já ocorre com e-mail duplicado (`usuarios.ts:59`).
- O seed recebe CPFs fictícios, sem os quais qualquer edição de usuário de teste passaria a exigir a invenção de um.

**Consequência aceita:** editar um usuário anterior à mudança — ainda que só para trocar a Unidade — passa a exigir CPF e telefone. É o mecanismo de preenchimento gradual.

Nenhuma restrição de visibilidade precisa ser criada: `GET /api/usuarios` já é limitado a Admin, Diretor e Gestor (`usuarios.ts:12`).

## Capabilities

### Modified Capabilities
- `user-management`: CPF e telefone passam a compor os dados obrigatórios de criação e edição, com CPF único no sistema.

## Impact

- **Banco:** migration aditiva com colunas nulas e índice de unicidade sobre coluna toda nula — sem risco de travar o deploy.
- **Shared:** `schemas/user.ts`.
- **Backend:** `routes/usuarios.ts` (criação, edição, tratamento de duplicidade).
- **Frontend:** `pages/usuarios/Usuarios.tsx`.
- **Seed:** `prisma/seed.ts`.
- **Docs:** `docs/manual/perfis/administrador.md`.

## Non-goals

- Validação de dígitos verificadores do CPF.
- Bloquear o acesso de usuários legados até completarem o cadastro, nos moldes de `passwordResetRequired`.
- Tela de autoatendimento para o usuário editar os próprios dados.
- Tornar as colunas NOT NULL no banco.
- Cifrar, mascarar ou auditar o acesso ao CPF.
- Campos adicionais como matrícula, cargo ou data de nascimento.
- Busca ou login por CPF.
