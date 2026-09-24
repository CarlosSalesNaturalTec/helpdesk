# Tarefas — CPF e telefone no cadastro de usuários

Ordem: banco → shared → backend → frontend → seed → docs. O `shared` precisa ser construído antes dos outros workspaces.

## 1. Banco de dados

- [x] 1.1 `prisma/schema.prisma`: adicionar ao modelo `User` os campos `cpf` (opcional, único) e `telefone` (opcional). Ambos **nulos no banco** — a obrigatoriedade vive no schema compartilhado, não na coluna. (~1h)
- [x] 1.2 Gerar e revisar a migration. Confirmar que o SQL é puramente aditivo (`ADD COLUMN` nulo + índice de unicidade) e que **não** contém `NOT NULL` nem `DEFAULT` sobre tabela populada — as migrations rodam no start do container e uma falha trava o deploy. (~1h)
- [x] 1.3 Aplicar com `npx prisma migrate dev`, rodar `npx prisma generate` e conferir que o client tipado expõe os dois campos. (~30min)

## 2. Schemas compartilhados

- [x] 2.1 `shared/src/schemas/user.ts`: adicionar `cpf` obrigatório com validação de formato `000.000.000-00` (sem dígitos verificadores) e `telefone` obrigatório aceitando somente dígitos, com DDD, fixo ou celular. Mensagens em pt-BR. (~2h)
- [x] 2.2 Construir o `shared` e conferir os erros de tipo em backend e frontend. (~30min)

## 3. Backend

- [x] 3.1 `backend/src/routes/usuarios.ts:52` e `:108`: incluir `cpf` e `telefone` na desestruturação e nos dados de criação e atualização. (~1h)
- [x] 3.2 `backend/src/routes/usuarios.ts`: tratar CPF duplicado com mensagem amigável, espelhando a checagem de e-mail já existente na linha 59. Cobrir também a edição, onde o CPF do próprio usuário não conta como duplicata. (~2h)
- [x] 3.3 Conferir que `GET /api/usuarios` devolve os novos campos e que o hash de senha continua omitido. (~30min)

## 4. Frontend

- [x] 4.1 `frontend/src/pages/usuarios/Usuarios.tsx`: adicionar os dois campos ao estado do formulário, ao payload, e ao preenchimento na abertura do modal de edição. (~2h)
- [x] 4.2 Adicionar os dois campos ao formulário e mapear seus erros em `fieldErrors` (~linha 164), junto dos campos já tratados. (~2h)
- [x] 4.3 Trocar o rótulo "Nome" por "Nome completo". O campo e a validação `min(2)` permanecem. (~15min)
- [x] 4.4 Acrescentar CPF e telefone à listagem de usuários, exibindo um marcador neutro para os registros legados ainda vazios. (~1h)

## 5. Seed

- [x] 5.1 `prisma/seed.ts`: atribuir CPFs fictícios em formato válido e telefones aos oito usuários semeados. Sem isso, qualquer edição de usuário de teste passa a exigir a invenção de um CPF. Os CPFs precisam ser distintos entre si por causa da unicidade. (~1h)

## 6. Documentação

- [x] 6.1 Atualizar `docs/manual/perfis/administrador.md` com os novos campos obrigatórios, o formato esperado de cada um e a orientação de que usuários antigos completam o cadastro na próxima edição. Rodar `mkdocs build --strict`. (~2h)

## 7. Verificação

Sem suíte automatizada no repositório; verificação manual contra o banco semeado.

- [x] 7.1 Criar usuário sem CPF e sem telefone — deve ser recusado nos dois campos. (~30min)
- [x] 7.2 Criar usuário com CPF já existente — deve exibir mensagem amigável, nunca erro técnico de banco. (~30min)
- [x] 7.3 CPF fora do formato recusado; CPF em formato correto com dígitos verificadores inconsistentes **aceito**. (~30min)
- [x] 7.4 Telefone fixo com DDD aceito; telefone com máscara recusado. (~30min)
- [x] 7.5 Requisição direta à API com valores fora do formato, sem passar pelo formulário — deve ser recusada pelo servidor. (~30min)
- [x] 7.6 Com dois ou mais usuários de CPF nulo na base, confirmar que nenhuma operação falha por violação de unicidade. (~30min)
- [x] 7.7 Usuário legado sem CPF realiza login e opera normalmente, sem bloqueio. (~30min)
- [x] 7.8 Editar usuário legado exige preencher os dois campos antes de salvar. (~30min)
- [x] 7.9 `docs/manual/` atualizado. (~item padrão)
