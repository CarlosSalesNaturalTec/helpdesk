## Why

O cliente passa a ser identificado como **ISETS**. A expressão composta `SOLUTUS — Instituto Setes` deve sair da tela de login e das páginas internas, dando lugar a `ISETS` sozinho.

A arquitetura já foi feita para isso — `APP_NAME`/`CLIENT_NAME` são substituições de deploy (`cloudbuild.yaml:21-22`) e o `.env.example:15` documenta que o sistema exibe "just APP_NAME when CLIENT_NAME is empty". **Só que esse modo nunca funcionou.** Os três pontos que compõem o nome usam `||`, que trata string vazia como ausente e cai de volta no default:

- `backend/src/lib/branding.ts:2`
- `frontend/src/config.ts:4`
- `frontend/vite.config.ts:8`

Com `_CLIENT_NAME: ""` o sistema exibiria `ISETS — Instituto Setes`. Além disso `frontend/index.html:9` tem o travessão literal no template (`ISETS — ` órfão) e `Layout.tsx:68` renderiza um `<span>` que ficaria vazio na navbar.

Há também uma defasagem de spec: `core-ui` ainda exige o nome fixo "HelpDesk Instituto SETES". O change `2026-08-11-branding-configuravel-solutus` declarou que substituiria esse requisito, mas foi arquivado sem pasta `specs/` — o spec-base ficou duas marcas atrás do código.

## What Changes

- Tratar `CLIENT_NAME`/`VITE_CLIENT_NAME` vazios como intencionais nos três pontos de leitura, em vez de cair no default.
- `index.html`: compor o `<title>` sem travessão órfão quando o cliente é vazio (a substituição passa a ser de um token só).
- `Layout.tsx`: não renderizar o `<span>` do cliente quando vazio.
- `cloudbuild.yaml`: `_APP_NAME: ISETS`, `_CLIENT_NAME: ""`.
- `core-ui`: substituir o requisito de nome fixo pela composição configurável, encerrando a defasagem.

O PDF (`reports.ts:47`, `brandingSlug()`), os e-mails (`email.ts`, 8 ocorrências) e o `site_name` do manual leem o mesmo `fullName`/`APP_NAME` e passam a exibir `ISETS` sem alteração própria.

**Consequência aceita:** a string `SOLUTUS` deixa de aparecer em qualquer artefato publicado. Ela permanece como nome do produto no repositório e no `CLAUDE.md`.

## Capabilities

### Modified Capabilities
- `core-ui`: identidade do sistema deixa de ser o literal "HelpDesk Instituto SETES" e passa a ser a composição configurável, incluindo o caso de cliente vazio.

## Impact

- **Backend:** `lib/branding.ts`.
- **Frontend:** `config.ts`, `vite.config.ts`, `index.html`, `components/Layout.tsx`.
- **Deploy:** substituições `_APP_NAME`/`_CLIENT_NAME` em `cloudbuild.yaml`. Sem migration, sem mudança de API.
- **Herdado sem código:** cabeçalho e nome do arquivo do PDF, assinatura dos e-mails, `site_name` do MkDocs.
- **Docs:** `docs/manual/`, `CLAUDE.md`, `context` do `openspec/config.yaml`.

## Non-goals

- Configuração de marca em runtime ou por tela de administração — segue sendo build/deploy.
- Multi-tenancy: uma instância continua servindo um cliente.
- Trocar logomarca, favicon ou paleta.
- Renomear o produto no código ou no repositório.
- Modo "exibir só o cliente mantendo APP_NAME preenchido" — resolvido pelo config, sem lógica nova de composição.
