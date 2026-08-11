## Why

O nome "HelpDesk Instituto SETES" está hardcoded em 14 pontos do código (`frontend/index.html`, `Layout.tsx`, `Login.tsx`, `Relatorios.tsx`, as 8 assinaturas de e-mail em `backend/src/services/email.ts` e o cabeçalho/nome de arquivo do PDF em `backend/src/routes/reports.ts`). Atender um novo cliente hoje exige editar código-fonte e abrir um PR só para trocar texto.

Além disso, o produto passa a ter identidade própria: a **aplicação** se chama **SOLUTUS** e o **cliente** atual é o **Instituto Setes** — dois conceitos distintos que hoje estão fundidos numa única string.

## What Changes

- Separar os conceitos em duas variáveis de configuração: `APP_NAME` (padrão `SOLUTUS`) e `CLIENT_NAME` (padrão `Instituto Setes`).
- Criar um módulo de branding em cada lado (`backend/src/lib/branding.ts`, extensão de `frontend/src/config.ts`) como fonte única de verdade, com fallback para os padrões acima.
- Substituir todas as ocorrências hardcoded pelas referências ao módulo — incluindo o `<title>` (via substituição de env no HTML do Vite), o `nav-brand`, o cabeçalho do Login, a assinatura dos 8 templates de e-mail, o título do relatório PDF e o nome dos arquivos baixados.
- Expor `_APP_NAME` / `_CLIENT_NAME` como substitutions no `cloudbuild.yaml` (Cloud Run env vars + build do frontend) e documentar ambas no `.env.example`.

## Capabilities

### New Capabilities
- Nenhuma.

### Modified Capabilities
- `core-ui`: identidade do sistema passa a ser configurável; o requisito de título fixo "HelpDesk Instituto SETES" é substituído pela composição `APP_NAME` + `CLIENT_NAME`.
- `email-notifications`: assinatura dos e-mails passa a usar o nome configurado.
- `reports-pdf`: cabeçalho e nome do arquivo do PDF passam a usar o nome configurado.

## Impact

- **Frontend:** `index.html`, `config.ts`, `Layout.tsx`, `Login.tsx`, `Relatorios.tsx`.
- **Backend:** novo `lib/branding.ts`, `services/email.ts`, `routes/reports.ts`.
- **Infra:** `cloudbuild.yaml` (substitutions e env vars), `.env.example`.
- **Banco de dados:** nenhum impacto — sem migração.
- **Compatibilidade:** os padrões embutidos garantem que uma implantação sem as novas variáveis continue funcionando, exibindo "SOLUTUS" / "Instituto Setes".

## Non-goals

- Configuração em tempo de execução (tabela no banco + tela de Admin). Decidido: configuração em tempo de build/deploy — um cliente novo é um deploy novo.
- Multi-tenancy: uma instância continua servindo um único cliente.
- Logomarca e ativos visuais — tratados na change `2026-08-11-logomarca-solutus`.
- Traduzir ou internacionalizar a interface (a copy permanece em pt-BR).
- Renomear identificadores de código, tabelas, rotas de API ou o nome dos pacotes npm (`@helpdesk/*`).
