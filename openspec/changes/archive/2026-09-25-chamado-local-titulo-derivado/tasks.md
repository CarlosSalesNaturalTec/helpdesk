> Recomendado aplicar depois de `abrir-chamado-dropdowns-resilientes`: as duas mexem em `AbrirChamado.tsx`.

## 1. Modelo e schema compartilhado

- [x] 1.1 `prisma/schema.prisma`: acrescentar `local String? @db.VarChar(100)` em `Ticket`. Gerar a migration aditiva e rodar `npx prisma generate`. (~45min)
- [x] 1.2 `shared/src/schemas/ticket.ts`: remover `titulo` de `createTicketSchema` e acrescentar `local` (2 a 60 caracteres, mensagens em pt-BR). Rebuild do `shared`. (~30min)

## 2. Biblioteca de local e título

- [x] 2.1 Criar `backend/src/lib/local.ts` com `normalizeLocal`, `resolveLocal` e `buildTicketTitulo`, conforme design D3 e D4. (~2h)
- [x] 2.2 `prisma/seed.ts`: preencher `local` nos chamados semeados com valores variados por Unidade, para exercitar as sugestões e a normalização. (~1h)

## 3. Criação de chamado (backend)

- [x] 3.1 `routes/tickets.ts`: no parse do multipart, ler `local` em vez de `titulo`; aplicar `resolveLocal` e derivar o título com `buildTicketTitulo` nos **dois** caminhos de criação (com e sem anexo). (~2h)
- [x] 3.2 `routes/tickets.ts`: incluir `local` no payload de histórico da `ABERTURA` (no lugar de `titulo`). (~30min)
- [x] 3.3 `routes/tickets.ts`: `GET /api/tickets/locais` com escopo por Unidade e `unidadeId` opcional para Admin (design D5). **Registrar antes de `/api/tickets/:id`.** (~1h30)
- [x] 3.4 `routes/tickets.ts`: acrescentar `descricao` e `local` ao `OR` da busca textual (design D6). (~30min)
- [x] 3.5 `routes/tickets.ts`: incluir `local` no retorno da listagem e do detalhe. (~30min)

## 4. Formulário de abertura (frontend)

- [x] 4.1 `api/tickets.ts`: `CreateTicketInput` perde `titulo` e ganha `local`; ajustar o `FormData`; acrescentar `local` à interface `Ticket` e a função que consulta `/api/tickets/locais`. (~45min)
- [x] 4.2 `pages/AbrirChamado.tsx`: remover o campo Título (estado, contador, validação e marcação). (~45min)
- [x] 4.3 `pages/AbrirChamado.tsx`: campo "Onde está o problema?" com `<input list>` + `<datalist>` alimentado por `/api/tickets/locais`, placeholder "Ex.: Recepção, Sala de Medicação", contador e mensagem de validação. (~2h)

## 5. Exibição do local

- [x] 5.1 `pages/Chamados.tsx`: a coluna "Título" passa a ser "Local" e exibe `local`, com um traço quando ausente (design D2). (~1h)
- [x] 5.2 `components/TicketCard.tsx`: o card exibe o local no lugar do título, mantendo a linha de meta com Tipo de Ocorrência e Tipo de Problema. (~45min)
- [x] 5.3 `pages/DetalhesChamado.tsx`: manter o `titulo` composto no cabeçalho e exibir o local como campo próprio junto aos demais dados do chamado. (~1h)
- [x] 5.4 `backend/src/routes/reports.ts`: trocar a coluna "Título" por "Local" na lista de chamados do PDF, ajustando `PdfTicketRow`, o `select` e a largura das colunas. (~1h30)

## 6. Documentação

- [x] 6.1 `docs/manual/`: atualizar a abertura de chamado — o título não é mais pedido, o local é obrigatório, as sugestões vêm dos chamados da própria Unidade e é possível digitar um local novo. (~1h30)
- [x] 6.2 `CLAUDE.md`: acrescentar `GET /api/tickets/locais` à tabela de rotas de `tickets.ts` e registrar a derivação do título. (~30min)

## 7. Verificação

Sem suíte automatizada; verificação manual contra o banco semeado.

> **Estado desta seção.** O Docker Desktop não estava disponível na máquina em que a change foi
> aplicada, então não houve banco para exercitar os itens 7.1 a 7.11 ponta a ponta. O que foi
> verificado sem banco: `tsc` limpo em `shared`, `backend` e `frontend`; `mkdocs build --strict`
> sem erros; `buildTicketTitulo` e `normalizeLocal` exercitados por script avulso — composição
> normal, colapso de espaços, corte do local preservando o Tipo de Problema inteiro e teto de 100
> caracteres respeitado inclusive quando o tipo sozinho estoura; soma das larguras das colunas do
> PDF conferida em 495 (a área útil do A4 com margem 50). Os itens abaixo seguem pendentes de
> execução contra o banco semeado.

- [ ] 7.1 Abrir um chamado sem preencher o local: o envio é bloqueado com mensagem de campo obrigatório. (~15min)
- [ ] 7.2 Abrir um chamado com local novo: o chamado é criado e o título gravado é "Tipo de Problema — Local". Conferir no Prisma Studio. (~20min)
- [ ] 7.3 Abrir um segundo chamado digitando o mesmo local em caixa diferente (" recepção "): o valor gravado reaproveita a grafia já existente e a lista de sugestões continua com uma única entrada. (~20min)
- [ ] 7.4 Abrir um chamado com Tipo de Problema de nome longo e local longo: o título gravado não passa de 100 caracteres e preserva o tipo inteiro. (~20min)
- [ ] 7.5 Como Solicitante da Unidade Central, confirmar que as sugestões não incluem locais da Unidade Secundária. Repetir como Técnico e Gestor. (~30min)
- [ ] 7.6 Como Admin, `GET /api/tickets/locais` devolve locais de todas as Unidades e aceita `unidadeId` para estreitar. (~20min)
- [ ] 7.7 `GET /api/tickets/locais` responde a lista (e não 400 de "ID inválido"), confirmando a ordem de registro das rotas. (~10min)
- [ ] 7.8 Buscar por uma palavra presente apenas na descrição de um chamado: ele aparece na listagem. Buscar por "Recepção": aparecem todos os chamados daquele local. (~20min)
- [ ] 7.9 Listagem, cards e PDF exibem a coluna "Local" e nenhum deles repete o Tipo de Problema dentro dela. (~30min)
- [ ] 7.10 Chamados anteriores à change exibem um traço na coluna Local e mantêm o título original no cabeçalho dos detalhes. (~15min)
- [ ] 7.11 Gerar o PDF de relatório e conferir o alinhamento das colunas após a troca de largura. (~20min)
- [x] 7.12 `docs/manual/` atualizado e `mkdocs build --strict` sem erros. (~item padrão)
