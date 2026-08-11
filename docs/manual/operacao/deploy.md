# Deploy

O deploy é feito inteiramente via **Google Cloud Platform**, com CI/CD automatizado pelo **Cloud Build**, disparado a cada push na branch `main`.

Para o passo a passo completo de provisionamento (criação de projeto, APIs, Cloud SQL, Cloud Run, buckets, secrets), veja os guias no repositório (fora deste manual):

- `docs/Deploy_GCP.md` — guia detalhado de deploy no GCP.
- `docs/gcs-bucket-setup.md` — configuração do bucket de anexos de chamados.

Este documento cobre apenas a visão de alto nível do pipeline e como este manual é publicado.

## Pipeline (`cloudbuild.yaml`)

1. **`docker-build` / `docker-push`** — build da imagem do backend e envio ao Artifact Registry.
2. **`deploy-cloud-run`** — deploy do backend no Cloud Run (aplica migrações do Prisma automaticamente no start do container).
3. **`build-frontend`** — build do `shared` e do frontend (Vite), gerando `frontend/dist/`.
4. **`build-docs`** — build deste manual com MkDocs, para dentro de `frontend/dist/manual/`.
5. **`deploy-frontend`** — `gsutil rsync` de `frontend/dist/` (aplicação **e** manual) para o bucket do frontend.

## Publicação do manual

O manual é publicado **junto com a aplicação**, sem bucket ou pipeline separados:

- `mkdocs.yml` define `site_dir: frontend/dist/manual`, então o build do MkDocs escreve dentro da mesma árvore que o Vite gera.
- A etapa `build-docs` roda **depois** do `build-frontend` (que limpa `frontend/dist/` no início) e **antes** do `deploy-frontend` — se rodasse antes, o Vite apagaria o manual já gerado.
- O `gsutil rsync -d` existente sobe os dois de uma vez; não há necessidade de excluir `manual/` desse rsync.
- O manual fica acessível em `<url-do-frontend>/manual/`.

## Atenção: proxy reverso / load balancer

O endpoint direto do bucket serve arquivos estáticos reais (cada página do manual tem seu próprio `index.html`), então `/manual/` funciona sem configuração adicional. **Se o frontend for colocado atrás de um load balancer com fallback de SPA** (reescrevendo qualquer rota para `index.html` da aplicação), a regra de reescrita precisa **excluir o prefixo `/manual/`** — senão a aplicação captura as rotas do manual antes de chegarem aos arquivos estáticos gerados pelo MkDocs. Veja a nota correspondente em `docs/Deploy_GCP.md`.

## Comandos locais

```bash
pip install -r requirements-docs.txt
mkdocs serve          # preview local em http://localhost:8000
mkdocs build --strict # build de validação (falha em link quebrado)
```
