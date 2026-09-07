## Why

O frontend é servido em `https://helpdesk-frontend-helpdesk-499614.storage.googleapis.com`, que é a **XML API** do Cloud Storage. Ela resolve apenas chaves de objeto exatas e **ignora `MainPageSuffix` / `NotFoundPage`** — a configuração `--web-error-page=index.html` feita no Passo 8 do guia de deploy não tem efeito nesse endpoint. Verificado em produção:

```
GET /login       → 404 NoSuchKey: No such object: .../login
GET /index.html  → 200
GET /            → 200 <ListBucketResult>   (listagem do bucket, não o app)
```

Consequências hoje:

- **Nenhuma rota do SPA é carregável por URL.** `/login` salvo como favorito falha sempre; F5 em qualquer tela falha; os deep links dos e-mails (`${FRONTEND_URL}/chamados/{id}`) falham — limitação já registrada no guia como aceita.
- **Segundo caminho para o mesmo 404:** o interceptor de 401 (`frontend/src/api/client.ts:30`) faz `window.location.href = '/login'`, uma navegação real do navegador. Quando o JWT de 15 min expira, o `GET /api/auth/me` volta 401 depois do cold start do Cloud Run e o usuário cai no `NoSuchKey` — o sintoma "dá erro depois de ~5 segundos".

Sem domínio próprio, o Load Balancer HTTPS está fora (certificado gerenciado exige domínio). O Firebase Hosting resolve com domínio `*.web.app` gratuito, HTTPS, CDN e reescrita de SPA nativa.

## What Changes

- Publicar o frontend no **Firebase Hosting** (`https://helpdesk-499614.web.app`), substituindo o estágio `gsutil rsync` por `firebase deploy` no `cloudbuild.yaml`. O manual MkDocs continua no mesmo `frontend/dist/manual/` e vai junto, sem pipeline separado.
- `firebase.json` com reescrita `**` → `/index.html`, precedida de `/manual/**` → `/manual/404.html` para preservar o 404 próprio do manual.
- **`vite.config.ts`: `base: './'` → `base: '/'`.** Obrigatório: com base relativa, `/chamados/123` resolveria os assets em `/chamados/assets/…` e serviria uma tela branca — o fallback funcionaria em `/login` e quebraria exatamente no deep link que motivou a mudança.
- Trocar `window.location.href` do interceptor por redirecionamento client-side via evento + `logout()` no `AuthContext`.
- `Cache-Control` dos assets versionados por hash: `max-age=3600` → `max-age=31536000, immutable`; HTML segue `no-cache`.
- Atualizar `ALLOWED_ORIGIN` e `_FRONTEND_URL` para a nova origem; aposentar o bucket do frontend.

## Capabilities

### Modified Capabilities
- `deploy-gcp`: hospedagem do frontend, reescrita de rotas, base de assets, CORS e estágio de publicação.
- `system-documentation`: o manual passa a ser publicado pelo Firebase Hosting.
- `auth`: expiração de sessão redireciona sem recarregar a página.

## Impact

`cloudbuild.yaml`, `firebase.json` (novo), `.firebaserc` (novo), `frontend/vite.config.ts`, `frontend/src/api/client.ts`, `frontend/src/context/AuthContext.tsx`, `frontend/src/components/Layout.tsx` (comentário obsoleto), `.env.example`, `CLAUDE.md`, `docs/Deploy_GCP.md`, `docs/manual/operacao/{deploy,arquitetura}.md`.

Infra: habilitar Firebase no projeto, ativar `firebasehosting.googleapis.com`, conceder `roles/firebasehosting.admin` à service account do Cloud Build.

**Nenhuma mudança de backend, schema, API ou regra de negócio.**

## Non-goals

- Domínio próprio. A change entrega `*.web.app`; adicionar domínio depois é aditivo e não muda o código.
- Migrar o bucket de **anexos** — permanece no Cloud Storage, e está correto (não permite listagem anônima).
- Reverter `use_directory_urls: false` do MkDocs. No Firebase ambos funcionam; mudar agora trocaria todas as URLs do manual sem ganho.
- Corrigir a mensagem genérica "Falha ao autenticar. Verifique sua conexão." e o JWT preso em `mustChangePassword` — bugs reais e separados, fora deste escopo.
- Renomear "Usuário" para "Colaborador".
- Servir o frontend pelo Cloud Run ou adotar HashRouter — alternativas avaliadas e descartadas (ver `design.md`).
