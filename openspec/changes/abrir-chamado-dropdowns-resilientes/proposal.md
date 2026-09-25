## Why

Solicitantes relatam que, ao abrir a tela "Abrir Novo Chamado", os seletores **Tipo de Ocorrência** e **Tipo de Problema** aparecem vazios de forma intermitente. Sem opções, o formulário fica inutilizável e o usuário não recebe nenhuma explicação.

A causa imediata é que `AbrirChamado.tsx` consome apenas `data` e `isLoading` das três queries de referência (`sectors`, `problemTypes`, `niveisUrgencia`). Quando a requisição falha, `isLoading` volta a `false` e `data` fica `undefined`: o `<select>` é renderizado **habilitado e vazio**, sem mensagem de erro. A falha é silenciosa, o que também impede diagnosticar a causa raiz — o cliente não conseguiu capturar o console nem a aba de rede.

A causa provável por trás da falha é o cold start do Cloud Run: o serviço roda com `--min-instances=0` e o container executa `npx prisma migrate deploy` no `CMD`, de modo que **toda instância nova** paga a migração antes de atender a primeira requisição. Com `retry: 1` no QueryClient, duas tentativas próximas esgotam a chance de sucesso durante a subida.

## What Changes

- Os três seletores de "Abrir Novo Chamado" passam a tratar o estado de erro: mensagem explicativa no lugar da lista vazia e botão **"Tentar novamente"** que refaz a busca. O botão de envio fica bloqueado enquanto os dados de referência não carregarem.
- Política global de repetição do React Query passa de `retry: 1` para 3 tentativas com _backoff_ exponencial, absorvendo a janela de subida do Cloud Run.
- `cloudbuild.yaml` passa a implantar o Cloud Run com `--cpu-boost`, que acelera o cold start sem custo adicional de instância ociosa.
- Correção de raspão: a `queryKey` `['sectors']` é usada por três componentes com `queryFn` diferentes (`SectorSelector` devolve todos os Tipos de Ocorrência; `AbrirChamado` e `Chamados` filtram por `ativo`). Passam a usar chaves distintas por recorte.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `ticket-creation`: comportamento dos seletores quando os dados de referência falham ao carregar.
- `core-ui`: política de repetição das queries e unicidade da chave de cache por recorte de dados.
- `deploy-gcp`: `--cpu-boost` no deploy do Cloud Run.

## Non-goals

- Mudar `--min-instances` para 1 ou mais. Tem custo mensal contínuo; só se o sintoma persistir depois desta change.
- Tirar `prisma migrate deploy` do `CMD` do container e movê-lo para a pipeline. Resolveria a causa raiz do cold start lento, mas altera a arquitetura de deploy hoje documentada e deve ser decidido com a evidência que esta change passa a produzir.
- Cache persistente ou pré-carregamento dos dados de referência.
- `timeout` no Axios. Durante um cold start, esperar é o comportamento desejado.
- Qualquer alteração nos campos do formulário — ver `chamado-local-titulo-derivado`.

## Impact

- **Frontend:** `pages/AbrirChamado.tsx` (estados de erro e nova tentativa), `App.tsx` (defaults do QueryClient), `components/SectorSelector.tsx` e `pages/Chamados.tsx` (chaves de cache).
- **Backend:** nenhum.
- **Banco:** nenhuma migration.
- **Infra:** `cloudbuild.yaml`, passo `run deploy`.
- **Docs:** `docs/manual/funcionalidades/` — nota sobre o que fazer se os seletores não carregarem.
