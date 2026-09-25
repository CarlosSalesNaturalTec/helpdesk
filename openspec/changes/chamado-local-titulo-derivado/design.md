## Context

- `createTicketSchema` (`shared/src/schemas/ticket.ts`) exige `titulo` com 5 a 100 caracteres.
- `Ticket.titulo` é `VarChar(100) NOT NULL` no Prisma. O campo é lido em cinco superfícies: listagem, `TicketCard`, cabeçalho dos detalhes, coluna do PDF de relatório e nove mensagens de notificação/e-mail.
- `routes/tickets.ts` cria o chamado em **dois** caminhos distintos — com anexo (o ticket nasce antes do upload, para compor o path no GCS) e sem anexo.
- A busca textual da listagem hoje alcança `titulo`, `solicitante.nome` e `unidade.nome`.
- A listagem já possui colunas próprias de "Tipo de Ocorrência" e "Tipo de Problema"; o `TicketCard` exibe `sector / problemType` numa linha de meta.

## Goals / Non-Goals

**Goals:** abertura com menos atrito e mais informação útil; o técnico sabe aonde ir sem ler a descrição; a lista de locais se mantém limpa sozinha; nenhuma migração destrutiva.

**Non-Goals:** ver `proposal.md`.

## Decisions

### D1. `local` obrigatório no schema, anulável no banco

`local` entra em `createTicketSchema` como obrigatório (2 a 60 caracteres, após normalização). A coluna é `VARCHAR(100) NULL`.

A assimetria é deliberada e tem duas razões:

1. Os chamados já existentes não têm local e não serão preenchidos retroativamente.
2. Durante o rollout do Cloud Run, a revisão anterior continua atendendo e insere sem `local`. Uma coluna `NOT NULL` derrubaria essas inserções. Como a migração roda no start do container, a janela é real.

O teto da coluna (100) é maior que o teto do schema (60) para dar folga a um eventual relaxamento sem nova migração.

### D2. O título composto não vai para a listagem, para os cards nem para o PDF

Esta é a decisão menos óbvia da change, e ela **corrige uma premissa da exploração**.

O título derivado é `Tipo de Problema — Local`. Colocá-lo na coluna "Título" da listagem produziria:

```
Nº    Título                            Tipo de Ocorrência  Tipo de Problema
123   Impressora travada — Recepção     Tecnologia          Impressora travada
                        ^^^^^^^^^^^^^                       ^^^^^^^^^^^^^^^^^^
                                               duplicado na mesma linha
```

A change arquivada `separate-type-columns-my-tickets` removeu exatamente essa concatenação a pedido do cliente, e a spec `ticket-management` registra: *"o título do chamado é exibido sozinho na sua respectiva coluna, sem conter o tipo de ocorrência ou problema concatenado"*. Reintroduzi-la seria uma regressão contra um pedido explícito.

Resolução, por superfície:

| Superfície | Exibe | Por quê |
| --- | --- | --- |
| Listagem, `TicketCard`, PDF | `local`, sob o rótulo **"Local"** | já há colunas de tipo ao lado; o local é a informação que falta |
| Cabeçalho dos detalhes | `titulo` composto | é um título de página, não disputa com coluna nenhuma |
| Notificações e e-mails | `titulo` composto | texto corrido sem colunas; "Impressora travada — Recepção" informa muito mais que "Recepção" |
| Busca textual | `local`, `descricao`, `titulo` | o composto ajuda, mas não é a fonte |

*Alternativa descartada:* título composto em todas as superfícies. Mais simples de implementar, mas regride o pedido do cliente.

*Alternativa descartada:* título igual apenas ao local. Empobrece notificações e e-mails, onde a composição é justamente o que orienta quem lê.

> Nota para o `archive`: a spec `ticket-management` tem hoje três requisitos com o título "Coluna dedicada de anexo na listagem de chamados", um deles descrevendo as colunas da listagem. Esta change adiciona um requisito de nome próprio e não tenta modificar o requisito ambíguo; a duplicação na spec base merece limpeza em separado.

### D3. Composição e truncagem do título

Uma função única em `backend/src/lib/local.ts`:

```
buildTicketTitulo(problemTypeNome, local) -> string (no máximo 100)
  base = "<problemTypeNome> — <local>"
  se base couber em 100     -> base
  senão                     -> encurtar o LOCAL, preservando o tipo de
                               problema inteiro, marcando o corte
  se o tipo sozinho estourar-> truncar o conjunto em 100 com marca de corte
```

Preservar o tipo e cortar o local, porque o tipo é vocabulário controlado (curto e previsível) e o local é texto livre. Nem `ProblemType.nome` nem `Sector.nome` têm teto no schema, então a truncagem é obrigatória e não apenas defensiva.

A função é chamada dos **dois** caminhos de criação. Duplicar a fórmula entre eles é exatamente como ela desanda depois — e a change `chamado-corrigir-local` acrescenta um terceiro chamador.

### D4. Normalização do local

Também em `lib/local.ts`:

```
normalizeLocal(valor)        -> apara as pontas e colapsa espaços internos
resolveLocal(valor, unidade) -> se houver local existente na Unidade que case
                                sem diferenciar maiúsculas/minúsculas,
                                devolve a grafia já registrada;
                                senão, devolve o valor novo normalizado
```

`resolveLocal` roda no servidor, na criação. "recepção" digitado numa Unidade onde já existe "Recepção" é gravado como "Recepção", e a lista de sugestões não ganha uma entrada quase idêntica.

O que isto **não** resolve: "Recepcao" sem cedilha, ou "Sala Medicação" contra "Sala de Medicação". Só curadoria resolveria, e curadoria foi descartada junto com a tabela de locais.

### D5. `GET /api/tickets/locais`

Devolve as localidades distintas, não nulas, ordenadas.

- Solicitante, Técnico, Gestor e Diretor: restrito à própria Unidade.
- Admin: todas as Unidades, com `unidadeId` opcional para estreitar — o mesmo padrão já adotado em `dashboard.ts` e `reports.ts`.

O escopo por Unidade não é conveniência: nomes de salas de uma Unidade não devem vazar para outra.

Atenção: a rota precisa ser registrada **antes** de `/api/tickets/:id`, senão o Fastify casa `:id = "locais"`. Mesma armadilha já documentada para `niveis-urgencia`.

Na base sem histórico a lista volta vazia. O `<datalist>` degrada para um campo de texto comum, e o placeholder conduz: "Ex.: Recepção, Sala de Medicação".

### D6. Busca textual ganha `descricao` e `local`

O `OR` da busca passa a incluir `descricao` e `local`. Sem `descricao`, a busca ficaria **pior** que hoje para quem procura por uma palavra do problema, já que o título deixa de ser escrito por gente. Com `local`, buscar "Recepção" passa a trazer todos os chamados da recepção, mesmo aqueles cujo título composto truncou o local.

### D7. Interface do campo

`<input list="locais">` com `<datalist>`, nativo. Aceita valor fora da lista, que é o requisito.

*Alternativa descartada:* combobox próprio. Visualmente mais coerente com os `<select>` vizinhos, mas é um componente novo para um ganho estético.

## Risks / Trade-offs

- **[O `<datalist>` tem aparência diferente dos `<select>` vizinhos]** → Aceito. O campo precisa aceitar valor novo, e um combobox próprio não se paga aqui.
- **[Texto livre degrada com o tempo]** → D4 cobre os casos de espaçamento e caixa, que são a maioria. Variação ortográfica real permanece possível e foi aceita ao descartar a tabela de locais.
- **[O título deixa de ser escrito por pessoas]** → É o objetivo. D6 compensa no que importa: a busca.
- **[Chamados antigos ficam sem local]** → Listagem e PDF exibem um traço na coluna Local. O título antigo, digitado, continua no cabeçalho dos detalhes e nas notificações.
- **[O Solicitante pode errar o local e mandar o técnico ao lugar errado]** → Fora do alcance desta change; a correção é a `chamado-corrigir-local`.

## Migration Plan

Uma migration aditiva: acrescentar a coluna `local` como `VARCHAR(100)` anulável em `Ticket`. Sem backfill, sem `NOT NULL`, sem alteração destrutiva — segura com a revisão anterior ainda no ar.

Independe da change `abrir-chamado-dropdowns-resilientes`; as duas tocam `AbrirChamado.tsx` e é mais confortável aplicar aquela primeiro, para não resolver conflito no mesmo arquivo.

## Open Questions

Nenhuma.
