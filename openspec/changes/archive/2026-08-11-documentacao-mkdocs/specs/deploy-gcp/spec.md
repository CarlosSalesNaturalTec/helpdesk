## MODIFIED Requirements

### Requirement: cloudbuild.yaml com pipeline CI/CD
O projeto DEVE conter um arquivo `cloudbuild.yaml` na raiz que defina uma pipeline CI/CD no Google Cloud Build com trigger automático no push para a branch `main`, executando 5 stages sequenciais: build e push da imagem Docker, deploy no Cloud Run, build do frontend, build do manual do usuário (MkDocs), e upload do frontend (aplicação e manual juntos) para Cloud Storage.

#### Scenario: Push na main dispara pipeline
- **WHEN** um commit é pushado para a branch `main`
- **THEN** o Cloud Build executa a pipeline definida em `cloudbuild.yaml`, builda a imagem Docker, faz push para Artifact Registry, implanta no Cloud Run, builda o frontend com `VITE_API_URL` apontando para a URL do Cloud Run, builda o manual do usuário com MkDocs dentro de `frontend/dist/manual/`, e faz upload dos arquivos estáticos (aplicação e manual) para o bucket Cloud Storage

#### Scenario: Pipeline falha em stage intermediário
- **WHEN** o build do Docker falha no Stage 1
- **THEN** os stages subsequentes não são executados, e o Cloud Build reporta falha com o log do stage que quebrou

#### Scenario: Build do manual falha
- **WHEN** `mkdocs build --strict` falha (ex.: link interno quebrado no Markdown fonte)
- **THEN** a etapa `build-docs` falha e a pipeline é interrompida antes de `deploy-frontend` — o backend já está no ar (deployado em um estágio anterior), mas nem a aplicação nem o manual são atualizados no bucket, evitando publicar um manual desatualizado silenciosamente

## ADDED Requirements

### Requirement: Etapa `build-docs` gera o manual do usuário com MkDocs
A pipeline DEVE incluir uma etapa `build-docs`, executada com uma imagem Python (`python:3.12-slim`), que instala as dependências de `requirements-docs.txt` e roda `mkdocs build --strict`. Essa etapa DEVE rodar depois da etapa que builda o frontend com Vite (que limpa `frontend/dist/` no início do seu build) e antes da etapa que faz upload ao bucket, para que o manual sobreviva no mesmo diretório de saída publicado.

#### Scenario: Ordem das etapas no pipeline
- **WHEN** a pipeline executa `build-frontend`, depois `build-docs`, depois `deploy-frontend`
- **THEN** `frontend/dist/` contém tanto os artefatos do Vite quanto `frontend/dist/manual/` no momento em que `deploy-frontend` roda o `gsutil rsync`

### Requirement: `SITE_URL` do MkDocs aponta para o prefixo publicado do manual
A etapa `build-docs` DEVE passar a variável `SITE_URL` para o `mkdocs build`, composta a partir da URL do frontend (`_FRONTEND_URL`) mais o prefixo `/manual/`, para que páginas geradas fora da navegação normal (como `404.html`) referenciem corretamente esse prefixo em vez da raiz do bucket.

#### Scenario: Build de produção
- **WHEN** a etapa `build-docs` roda com `SITE_URL="${_FRONTEND_URL}/manual/"`
- **THEN** os links absolutos gerados pelo tema (CSS, JS, navegação em `404.html`) apontam para `/manual/...`, não para `/...`

#### Scenario: Build local sem `SITE_URL`
- **WHEN** um desenvolvedor roda `mkdocs build` ou `mkdocs serve` localmente, sem definir `SITE_URL`
- **THEN** o build usa o valor default (`http://localhost:8000/manual/`) e continua funcionando, sem exigir a variável de ambiente para desenvolvimento local
