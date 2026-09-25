## Context

- `chamado-local-titulo-derivado` acrescenta `Ticket.local`, a biblioteca `backend/src/lib/local.ts` (`normalizeLocal`, `resolveLocal`, `buildTicketTitulo`) e a rota de sugestões `GET /api/tickets/locais`.
- `HistoryType` tem hoje sete valores: `ABERTURA`, `MENSAGEM`, `MUDANCA_STATUS`, `ATRIBUICAO`, `REATRIBUICAO`, `FECHAMENTO`, `REABERTURA`. Nenhum descreve a edição de um campo.
- `DetalhesChamado.tsx` renderiza a linha do tempo com um `switch` sobre o tipo do evento, mais um `switch` para o ícone.
- `lib/rbac.ts` centraliza o escopo: `unitFilter()` e `sectorFilter()` para checagens de registro único. A convenção do repositório é responder **404** em divergência de escopo, para não revelar a existência do chamado.
- `NotificationService` e `EmailService` são deliberadamente tolerantes a falha: erro é capturado e registrado, nunca propagado à operação do chamado.

## Goals / Non-Goals

**Goals:** corrigir uma localidade errada sem tocar no banco; manter o título coerente com o local; deixar rastro de quem corrigiu; avisar quem está a caminho do lugar errado.

**Non-Goals:** ver `proposal.md`.

## Decisions

### D1. Quem pode corrigir, e por que o código de erro difere

```
ADMIN                                  -> sempre
DIRETOR      Unidade confere           -> sim
GESTOR       Unidade + Setor conferem  -> sim
TECNICO      escopo confere...         -> apenas se for o técnico atribuído
SOLICITANTE                            -> apenas se for o dono do chamado
```

A resposta a uma tentativa negada depende do motivo, e a distinção é deliberada:

| Situação | Resposta | Por quê |
| --- | --- | --- |
| Chamado fora do escopo do usuário | **404** | Convenção do repositório: não revelar que o chamado existe |
| Chamado dentro do escopo, sem direito de editar | **403** | O usuário **já enxerga** esse chamado nas outras rotas; devolver 404 aqui seria incoerente |

O segundo caso é o Técnico do mesmo Setor e Unidade que não é o atribuído. Ele lê o chamado normalmente, então esconder a existência dele numa rota específica seria mentira, não proteção.

Vale registrar explicitamente porque contraria a leitura rápida da regra geral do `CLAUDE.md` ("404 em vez de 403 em divergência de escopo"). A regra continua valendo — para **escopo**. Falta de direito dentro do escopo é outra coisa.

### D2. Janela: até o chamado ser Fechado

A correção é recusada quando o status é `FECHADO`. Chamado fechado é registro histórico; alterar o local depois mudaria o passado sem propósito operacional, e o título recomposto apareceria diferente em relatórios já emitidos.

`RESOLVIDO` e `AGUARDANDO` continuam corrigíveis: o chamado ainda está em curso e pode ser reaberto.

Isso alinha a rota ao requisito já existente de bloqueio de alterações em chamado fechado, que hoje fala de status e mensagens e passa a cobrir também a edição de campos.

### D3. O título é recomposto junto

Esta é a consequência que não salta aos olhos. O título é derivado e **persistido**; se o local muda e o título não acompanha, a listagem, os detalhes e as notificações passam a apontar um lugar que o chamado não tem mais — e o título derivado perde exatamente a razão de existir.

Então `PATCH /:id/local` chama `buildTicketTitulo(problemType.nome, localNovo)` e grava os dois campos na mesma operação. É o terceiro chamador da função — mais uma razão para ela estar isolada em `lib/local.ts` desde a change anterior, em vez de duplicada nos dois caminhos de criação.

Chamados anteriores à existência do campo, cujo título foi digitado por uma pessoa, também têm o título substituído pelo composto ao receberem um local. É o comportamento correto: a partir daí o título passa a ser derivado, como o dos demais.

### D4. Normalização e sugestões vêm da Unidade **do chamado**

A correção usa `resolveLocal` com a Unidade **do chamado**, não a de quem edita. Para o Solicitante e o Técnico são a mesma; para um Administrador corrigindo um chamado de outra Unidade, não são — e a grafia canônica que importa é a da Unidade onde fica a sala.

Pela mesma razão, as sugestões oferecidas na tela de detalhes são as da Unidade do chamado.

### D5. Novo `HistoryType.EDICAO`

O evento registra, no `content`: o campo alterado, o valor anterior e o valor novo.

*Alternativa descartada:* reusar `MENSAGEM`. Custo zero de migração, mas insere um evento de sistema na conversa como se o usuário tivesse escrito algo.

*Alternativa descartada:* não registrar. A correção ficaria invisível — ninguém saberia que a sala mudou nem quem mudou, justo num campo que orienta deslocamento.

O valor é introduzido de forma genérica (campo + antes + depois) e não como `LOCAL_ALTERADO`, para que uma futura edição de outro campo não precise de mais um valor de enum. Esta change só o emprega para o local.

`ALTER TYPE ... ADD VALUE` é aditivo: a revisão anterior nunca produz o valor novo e nunca lê linha que não escreveu, então o rollout é seguro. A consistência exigida pelo `CLAUDE.md` entre o enum do Prisma, o enum Zod do `shared` e o `switch` da linha do tempo precisa ser mantida nas três pontas.

### D6. Notificação ao Técnico atribuído

Disparada quando existe Técnico atribuído e o autor da correção não é ele. Segue o padrão do `NotificationService`: registro em aplicação mais e-mail, ambos tolerantes a falha — uma falha de notificação nunca derruba a correção.

Sem Técnico atribuído, ninguém é notificado: não há quem esteja a caminho.

O Solicitante não é notificado quando a gestão corrige a grafia. Seria ruído: a correção é ortográfica, não muda o lugar.

### D7. Interface

Na tela de detalhes, junto ao local, uma ação de edição visível apenas a quem pode corrigir. Abre um campo com as mesmas sugestões da abertura, alimentadas pela Unidade do chamado. Um 403 ou 409 vindo do servidor é exibido ali mesmo.

A linha do tempo ganha o caso `EDICAO` e seu ícone. Sem isso, o evento novo cairia no ramo padrão do `switch` e apareceria sem rótulo.

## Risks / Trade-offs

- **[O título de um chamado muda depois de emitido um relatório]** → Aceito. D2 limita a janela ao que ainda não está fechado, e a linha do tempo registra a alteração.
- **[Três papéis podem corrigir o mesmo campo]** → Sem bloqueio de concorrência; vence a última gravação. O histórico preserva a sequência, e a chance de duas correções simultâneas no mesmo chamado é remota.
- **[`EDICAO` genérico pode convidar a editar outros campos sem spec]** → O requisito delimita: só o local. Qualquer outro campo exige nova change.
- **[Um Técnico mal-intencionado poderia mascarar um atendimento ruim trocando o local]** → O histórico registra autor, valor anterior e valor novo. O rastro é auditável.

## Migration Plan

Uma migration aditiva acrescentando `EDICAO` ao enum `HistoryType`. Sem alteração destrutiva e compatível com a revisão anterior durante o rollout.

Aplicar **depois** de `chamado-local-titulo-derivado`, que cria a coluna e a biblioteca usadas aqui.

## Open Questions

Nenhuma.
