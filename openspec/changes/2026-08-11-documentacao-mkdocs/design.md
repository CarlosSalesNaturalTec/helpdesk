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
- **Link no frontend como caminho relativo (`/manual/`)**, não URL absoluta — evita mais uma variável de ambiente e funciona igual em bucket e atrás de load balancer.
- **GitHub Pages descartado, mas documentado.** Exigiria workflow novo, publicaria em domínio distinto do app e duplicaria a superfície de CI. Fica registrado como plano B caso o bucket deixe de ser o meio de entrega do frontend.
- **Política no `CLAUDE.md`:** o manual é atualizado no mesmo PR da feature (fonte em `docs/manual/`), e a publicação só acontece via o trigger de `main`. Isso separa "atualizar a fonte" de "publicar", que é exatamente o que o pedido descreve.

## Risks / Trade-offs

- **[Risco] Deep links do SPA vs. arquivos estáticos.** O endpoint direto do bucket não reescreve rotas; `/manual/` funciona porque são arquivos reais com `index.html` por diretório, mas atrás de um load balancer com fallback de SPA a regra de reescrita precisa **excluir** o prefixo `/manual/`, senão o app captura as rotas do manual.
  - *Mitigação*: registrar a exceção no `Deploy_GCP.md` junto da configuração do LB.
- **[Risco] Cache.** A etapa de deploy aplica `max-age=3600` a `**/*.js` e `**/*.css`, o que passa a alcançar os ativos do tema Material. Aceitável (têm hash), mas os `.html` do manual ficam sem regra explícita.
  - *Mitigação*: adicionar `Cache-Control: no-cache` para `manual/**/*.html`.
- **[Risco] A política de documentação vira letra morta**, já que nada a verifica automaticamente.
  - *Mitigação*: torná-la um item explícito na checklist de tarefas do OpenSpec, além do `CLAUDE.md`.
- **[Risco] O manual descreve a UI em detalhe e envelhece rápido** com as changes de branding e responsividade em curso.
  - *Mitigação*: escrever esta change **por último** entre as quatro, e priorizar fluxo/regra de negócio sobre descrição pixel a pixel.
