# Design

## Context

Ver `proposal.md` — Why. Três fatos do código vigente moldam a abordagem:

1. **O status já existe.** `TicketStatus.AGUARDANDO` está no enum do Prisma, no `TicketStatusEnum` do `shared`, nas chaves de `ALLOWED_TRANSITIONS`, em dois literais SQL (`dashboard.ts:41`, `reports.ts:196`) e na coluna `Notification.type` — que é `String`, com linhas já gravadas em produção.
2. **Os rótulos não vêm de um mapa.** As etiquetas imprimem `{ticket.status.replace('_', ' ')}` em `TicketCard.tsx:59`, `Chamados.tsx:316` e `DetalhesChamado.tsx:464`; a linha do tempo imprime `content.from`/`content.to` crus em `DetalhesChamado.tsx:338`. Existem dois mapas `STATUS_LABELS` duplicados (`Chamados.tsx:14`, `reports.ts:56`) e nenhum deles alcança as etiquetas.
3. **A razão não tem onde morar.** `mensagem` e `solucao` existem apenas dentro de `TicketHistory.content` (JSON). Não há coluna equivalente no `Ticket`.

O precedente de renomeação é `Sector` → "Tipo de Ocorrência" (change `2026-07-03-rename-sector-and-system`): trocou-se a camada de texto e preservaram-se modelo, rotas e identificadores.

## Goals / Non-Goals

**Goals:**
- Renomear sem migrar enum, sem reescrever dados e sem invalidar notificações já gravadas.
- Fazer da definição de rótulos um ponto único, de modo que esta renomeação — e a próxima — seja uma edição só.
- Tornar a razão de pendência consultável e filtrável, não apenas auditável.

**Non-Goals:**
- Reaproveitar `lib/local.ts` para as razões. As duas normalizações são análogas, não idênticas: `resolveLocal()` resolve por `unidadeId` e participa da composição do título; a razão resolve por `sectorId` e não compõe nada. Serão módulos irmãos, não um genérico parametrizado.
- Rótulos de urgência. O mesmo problema existe em `URGENCIA_LABELS`, mas está fora do escopo desta entrega.

## Decisions

### D1 — Renomear na camada de texto, preservando identificadores

O enum permanece `AGUARDANDO` em todas as camadas de código.

*Por quê, e não um valor novo `PENDENTE`:* um valor novo exigiria migração do enum, `UPDATE` em chamados existentes, revisão dos dois literais SQL (um deles invisível ao TypeScript, em `dashboard.ts:41` — um status esquecido ali desaparece silenciosamente do cartão "Em Andamento") e reescrita de `Notification.type`, que orfanaria os ícones do `NotificationBell`. Nada disso compra comportamento: o estado é o mesmo, só o nome muda. O precedente `Sector` já fixou esta linha no projeto.

*Alternativa descartada:* dois status coexistindo ("Aguardando" + "Pendente"). Produziria dois botões indistinguíveis no painel do Técnico e dois baldes quase idênticos no dashboard e nos relatórios.

### D2 — `STATUS_LABELS` em `@helpdesk/shared`, ao lado de `TicketStatusEnum`

Um `Record<TicketStatusType, string>` exportado do `shared`, consumido pelas três etiquetas, pela linha do tempo, pelo filtro da listagem e pelo PDF.

*Por quê:* sem isso a renomeação simplesmente não aparece — as etiquetas continuariam imprimindo `AGUARDANDO`. E o lugar está indicado pelo próprio código: o comentário em `shared/src/schemas/ticket.ts:13`, sobre `STATUS_NAO_FECHADOS`, já estabelece que listas derivadas do enum não se escrevem à mão.

*Alternativa descartada:* corrigir cada etiqueta no lugar. Mantém a duplicação que causou o problema e deixa a próxima renomeação igualmente cara.

*Decisão subsidiária:* as três funções `getStatusBadgeClass` idênticas também migram para o `shared` como um mapa de classes. É a mesma duplicação, no mesmo arquivo, e separá-las deixaria metade do trabalho feito.

### D3 — Coluna `Ticket.pendenciaMotivo String?`, limpa na retomada

*Por quê a coluna:* ela responde "por que está parado agora" — é o que o cabeçalho do chamado exibe, e o que permitirá a coluna "Pendência" na listagem e o filtro por razão.

*Por quê limpar na retomada:* mantê-la exibiria razão obsoleta em chamado ativo. O `TicketHistory` segue como trilha — é dele que o TMA já reconstrói os intervalos (`reports.ts:196`), de modo que nada de auditoria se perde.

*Custo aceito:* "quantas vezes paramos por falta de material?" continua sendo consulta ao histórico. Uma tabela `PendencyReason` resolveria isso e permitiria curadoria administrativa, mas o pedido era digitação livre; as razões gravadas servirão de semente quando essa tabela existir.

**Correção durante a implementação.** A redação original desta decisão dizia que a coluna seria também a fonte do `<datalist>`, por `SELECT DISTINCT` indexado, e descartava o histórico por ser varredura de JSON. As duas metades da decisão não podiam valer juntas: zerar a coluna na retomada apaga a grafia do vocabulário, de modo que uma razão desaparecia das sugestões assim que seu chamado voltava a andar — e `resolvePendenciaMotivo()` não tinha mais como reaproveitá-la, gravando uma variação quase idêntica na pendência seguinte. Dois cenários do delta `ticket-workflow` reprovavam na verificação ("Razão nova é aceita", que exige que a razão passe a constar das sugestões *nas próximas pendências*, e "Grafia existente é reaproveitada").

Era a própria justificativa de D4 virada contra o desenho: um vocabulário que evapora faz cada Técnico redigitar as mesmas razões desde zero. A resolução separa os dois papéis — a coluna continua sendo o estado corrente (e segue zerada na retomada), e o **vocabulário vem da trilha durável**: ver D4.

### D4 — Escopo das razões por `sectorId`, vocabulário lido do histórico

`GET /api/tickets/razoes-pendencia` deriva o escopo do papel como `GET /api/tickets/locais`, mas **não** lê a mesma espécie de fonte: as razões vêm dos eventos `MUDANCA_STATUS` com destino `AGUARDANDO` do `TicketHistory`, não da coluna.

*Por quê a assimetria com `/locais`:* `Ticket.local` nunca é apagado, então para ele a coluna é fonte suficiente. `Ticket.pendenciaMotivo` é zerada na retomada (D3), e uma lista construída sobre ela ofereceria apenas as razões dos chamados pendentes *naquele instante* — um Tipo de Ocorrência sem pendências abertas não sugeriria nada. O join até `Ticket` existe justamente para aplicar o escopo (e portanto o isolamento entre Unidades) sobre os eventos. `backend/src/lib/pendencia.ts` concentra as duas operações que dependem desse vocabulário — listar e resolver a grafia —, de modo que a fonte é escolhida num lugar só.

*Por quê por Tipo de Ocorrência, e não por Unidade:* "Aguardando material" é vocabulário genérico, e por Unidade cada uma redigitaria as mesmas razões desde zero. O eixo acompanha `ProblemType`, que já é filho de `Sector`.

*Por quê não global:* texto livre em escopo global é vetor de vazamento — uma razão como "peça para a sala do Dr. Silva" viraria sugestão permanente em toda a rede. O isolamento entre Unidades é restrição permanente do projeto.

*Implicação de rota:* registrar **antes** de `/api/tickets/:id`, senão o Fastify casa `:id = "razoes-pendencia"`. Mesma armadilha já documentada para `niveis-urgencia` e `locais`.

### D5 — Remover a auto-retomada sem perder o aviso

Remove-se o bloco de transição automática em `tickets.ts:1204-1222`. `notifyMessageInAguardando` permanece intacta.

*Por quê é seguro:* o Técnico já recebe notificação in-app e e-mail quando o Solicitante responde. O sinal não muda; muda quem decide se o chamado está desbloqueado. Em troca, o TMA deixa de ser reiniciado por conversa.

*Ajuste de texto necessário:* `email.ts:131` afirma que "O status do chamado foi atualizado automaticamente para Em Andamento". Deixar essa frase seria prometer algo que não mais acontece.

## Risks / Trade-offs

- **Técnicos acostumados à retomada automática podem ver chamados parados em Pendente.** → O e-mail passa a dizer explicitamente que a retomada depende do Técnico; o manual é atualizado na mesma entrega; o botão "▶ Retomar Atendimento" já existe no painel e não muda de lugar.
- **O rebranding `ISETES` passa a depender da migração.** Numa entrega só, o contêiner roda `prisma migrate deploy` no start e uma migração que falha bloqueia o deploy inteiro — inclusive a troca de uma linha no `cloudbuild.yaml`. → A migração é aditiva e nullable (`ALTER TABLE ... ADD COLUMN "pendenciaMotivo" TEXT`), sem backfill nem constraint; é a forma mais segura de migração neste schema.
- **`STATUS_LABELS` é mudança transversal em arquivo central.** Um status sem entrada no mapa quebra o build. → É exatamente o efeito desejado: `Record<TicketStatusType, string>` torna a omissão um erro de tipo, não uma etiqueta vazia em produção.
- **Chamados já em pendência terão `pendenciaMotivo` nulo** até a próxima transição. → A razão histórica continua na linha do tempo; a interface trata nulo como ausência de razão, como já faz com `Ticket.local` em chamados anteriores ao campo.
- **Risco de over-reach na consolidação.** Mover rótulos e classes de badge toca arquivos que a renomeação não exigiria. → Limitado a status; `URGENCIA_LABELS` fica declaradamente de fora.

## Migration Plan

1. Migração aditiva da coluna (nullable, sem backfill).
2. `shared` primeiro — `backend` e `frontend` importam de `dist/`.
3. Endpoint e gravação da razão antes de trocar o modal, para que o `<datalist>` tenha de onde ler.
4. Texto, manual e `cloudbuild.yaml` por último: o rebranding é a mudança mais visível e não deve subir antes do resto estar correto.

**Rollback:** reverter o deploy. A coluna nullable pode permanecer sem efeito — a versão anterior a ignora, e nenhum dado é perdido. A remoção da auto-retomada não deixa estado inconsistente: chamados em pendência seguem válidos em ambas as versões.
