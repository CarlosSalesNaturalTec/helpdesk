## Why

Dois atritos na abertura de chamado, apontados pelo cliente:

- **"Título do Chamado" não agrega.** O Solicitante já informa Tipo de Ocorrência, Tipo de Problema, urgência e descrição. O título vira redundante ou inútil ("ajuda", "URGENTE!!!") e é mais um campo obrigatório entre o problema e o registro.
- **Falta "onde".** Não existe campo para a localização física do problema (Recepção, Sala de Medicação). Hoje isso só aparece, quando aparece, no meio da descrição — e o técnico precisa lê-la inteira para saber aonde ir.

## What Changes

- O campo **Título do Chamado** sai do formulário e do schema compartilhado de criação.
- Entra o campo **"Onde está o problema?"**, obrigatório, texto livre de 2 a 60 caracteres, com sugestões dos locais já usados na Unidade do Solicitante (`<datalist>`) e liberdade para digitar um local novo.
- O local é **normalizado na escrita**: espaços são aparados e colapsados, e um valor que coincida com um local já existente na Unidade (ignorando maiúsculas/minúsculas) reaproveita a grafia já registrada. Isso impede que "Recepção", "recepção" e "Recepção " virem três sugestões distintas.
- O `titulo` passa a ser **derivado e gravado pelo servidor** na criação, como `Tipo de Problema — Local`, respeitando o limite de 100 caracteres. Ele permanece no cabeçalho dos detalhes, nas notificações e nos e-mails, onde não há colunas que o disputem.
- Na listagem, nos cards e no PDF — que já exibem Tipo de Ocorrência e Tipo de Problema em colunas próprias — a coluna "Título" dá lugar a **"Local"**. Ver a decisão D2 do `design.md`: exibir ali o título composto reintroduziria a concatenação que a change `separate-type-columns-my-tickets` removeu a pedido do cliente.
- A busca textual passa a alcançar também **descrição** e **local**, compensando o fim do título digitado.
- Novo endpoint `GET /api/tickets/locais`, com as localidades distintas do escopo do usuário.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `ticket-creation`: campos obrigatórios da abertura; título derivado; campo de local com sugestões e normalização.
- `ticket-query`: campos alcançados pela busca textual; retorno do local.
- `ticket-management`: coluna "Local" no lugar de "Título" na listagem e nos cards.
- `reports-pdf`: coluna "Local" no lugar de "Título" na lista de chamados do relatório.

## Non-goals

- Cadastro administrativo de locais (tabela própria, CRUD, curadoria). Decidido: texto livre com sugestões.
- Filtrar a listagem ou segmentar relatórios por local.
- Corrigir o local depois da abertura — ver a change `chamado-corrigir-local`, que depende desta.
- Preencher o local dos chamados já existentes.
- Remover a coluna `titulo` do banco.

## Impact

- **Shared:** `schemas/ticket.ts` — `titulo` sai de `createTicketSchema`, `local` entra.
- **Backend:** `routes/tickets.ts` (criação nos dois caminhos, rota `/locais` antes de `/:id`, busca textual), novo `lib/local.ts` (normalização e composição do título).
- **Frontend:** `pages/AbrirChamado.tsx`, `pages/Chamados.tsx`, `components/TicketCard.tsx`, `pages/DetalhesChamado.tsx`, `api/tickets.ts`.
- **Banco:** migration `ADD COLUMN local VARCHAR(100) NULL` — aditiva e compatível com a revisão anterior durante o rollout.
- **Docs:** `docs/manual/` (abertura de chamado), `CLAUDE.md` (tabela de rotas).
