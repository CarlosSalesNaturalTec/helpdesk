## Why

A documentação atual está fragmentada e é técnica: `docs/` reúne PRD, guia de deploy, setup de bucket e notas históricas, sem manual de uso. Não existe material que um Solicitante, Técnico, Gestor, Diretor ou Administrador possa consultar para operar o sistema, nem um site navegável — e a documentação não é atualizada de forma sistemática a cada feature.

## What Changes

- Criar `docs/manual/` com o manual do sistema em Markdown, organizado por persona (5 perfis) e por funcionalidade (chamados, anexos, notificações, relatórios, dashboard, administração), mais uma seção de arquitetura/operação para quem mantém o sistema.
- Adicionar `mkdocs.yml` na raiz com o tema **Material for MkDocs**, navegação, busca e suporte a português.
- Publicar o site **junto com a aplicação**: o build do MkDocs gera `frontend/dist/manual/`, que sobe no mesmo `gsutil rsync` já existente, ficando acessível em `<url-do-frontend>/manual/`. Sem GitHub Pages, sem bucket adicional.
- Adicionar um link "Manual" na navbar, apontando para o site — como **último** item, depois dos itens administrativos.
- Gerar o site com `use_directory_urls: false`, para que cada página seja um `.html` real. O endpoint direto do bucket (`storage.googleapis.com`) não resolve índice de diretório, então URLs terminadas em `/` retornam `NoSuchKey` — verificado em produção após o primeiro deploy.
- Atualizar o `CLAUDE.md` com a política de documentação: toda feature ou alteração de comportamento atualiza `docs/manual/` no mesmo PR, e a **publicação ocorre somente após merge em `main`** — garantido pelo fato de o pipeline do Cloud Build ser disparado apenas por push em `main`.

## Capabilities

### New Capabilities
- `system-documentation`: manual do sistema versionado, publicado como site estático junto à aplicação, com regra de atualização por feature e publicação restrita a `main`.

### Modified Capabilities
- `core-ui`: navbar passa a expor o link para o manual.
- `deploy-gcp`: o pipeline ganha a etapa de build da documentação antes do envio ao bucket.

## Impact

- **Documentação:** nova árvore `docs/manual/`, novo `mkdocs.yml`, novo `requirements-docs.txt`.
- **Infra:** `cloudbuild.yaml` (etapa de build do MkDocs dentro do estágio de frontend); `.gitignore` para o diretório de saída intermediário.
- **Frontend:** `Layout.tsx` (link do manual: destino `/manual/index.html` e posição no fim do nav).
- **Backend / banco de dados:** nenhum impacto.
- **Instruções do agente:** `CLAUDE.md` ganha a seção de política de documentação.

## Non-goals

- Migrar ou reescrever os documentos existentes (`prd_helpdesk.md`, `Deploy_GCP.md`, `gcs-bucket-setup.md`, `historico/`) — o manual referencia; a migração é escopo próprio.
- Publicar no GitHub Pages: a hospedagem junto à aplicação foi confirmada como viável, tornando o Pages desnecessário. Ficará registrado no design como alternativa.
- Documentação de API gerada automaticamente (OpenAPI/Swagger).
- Versionamento do site por release (`mike`) ou tradução para outros idiomas.
- Controle de acesso ao manual — o site é público, como o próprio frontend.
