## Context

O pedido tem três partes: (a) escrever o manual em `docs/manual/`, (b) publicá-lo com MkDocs **junto à própria aplicação** se possível, senão no GitHub Pages, e (c) instituir a regra de atualizar a documentação a cada feature, publicando somente após merge em `main`.

Restrições reais do ambiente atual:

- O frontend é um site estático em bucket do Cloud Storage (`_FRONTEND_BUCKET`), servido por `gsutil rsync`. **Hospedar HTML estático adicional ali é trivial** — logo, (b) se resolve sem GitHub Pages.
- **Armadilha importante:** a etapa `deploy-frontend` do `cloudbuild.yaml` roda `gsutil -m rsync -r -d frontend/dist/ gs://${_FRONTEND_BUCKET}/`. A flag `-d` **apaga tudo no bucket que não esteja em `frontend/dist/`** — um prefixo `manual/` enviado separadamente seria destruído no deploy seguinte.
- Não existe `.github/workflows/`; a automação de CI/CD é inteiramente Cloud Build, disparado por push em `main` — o que já satisfaz (c) por construção.
- MkDocs é Python; o pipeline hoje usa apenas imagens `docker`, `node:20` e `cloud-sdk`.

## Goals / Non-Goals

**Goals:**
- Manual navegável e com busca, cobrindo as 5 personas e o ciclo de vida do chamado.
- Publicação automática e sem passo manual, exclusivamente a partir de `main`.
- Regra de manutenção explícita e verificável no `CLAUDE.md`.

**Non-Goals:**
- Migrar os documentos existentes, gerar documentação de API, versionar releases do site.

## Decisions

- **Build do MkDocs para dentro de `frontend/dist/manual/`.** Definindo `site_dir: frontend/dist/manual` no `mkdocs.yml`, o `rsync -d` existente publica app e manual numa única operação — sem risco de apagar o manual e sem alterar a etapa `deploy-frontend`. Alternativa descartada: enviar o manual num rsync próprio, que exigiria excluir o prefixo do `-d` e é frágil.
- **Ordem no pipeline:** o build do MkDocs roda **depois** do `npm run build --workspace=frontend`, porque o Vite limpa `frontend/dist/` no início do build e apagaria o manual gerado antes.
- **Etapa Python separada.** Nova etapa `build-docs` com imagem `python:3.12-slim`, instalando de `requirements-docs.txt` (`mkdocs`, `mkdocs-material` com versões fixadas). Misturar Python na imagem `node:20` tornaria o estágio de frontend frágil.
- **Falha do build de docs não deve derrubar o deploy da aplicação?** Não: a etapa falha o build normalmente. Um manual desatualizado silenciosamente é pior do que um deploy interrompido com erro visível — e a etapa roda depois do Cloud Run, então a API já estará no ar.
- **Link no frontend como caminho relativo**, não URL absoluta — evita mais uma variável de ambiente e funciona igual em bucket e atrás de load balancer. O destino é `/manual/index.html`, não `/manual/` — ver a decisão sobre `use_directory_urls` abaixo.
- **`use_directory_urls: false` no `mkdocs.yml`** (revisão pós-deploy). O padrão do MkDocs (`true`) gera `perfis/solicitante/index.html` e emite links internos apontando para `perfis/solicitante/`. O endpoint `bucket.storage.googleapis.com` é a XML API: ele serve objetos por chave exata e **não aplica `MainPageSuffix`** — isso só vale no endpoint de website ou atrás de um load balancer. Toda URL terminada em `/` responde `404 NoSuchKey`. Com o flag em `false`, cada página vira um objeto `.html` real e os links internos passam a apontar para chaves existentes, sem depender de infraestrutura.
  - Alternativa descartada (por ora): colocar um load balancer na frente do bucket. É o fix estruturalmente correto — resolveria também os deep links do SPA (`/chamados/{id}`, usados nos e-mails, hoje quebrados) —, mas é trabalho de infra fora do repositório e com custo recorrente. As duas opções não conflitam: `use_directory_urls: false` continua funcionando depois que o LB existir.
  - Alternativa descartada: apenas trocar o href para `/manual/index.html`. A home abriria, mas todo link interno do manual continuaria em 404 — pior que o erro atual, porque aparenta funcionar.
- **`site_url` explícito no `mkdocs.yml`** (achado lateral do deploy, task 7.6). Sem `site_url`, o MkDocs enraíza os links absolutos de `404.html` (CSS, JS, nav) em `/`, e não em `/manual/` — o 404 do manual ficaria sem estilo e com links que escapam do prefixo. `mkdocs.yml` define `site_url: !ENV [SITE_URL, 'http://localhost:8000/manual/']` (default só para uso local), e `build-docs` no `cloudbuild.yaml` passa `SITE_URL="${_FRONTEND_URL}/manual/"` — reaproveitando a substituição `_FRONTEND_URL` já existente (mesma URL que o backend usa para compor os links de e-mail), em vez de fixar o endpoint do bucket como uma segunda fonte de verdade.
  - Hoje é um problema latente, não visível: sem `MainPageSuffix` no endpoint direto do bucket, `manual/404.html` nunca é servido (o endpoint devolve o próprio `NoSuchKey` XML antes de chegar lá). Passa a importar assim que houver load balancer ou endpoint de website na frente do bucket.
- **Posição do link no nav:** último item, depois de Unidades / Tipos de Ocorrência / Tipos de Problema. O manual é referência auxiliar, não área de trabalho; ficar entre Relatórios e Usuários quebrava o agrupamento dos itens administrativos.
- **GitHub Pages descartado, mas documentado.** Exigiria workflow novo, publicaria em domínio distinto do app e duplicaria a superfície de CI. Fica registrado como plano B caso o bucket deixe de ser o meio de entrega do frontend.
- **Política no `CLAUDE.md`:** o manual é atualizado no mesmo PR da feature (fonte em `docs/manual/`), e a publicação só acontece via o trigger de `main`. Isso separa "atualizar a fonte" de "publicar", que é exatamente o que o pedido descreve.

## Risks / Trade-offs

- **[Risco — materializado] Deep links do SPA vs. arquivos estáticos.** A premissa original desta seção estava errada: supunha-se que "`/manual/` funciona porque são arquivos reais com `index.html` por diretório". Ter o objeto não basta — o endpoint do bucket exige a **chave exata**, e `manual/` não é uma chave. O primeiro deploy em `main` confirmou o `NoSuchKey`. Corrigido pela decisão `use_directory_urls: false`.
  - Permanece válido: atrás de um load balancer com fallback de SPA, a regra de reescrita precisa **excluir** o prefixo `/manual/`, senão o app captura as rotas do manual.
  - *Mitigação*: registrar a exceção no `Deploy_GCP.md` junto da configuração do LB (feito, tarefa 4.4).
- **[Trade-off] URLs do manual ficam com `.html` visível** (`/manual/perfis/solicitante.html`). Esteticamente pior e não é o formato canônico do MkDocs. Aceito: é o preço de não depender de load balancer. Se o LB entrar depois, reverter o flag é um commit — mas quebraria links já compartilhados, então a reversão não é automática.
- **[Risco] Cache.** A etapa de deploy aplica `max-age=3600` a `**/*.js` e `**/*.css`, o que passa a alcançar os ativos do tema Material. Aceitável (têm hash), mas os `.html` do manual ficam sem regra explícita.
  - *Mitigação*: adicionar `Cache-Control: no-cache` para `manual/**/*.html`.
- **[Risco] A política de documentação vira letra morta**, já que nada a verifica automaticamente.
  - *Mitigação*: torná-la um item explícito na checklist de tarefas do OpenSpec, além do `CLAUDE.md`.
- **[Risco] O manual descreve a UI em detalhe e envelhece rápido** com as changes de branding e responsividade em curso.
  - *Mitigação*: escrever esta change **por último** entre as quatro, e priorizar fluxo/regra de negócio sobre descrição pixel a pixel.
