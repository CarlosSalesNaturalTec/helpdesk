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
5. **`deploy-frontend`** — `firebase deploy --only hosting` publica `frontend/dist/` (aplicação **e** manual) no Firebase Hosting.

## Publicação do manual

O manual é publicado **junto com a aplicação**, sem site ou pipeline separados:

- `mkdocs.yml` define `site_dir: frontend/dist/manual`, então o build do MkDocs escreve dentro da mesma árvore que o Vite gera.
- A etapa `build-docs` roda **depois** do `build-frontend` (que limpa `frontend/dist/` no início) e **antes** do `deploy-frontend` — se rodasse antes, o Vite apagaria o manual já gerado.
- O `firebase deploy --only hosting` sobe os dois de uma vez, a partir do `public: "frontend/dist"` declarado em `firebase.json`.
- O manual fica acessível em `<url-do-frontend>/manual/index.html` — e também em `<url-do-frontend>/manual/`, que o Firebase Hosting resolve como índice de diretório.

## Por que `use_directory_urls: false`

O `mkdocs.yml` mantém desligado o padrão do MkDocs, que geraria `perfis/solicitante/index.html` e emitiria links internos apontando para `perfis/solicitante/`. A escolha já não é uma limitação de hospedagem — o Firebase Hosting resolveria esse padrão sem problema — mas sim estabilidade: trocar agora mudaria todas as URLs do manual já publicadas e compartilhadas, sem ganho correspondente.

Com `use_directory_urls: false`, cada página é um `.html` real (`perfis/solicitante.html`), e os links internos apontam para essas chaves.

Consequências práticas ao mexer aqui:

- O link "Manual" na navbar (`frontend/src/components/Layout.tsx`) aponta para `/manual/index.html` por esse mesmo motivo de estabilidade — `/manual/` também funcionaria.
- Reverter o flag quebraria as URLs do manual já compartilhadas.

## Reescritas no `firebase.json`

O `firebase.json` declara duas reescritas, avaliadas em ordem, com precedência sobre arquivos estáticos já servidos diretamente:

```json
"rewrites": [
  { "source": "/manual/**", "destination": "/manual/404.html" },
  { "source": "**",         "destination": "/index.html" }
]
```

A reescrita de `/manual/**` para o 404 do próprio manual **precede** o catch-all do SPA — assim, uma URL inexistente sob `/manual/` cai na página 404 gerada pelo MkDocs, e não na tela da aplicação. Arquivos que realmente existem (`/manual/perfis/tecnico.html`, `/assets/*.js`) são servidos antes de qualquer reescrita ser avaliada.

## Comandos locais

```bash
pip install -r requirements-docs.txt
mkdocs serve          # preview local em http://localhost:8000
mkdocs build --strict # build de validação (falha em link quebrado)
```
