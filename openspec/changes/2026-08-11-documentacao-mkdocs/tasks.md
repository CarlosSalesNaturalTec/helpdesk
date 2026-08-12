## 1. Estrutura do MkDocs

- [x] 1.1 Criar `requirements-docs.txt` com `mkdocs` e `mkdocs-material` em versões fixadas.
- [x] 1.2 Criar `mkdocs.yml` na raiz com `docs_dir: docs/manual`, `site_dir: frontend/dist/manual`, tema Material, `language: pt-BR`, busca e navegação declarada.
- [x] 1.3 Adicionar `frontend/dist/` ao `.gitignore` se ainda não estiver coberto, e validar `mkdocs build --strict` localmente.
- [x] 1.4 Definir `site_name` a partir do nome da aplicação (SOLUTUS) e incluir a logomarca no tema.

## 2. Conteúdo — visão geral e personas

- [x] 2.1 `index.md`: o que é o sistema, glossário (Unidade, Tipo de Ocorrência, Tipo de Problema, SLA) e como acessar.
- [x] 2.2 `perfis/solicitante.md`: abrir chamado, acompanhar, responder mensagens, fechar com avaliação, reabrir.
- [x] 2.3 `perfis/tecnico.md`: fila de chamados, assumir, colocar em aguardando, resolver — incluindo o escopo por Unidade e Tipo de Ocorrência.
- [x] 2.4 `perfis/gestor-diretor.md`: reatribuição, fechamento administrativo, gestão de usuários da unidade, relatórios.
- [x] 2.5 `perfis/administrador.md`: gestão global de Unidades, Tipos de Ocorrência, Tipos de Problema e usuários.

## 3. Conteúdo — funcionalidades e operação

- [x] 3.1 `funcionalidades/ciclo-de-vida.md`: diagrama do fluxo de estados e o que cada transição exige.
- [x] 3.2 `funcionalidades/anexos.md`: formatos aceitos (JPG, PNG, PDF, DOCX), limite de 5 MB, substituição e remoção.
- [x] 3.3 `funcionalidades/notificacoes.md`: eventos que geram notificação in-app e e-mail.
- [x] 3.4 `funcionalidades/relatorios-dashboard.md`: métricas, filtros de período e exportação em PDF.
- [x] 3.5 `operacao/arquitetura.md` e `operacao/deploy.md`: visão da arquitetura e ponteiros para `docs/Deploy_GCP.md` e `docs/gcs-bucket-setup.md` (referenciar, não duplicar).
- [x] 3.6 `operacao/acesso-e-seguranca.md`: perfis, isolamento por Unidade, troca de senha obrigatória, bloqueio por tentativas.

## 4. Publicação no pipeline

- [x] 4.1 Adicionar a etapa `build-docs` (`python:3.12-slim`) ao `cloudbuild.yaml`, com `waitFor: ['build-frontend']` e antes de `deploy-frontend`.
- [x] 4.2 Ajustar `deploy-frontend` para depender de `build-docs` e adicionar `Cache-Control: no-cache` para `manual/**/*.html`.
- [x] 4.3 Confirmar em um build de teste que `frontend/dist/manual/` sobrevive ao `rsync -d` e que o manual abre em `<url-do-frontend>/manual/`. **Primeira execução (pré-#10):**
  - ✅ O `rsync -d` preserva o manual — os objetos `manual/**` estão no bucket.
  - ❌ O manual **não abria**: `404 NoSuchKey` em `/manual/` e em todo link interno. Só resolviam chaves exatas.
  - Causa raiz e correção na seção 7 (PR #10, merge `e174bbf`).
  - **Revalidado após o deploy do PR #10** (ver 7.5): fechada.
- [x] 4.4 Registrar em `docs/Deploy_GCP.md` que a regra de reescrita de SPA do load balancer deve excluir o prefixo `/manual/`.

## 5. Link na aplicação e política de manutenção

- [x] 5.1 Adicionar o link "Manual" (`/manual/`, `target="_blank"`) na navbar do `Layout.tsx`, visível a todos os perfis.
- [x] 5.2 Adicionar ao `CLAUDE.md` a seção "Documentação": toda feature ou mudança de comportamento atualiza `docs/manual/` no mesmo PR; a publicação ocorre exclusivamente pelo trigger de `main`; nunca publicar manualmente a partir de branch.
- [x] 5.3 Registrar em `CLAUDE.md` os comandos `pip install -r requirements-docs.txt`, `mkdocs serve` e `mkdocs build --strict`.
- [x] 5.4 Incluir "atualizar `docs/manual/`" como item padrão na seção de verificação das próximas changes do OpenSpec.

## 6. Verificação

- [x] 6.1 Rodar `mkdocs build --strict` e confirmar zero links quebrados.
- [x] 6.2 Revisar o manual em um smartphone (o tema Material é responsivo) e conferir a busca em português. Verificado com Chromium em viewport de 390px (iPhone) e busca por "chamados" retornando resultados com stemming ("chamado").
- [x] 6.3 Confirmar, após merge em `main`, que o site publicado reflete o conteúdo do commit. Confirmado após o merge do PR #10 (`e174bbf`): a chave nova do layout `use_directory_urls: false` (`/manual/perfis/solicitante.html`) está no ar em 200, e a chave antiga do layout anterior (`/manual/perfis/solicitante/index.html`) responde 404 — prova de que o `rsync -d` do deploy mais recente substituiu o conteúdo publicado.

## 7. Correção pós-deploy — URLs do manual e ordem no nav

Achados do primeiro deploy em `main` (ver 4.3). Duas falhas independentes.

- [x] 7.1 Definir `use_directory_urls: false` no `mkdocs.yml` e rodar `mkdocs build --strict`, conferindo que a saída passa a ter `frontend/dist/manual/perfis/solicitante.html` (e não `.../solicitante/index.html`), e que os links internos gerados apontam para os arquivos `.html`. Verificado: 13 páginas `.html` no layout novo; varredura das 329 referências internas das páginas servidas acusou **0 links quebrados e 0 URLs de diretório**.
- [x] 7.2 Alterar o link do manual em `frontend/src/components/Layout.tsx`: destino `/manual/index.html` (não `/manual/`) e **mover para o fim** da lista de itens do nav, depois do bloco `showUnidades` (Unidades / Tipos de Ocorrência / Tipos de Problema).
- [x] 7.3 Documentar em `docs/manual/operacao/deploy.md` por que `use_directory_urls: false` existe — a XML API do Cloud Storage não aplica `MainPageSuffix`, então URLs de diretório retornam `NoSuchKey`. Sem essa nota, o flag parece preferência estética e será removido. A mesma correção foi aplicada a `docs/Deploy_GCP.md`, que repetia a premissa errada de que "`/manual/` funciona sem configuração adicional".
- [x] 7.4 Conferir se a etapa `deploy-frontend` do `cloudbuild.yaml` ainda casa os arquivos do manual no `setmeta` de `manual/**/*.html` depois da mudança de layout dos arquivos. **Bug encontrado e corrigido:** no gsutil, `**/*.html` exige a barra seguinte e portanto **nunca casou `manual/index.html`** — a home do manual vinha sem a regra de cache desde o primeiro deploy. Glob trocado por `manual/**.html`, que alcança raiz e subdiretórios. **Decisão mantida:** `no-cache` (status quo da tarefa 4.2); passar para `max-age=3600` continua em aberto.
- [x] 7.5 Após o deploy, revalidar 4.3: `/manual/index.html` abre e a navegação interna do manual (perfis, funcionalidades, operação) e a busca funcionam sem 404. **Confirmado em produção pós-merge do PR #10:**
  - `/manual/index.html` → 200, `Cache-Control: no-cache`.
  - `/manual/perfis/solicitante.html` (chave do layout novo) → 200, `no-cache`.
  - `/manual/perfis/solicitante/index.html` (chave do layout antigo) → 404 — confirma que o deploy substituiu o conteúdo anterior.
  - `/manual/` (URL de diretório) → 404, como esperado: essa URL nunca é usada pela aplicação (o link e os links internos do manual usam `.html` explícito); o 404 aqui não é o bug original, é a limitação de endpoint que a mudança contorna evitando essa forma de URL.

- [x] 7.6 (achado lateral, não bloqueante) `manual/404.html` era gerado pelo MkDocs com caminhos absolutos a partir da raiz do site (`/perfis/solicitante.html`), que resolviam para a raiz do bucket e não para `/manual/`. **Corrigido:** `mkdocs.yml` ganhou `site_url: !ENV [SITE_URL, 'http://localhost:8000/manual/']`, e a etapa `build-docs` do `cloudbuild.yaml` passa `SITE_URL="${_FRONTEND_URL}/manual/"` (reaproveitando a substituição já usada pelo backend para os links de e-mail, em vez de hardcodar o bucket). Verificado: `404.html` reconstruído com essa `SITE_URL` passou a referenciar `/manual/assets/...` e `/manual/perfis/...`; a varredura das 329 referências internas das páginas servidas continua em 0 quebradas, 0 URLs de diretório — sem regressão.

### Fora do escopo desta correção

Colocar um load balancer na frente do bucket, que resolveria `/manual/` e também os deep links do SPA (`/chamados/{id}` dos e-mails, hoje em 404). É infra fora do repositório, com custo recorrente, e merece change própria. As duas soluções coexistem.
