## 1. Artefatos de Containerização

- [x] 1.1 Criar `Dockerfile` na raiz com build multi-stage (stage 1: compilar shared + backend com TypeScript + prisma generate; stage 2: runtime node:20-alpine com apenas dist/ e node_modules de produção)
- [x] 1.2 Criar `.dockerignore` na raiz excluindo `frontend/`, `docs/`, `.git/`, `node_modules/`, `dist/`, `.env*`, `.vscode/`, `openspec/`

## 2. Configuração de Ambiente

- [x] 2.1 Criar `frontend/src/config.ts` com `export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'`
- [x] 2.2 Substituir URL hardcoded da API no frontend (arquivos em `frontend/src/api/` ou onde usarem axios) pela importação de `config.ts`
- [x] 2.3 Substituir `'*'` hardcoded no CORS do backend (`backend/src/index.ts` linha 14) por `process.env.ALLOWED_ORIGIN || '*'`
- [x] 2.4 Criar `.env.example` na raiz com todas as variáveis documentadas: `DATABASE_URL`, `JWT_SECRET`, `SENDGRID_API_KEY`, `FROM_EMAIL`, `ALLOWED_ORIGIN`, `PORT`, `HOST`, `VITE_API_URL`

## 3. Pipeline CI/CD

- [x] 3.1 Criar `cloudbuild.yaml` na raiz com 4 stages: (1) docker build + push para Artifact Registry, (2) deploy no Cloud Run, (3) npm ci + build do frontend com `VITE_API_URL`, (4) gsutil rsync do frontend para Cloud Storage

## 4. Documentação — README

- [x] 4.1 Criar `docs/Readme.md` com as 13 seções obrigatórias: título/descrição, badges, funcionalidades, stack, arquitetura (diagrama ASCII), personas, estrutura do repositório, pré-requisitos, setup local passo-a-passo, usuários de teste, comandos úteis, workflow de desenvolvimento, licença

## 5. Documentação — Deploy GCP

- [x] 5.1 Criar `docs/Deploy_GCP.md` com as 14 seções obrigatórias: visão geral da arquitetura GCP, pré-requisitos, serviços e custos estimados, e 10 passos numerados do provisionamento à verificação final
- [x] 5.2 Incluir tabela de custos estimados com valores realistas (Cloud SQL, Cloud Run, Cloud Storage, Artifact Registry, Secret Manager) totalizando $25-40/mês para o volume do PRD
- [x] 5.3 Incluir seção de Troubleshooting com pelo menos 5 problemas comuns: conexão Cloud SQL recusada, migration falhando, Cloud Run cold start, CORS bloqueando frontend, Cloud Build sem permissão

## 6. Verificação

- [x] 6.1 Verificar que `docker build -t helpdesk-backend .` completa com sucesso e a imagem tem menos de 300MB
- [x] 6.2 Verificar que `npm run dev` continua funcionando localmente após mudanças de CORS e config.ts
- [x] 6.3 Verificar que `docs/Readme.md` e `docs/Deploy_GCP.md` estão no diretório `docs/` e contêm todas as seções obrigatórias dos specs
