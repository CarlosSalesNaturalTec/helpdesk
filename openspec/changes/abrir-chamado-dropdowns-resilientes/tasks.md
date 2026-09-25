## 1. Estado de erro nos seletores

- [x] 1.1 `AbrirChamado.tsx`: expor `isError` e `refetch` nas três queries (`sectors`, `problemTypes`, `niveisUrgencia`). (~30min)
- [x] 1.2 `AbrirChamado.tsx`: renderizar mensagem de erro e botão "Tentar novamente" no lugar do seletor quando a respectiva query falhar, conforme design D1. (~1h30)
- [x] 1.3 `AbrirChamado.tsx`: desabilitar "Enviar Chamado" enquanto qualquer conjunto de referência estiver ausente, com texto explicando o motivo. (~30min)

## 2. Resiliência de rede

- [x] 2.1 `App.tsx`: defaults do QueryClient com `retry: 3` e `retryDelay` exponencial com teto; mutações sem repetição automática (design D2). (~30min)

## 3. Chaves de cache

- [x] 3.1 `SectorSelector.tsx` passa a usar `['sectors','all']`; `AbrirChamado.tsx` e `Chamados.tsx` passam a `['sectors','ativos']` (design D4). (~30min)

## 4. Infraestrutura

- [x] 4.1 `cloudbuild.yaml`: acrescentar `--cpu-boost` ao passo `gcloud run deploy`. (~15min)
- [x] 4.2 Atualizar a seção de Deployment do `CLAUDE.md` e `docs/Deploy_GCP.md` com a flag. (~30min)

## 5. Documentação

- [x] 5.1 `docs/manual/`: nota orientando o Solicitante a usar "Tentar novamente" se os seletores não carregarem. Rodar `mkdocs build --strict`. (~45min)

## 6. Verificação

Sem suíte automatizada; verificação manual.

- [ ] 6.1 Com o backend parado, abrir `/abrir-chamado`: os três seletores exibem erro e botão "Tentar novamente"; "Enviar Chamado" fica desabilitado. (~20min)
- [ ] 6.2 Subir o backend e acionar "Tentar novamente": as listas carregam sem recarregar a página e o envio é liberado. (~15min)
- [ ] 6.3 Com o backend no ar, confirmar que o fluxo normal de abertura não mudou. (~15min)
- [ ] 6.4 No DevTools, simular resposta lenta e confirmar que a repetição com backoff acontece antes da mensagem de erro. (~20min)
- [ ] 6.5 Como Gestor, navegar entre a listagem (filtro de Tipo de Ocorrência) e outras telas confirmando que o filtro mostra todos os tipos, inclusive inativos, e que nenhuma tela passou a mostrar a lista errada. (~20min)
- [ ] 6.6 Após o deploy, medir o tempo da primeira requisição depois de período ocioso e registrar no PR, para comparação futura. (~20min)
- [x] 6.7 `docs/manual/` atualizado e `mkdocs build --strict` sem erros. (~item padrão)
