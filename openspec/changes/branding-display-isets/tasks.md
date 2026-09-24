# Tarefas — Identidade exibida como ISETS

Ordem: corrigir a leitura de configuração antes de trocar os valores de deploy. Trocar `cloudbuild.yaml` primeiro exibiria `ISETS — Instituto Setes` em produção.

## 1. Leitura da configuração

- [ ] 1.1 `backend/src/lib/branding.ts:2`: distinguir "não definido" de "definido como vazio" na leitura de `CLIENT_NAME`, preservando o default apenas para a variável ausente. O ternário de `fullName` (linha 3) já trata cliente vazio corretamente e não muda. (~1h)
- [ ] 1.2 `frontend/src/config.ts:4`: mesma correção para `VITE_CLIENT_NAME`. Atenção: no Vite, uma variável não definida chega como `undefined` e uma definida como vazia chega como `''` — a distinção é possível. (~1h)
- [ ] 1.3 `frontend/vite.config.ts:8`: mesma correção na origem das substituições do `index.html`. (~30min)

## 2. Pontos de renderização

- [ ] 2.1 `frontend/index.html:9`: o `<title>` hoje interpola dois tokens com um travessão literal entre eles. Passar a interpolar um único token com o nome já composto, calculado em `vite.config.ts`, para não deixar travessão órfão quando o cliente é vazio. (~1h)
- [ ] 2.2 `frontend/src/components/Layout.tsx:68`: omitir o `<span>` do cliente quando `CLIENT_NAME` for vazio, evitando elemento vazio e espaçamento residual na navbar. (~1h)
- [ ] 2.3 Conferir `frontend/src/pages/Login.tsx:78` — já usa `FULL_NAME` e não precisa de alteração; validar visualmente após 1.2. (~15min)

## 3. Configuração de deploy

- [ ] 3.1 `cloudbuild.yaml:21-22`: `_APP_NAME: ISETS` e `_CLIENT_NAME: ""`. Conferir que a sintaxe `^@^APP_NAME=...@CLIENT_NAME=` da linha 80 propaga a string vazia até o Cloud Run sem descartar a variável. (~1h)
- [ ] 3.2 `.env.example`: atualizar os comentários das linhas 12-18 e 82-84 para documentar explicitamente que a string vazia é um valor válido. (~30min)

## 4. Documentação

- [ ] 4.1 Atualizar `docs/manual/` onde a marca aparece em texto ou captura de tela. Rodar `mkdocs build --strict`. (~2h)
- [ ] 4.2 Atualizar as menções em `CLAUDE.md` (seções Project Overview e Branding) e no `context` de `openspec/config.yaml`, que abre com "System name: SOLUTUS — Instituto Setes". (~30min)

## 5. Verificação

Sem suíte automatizada no repositório; verificação manual.

- [ ] 5.1 Build local com `VITE_APP_NAME=ISETS VITE_CLIENT_NAME=""`: conferir título da aba, navbar e tela de login exibindo "ISETS" sem travessão nem espaço sobrando. (~1h)
- [ ] 5.2 Backend local com `APP_NAME=ISETS CLIENT_NAME=""`: gerar um PDF de relatório e conferir cabeçalho "Relatório ISETS" e arquivo `relatorio_isets.pdf`. (~30min)
- [ ] 5.3 Conferir a assinatura de um e-mail em modo mock (sem `SENDGRID_API_KEY`, a mensagem é logada). (~30min)
- [ ] 5.4 Regressão: build sem definir as variáveis deve continuar exibindo "SOLUTUS — Instituto Setes". (~30min)
- [ ] 5.5 `docs/manual/` atualizado. (~item padrão)
