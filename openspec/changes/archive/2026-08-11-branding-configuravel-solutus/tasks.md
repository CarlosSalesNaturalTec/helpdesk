## 1. Módulos de configuração de branding

- [x] 1.1 Criar `backend/src/lib/branding.ts` exportando `appName` (`process.env.APP_NAME || 'SOLUTUS'`), `clientName` (`process.env.CLIENT_NAME || 'Instituto Setes'`), `fullName` e um helper `brandingSlug()` para nomes de arquivo.
- [x] 1.2 Estender `frontend/src/config.ts` com `APP_NAME`, `CLIENT_NAME`, `FULL_NAME` e `BRANDING_SLUG` lidos de `import.meta.env` com os mesmos fallbacks.
- [x] 1.3 Declarar os tipos das novas variáveis em `frontend/src/vite-env.d.ts` (criar o arquivo se não existir) para manter o strict mode.

## 2. Substituição no frontend

- [x] 2.1 Trocar o `<title>` de `frontend/index.html` por `%VITE_APP_NAME% — %VITE_CLIENT_NAME%` e conferir que o Vite substitui no build.
- [x] 2.2 Substituir o texto do `.nav-brand` em `Layout.tsx:45` por `APP_NAME` + `CLIENT_NAME`, preservando o `<span>` que recebe o gradiente.
- [x] 2.3 Substituir o título do painel em `Login.tsx:71` por `FULL_NAME`.
- [x] 2.4 Trocar o nome do arquivo em `Relatorios.tsx:60` por `` `relatorio_${BRANDING_SLUG}.pdf` ``.

## 3. Substituição no backend

- [x] 3.1 Substituir as 8 assinaturas `HelpDesk Instituto SETES.` em `services/email.ts` por interpolação de `fullName`.
- [x] 3.2 Substituir o `Content-Disposition` (`reports.ts:24`) e o título do PDF (`reports.ts:32`) pelos valores derivados de `branding.ts`.

## 4. Configuração de ambiente e pipeline

- [x] 4.1 Documentar `APP_NAME`, `CLIENT_NAME`, `VITE_APP_NAME` e `VITE_CLIENT_NAME` no `.env.example`, na seção correspondente, deixando claro que são opcionais e quais são os padrões.
- [x] 4.2 Adicionar as substitutions `_APP_NAME: SOLUTUS` e `_CLIENT_NAME: Instituto Setes` no `cloudbuild.yaml`.
- [x] 4.3 Propagar `APP_NAME`/`CLIENT_NAME` no `--set-env-vars` da etapa `deploy-cloud-run` e `VITE_APP_NAME`/`VITE_CLIENT_NAME` na etapa `build-frontend`.

## 5. Verificação

- [x] 5.1 Rodar `grep -rin "instituto setes\|helpdesk instituto" --include=*.ts --include=*.tsx --include=*.html .` (excluindo `node_modules`) e confirmar que só restam ocorrências em documentação histórica e no `openspec/`.
- [x] 5.2 Buildar os três workspaces (`shared` → `backend` → `frontend`) e validar sem erros de tipo.
- [x] 5.3 Subir a aplicação localmente sem definir as novas variáveis e confirmar o fallback "SOLUTUS — Instituto Setes" na aba do navegador, na navbar e no login.
- [x] 5.4 Subir com `APP_NAME`/`CLIENT_NAME` alterados e confirmar a propagação no PDF de relatório e num e-mail em modo mock (log do `EmailService`).
- [x] 5.5 Atualizar `CLAUDE.md` e `openspec/config.yaml` com o novo nome do sistema e a nota de que o branding é configurável.
