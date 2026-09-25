## Why

Com o local do problema passando a ser obrigatório na abertura (`chamado-local-titulo-derivado`), ele vira a informação que orienta o deslocamento do técnico. Um erro de digitação ou uma sala trocada mandam alguém ao lugar errado, e hoje não haveria como corrigir: o campo seria gravado na abertura e nunca mais alterado, exigindo intervenção direta no banco.

Três papéis descobrem o erro em momentos diferentes. O Solicitante percebe logo depois de enviar. O Técnico atribuído descobre ao chegar no lugar — é quem tem a informação certa e quem mais se beneficia de corrigi-la antes que outra pessoa repita o deslocamento. A gestão precisa corrigir grafias ruins que sujam a lista de sugestões da Unidade.

## What Changes

- Novo endpoint `PATCH /api/tickets/:id/local`, que altera a localidade de um chamado e **recompõe o título derivado**, mantendo-o coerente com o novo local.
- Podem corrigir: o Solicitante dono do chamado, o Técnico atribuído a ele, e Gestor, Diretor e Administrador dentro do seu escopo.
- A correção é permitida enquanto o chamado não estiver **Fechado**.
- A localidade corrigida passa pela mesma normalização da abertura, reaproveitando a grafia já registrada na Unidade quando houver coincidência.
- Novo tipo de evento de histórico **`EDICAO`**, registrando autor, data/hora, valor anterior e valor novo. O histórico do chamado passa a apresentar esse evento na linha do tempo.
- Quando houver Técnico atribuído e a correção não partir dele, o Técnico é notificado — em aplicação e por e-mail — de que o local mudou.
- Na tela de detalhes, quem pode corrigir vê uma ação de edição junto ao local, com as mesmas sugestões da Unidade do chamado.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `ticket-management`: correção da localidade do chamado, com escopo, janela de permissão e recomposição do título.
- `ticket-workflow`: novo tipo de evento no histórico do chamado.
- `in-app-notifications`: notificação de correção de local ao Técnico atribuído.
- `email-notifications`: e-mail de correção de local ao Técnico atribuído.

## Non-goals

- Editar qualquer outro campo do chamado (descrição, urgência, Tipo de Problema). O `EDICAO` é introduzido de forma genérica, mas esta change só o emprega para o local.
- Corrigir o local de um chamado Fechado.
- Histórico de todas as localidades já atribuídas ao chamado, além do que a linha do tempo registra.
- Curadoria ou fusão em massa de localidades parecidas de uma Unidade.
- Preencher o local de chamados abertos antes da change anterior.

## Dependências

Depende de `chamado-local-titulo-derivado`: usa a coluna `local`, a normalização e a composição de título definidas lá. Implementar depois dela.

## Impact

- **Backend:** `routes/tickets.ts` (rota nova), `lib/local.ts` (terceiro chamador de `buildTicketTitulo`), `services/notification.ts` e `services/email.ts` (evento novo).
- **Frontend:** `pages/DetalhesChamado.tsx` (ação de edição, novo evento na linha do tempo e seu ícone), `api/tickets.ts`.
- **Shared:** enum de tipos de histórico.
- **Banco:** migration aditiva acrescentando `EDICAO` ao enum `HistoryType`.
- **Docs:** `docs/manual/perfis/solicitante.md`, `tecnico.md`, `gestor-diretor.md`; tabela de rotas do `CLAUDE.md`.
