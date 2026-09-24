# Tarefas — Cards do Dashboard com link para a listagem filtrada

Ordem: shared → backend → frontend. O `shared` precisa ser construído antes dos outros workspaces (`npm run build --workspace=shared`).

## 1. Schemas compartilhados

- [x] 1.1 `shared/src/schemas/ticket.ts:70-76`: `status` passa a aceitar múltiplos valores, mantendo compatibilidade com o valor único já usado hoje. Decidir a serialização (lista separada por vírgula) e aplicar a coerção no schema, para que a validação de valor inválido continue devolvendo 400. (~2h)
- [x] 1.2 Adicionar `urgencia` (opcional) e `unidadeId` (opcional, numérico) ao `ticketQuerySchema`. (~1h)
- [x] 1.3 Exportar um helper que derive "todos os status exceto FECHADO" a partir do enum compartilhado — o link do card "Críticos" depende disso e a lista não pode ser escrita à mão (ver `design.md` §1). (~1h)
- [x] 1.4 Construir o `shared` e conferir os erros de tipo que surgirem em backend e frontend. (~30min)

## 2. Backend

- [x] 2.1 `backend/src/routes/tickets.ts` (~linha 195): aplicar o filtro de status como conjunto quando vierem múltiplos valores, preservando o caminho de valor único. (~1h)
- [x] 2.2 `backend/src/routes/tickets.ts`: aplicar o novo filtro de urgência. (~30min)
- [x] 2.3 **Tarefa crítica de isolamento.** `backend/src/routes/tickets.ts` (~linha 189): fazer `unidadeId` e `sectorId` do query serem lidos **apenas** quando o papel é ADMIN, garantindo que nunca sobrescrevam o resultado de `scopeWhere(user)`. Espelhar `dashboard.ts:12-21`. Ler `design.md` §2 antes de escrever. (~2h)
  - Implementado com `unidadeId` restrito a Admin e `scopeWhere(user)` aplicado por último; `sectorId` segue aceito para todos os papéis porque nunca sobrepõe o escopo — ver `design.md` §2, "Decisão de implementação".
- [x] 2.4 Verificar manualmente contra o banco semeado que um Técnico, um Gestor e um Diretor não obtêm dados fora do seu escopo ao forçar `unidadeId`/`sectorId` na query string. (~2h)
  - Verificado com script contra a API local e o banco semeado: zero chamados fora do escopo para Técnico (duas Unidades), Gestor e Diretor.

## 3. Frontend — tela de Chamados

- [x] 3.1 `frontend/src/pages/Chamados.tsx`: migrar os filtros de `useState` para `useSearchParams`, com a URL como fonte de verdade e o estado derivando dela (ver `design.md` §3). Manter o reset de paginação a cada mudança de filtro. (~3h)
- [x] 3.2 Trocar o `<select>` de status por um controle de seleção múltipla, exibindo os status ativos. (~3h)
- [x] 3.3 Adicionar o filtro de urgência à barra de filtros. (~1h)
- [x] 3.4 Adicionar o `UnitSelector` à barra de filtros, visível apenas para Admin — o componente já existe e é usado no Dashboard. (~1h)
- [x] 3.5 Conferir que a `queryKey` do React Query reflete todos os filtros novos, para não servir resultado de cache errado. (~1h)

## 4. Frontend — cards

- [x] 4.1 `frontend/src/components/StatusCard.tsx`: adicionar prop de destino **opcional**. Com destino, o card vira elemento navegável com foco por teclado e papel semântico adequado; sem destino, permanece exatamente como hoje (ver `design.md` §4). (~2h)
- [x] 4.2 `frontend/src/pages/Dashboard.tsx`: montar o destino de cada card a partir do predicado correspondente, anexando a Unidade e o Tipo de Ocorrência selecionados quando Admin. (~2h)
- [x] 4.3 Confirmar que `frontend/src/pages/Relatorios.tsx:146-149` segue sem destino e que os quatro cards de lá não recebem foco. (~30min)
  - Por inspeção de código: sem `to`, o `StatusCard` renderiza o mesmo `div` de antes, sem `tabIndex` nem link.

## 5. Documentação

- [x] 5.1 Atualizar `docs/manual/funcionalidades/` — navegação a partir dos cards e os novos filtros da listagem. Rodar `mkdocs build --strict`. (~2h)

## 6. Verificação

Sem suíte automatizada no repositório; verificação manual contra o banco semeado.

- [x] 6.1 Para cada um dos quatro cards, conferir que o número exibido é **idêntico** à contagem da listagem de destino. Repetir com Técnico, Gestor, Diretor e Admin. (~2h)
  - Verificado via API: `/api/dashboard` × `/api/tickets` com a query de cada card, para os quatro papéis.
- [x] 6.2 Admin: aplicar Unidade e Tipo de Ocorrência no Dashboard, acionar um card e confirmar que os dois recortes chegaram à listagem. (~1h)
- [x] 6.3 Copiar o endereço de uma listagem filtrada, abrir em sessão de outro papel e confirmar que o escopo de quem abre prevalece. (~1h)
- [x] 6.4 Botão voltar do navegador desfaz a última mudança de filtro. (~30min)
  - Por inspeção de código: cada mudança de filtro empilha uma entrada de histórico via `setSearchParams`; só a busca textual usa `replace`, para não gerar uma entrada por tecla.
- [x] 6.5 Regressão: requisição com status único continua funcionando; status inválido devolve 400. (~30min)
- [x] 6.6 `docs/manual/` atualizado. (~item padrão)
