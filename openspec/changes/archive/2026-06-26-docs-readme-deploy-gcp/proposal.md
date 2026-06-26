## Why

O projeto HelpDesk está com o MVP implementado (5 specs concluídas) mas carece de dois artefatos essenciais para entrada em produção e onboarding de novos desenvolvedores: documentação do projeto voltada a humanos (README) e um guia completo de deploy no Google Cloud Platform. Além disso, os artefatos fundamentais de containerização (Dockerfile) e configuração de ambiente (.env.example, CORS parametrizável) não existem no código, bloqueando qualquer tentativa de deploy. Este change resolve essas lacunas de uma vez, preparando o projeto tanto para divulgação quanto para operação em produção.

## What Changes

- Criar `docs/Readme.md` — documentação do projeto com visão do produto, stack, arquitetura, setup local, estrutura do repositório e fluxo de desenvolvimento
- Criar `docs/Deploy_GCP.md` — guia passo-a-passo de deploy no GCP usando Cloud SQL, Cloud Run, Cloud Storage, Artifact Registry, Secret Manager e Cloud Build com trigger automático no push
- Criar `Dockerfile` na raiz do backend — build multi-stage (build com TypeScript + runtime enxuto com Node.js) otimizado para Cloud Run
- Criar `.env.example` na raiz do repositório — template documentado de todas as variáveis de ambiente necessárias (backend, banco, frontend, e-mail)
- Parametrizar CORS no backend — substituir `*` hardcoded por `ALLOWED_ORIGIN` lido de variável de ambiente, com fallback seguro para desenvolvimento
- Parametrizar URL da API no frontend — adicionar suporte a `VITE_API_URL` no vite.config.ts para build de produção apontar para o backend remoto
- Criar `cloudbuild.yaml` — pipeline CI/CD com stages de build, push da imagem Docker para Artifact Registry e deploy no Cloud Run

## Capabilities

### New Capabilities

- `project-readme`: Documentação do projeto para onboarding de desenvolvedores e stakeholders — visão do produto, stack tecnológica, arquitetura em alto nível, pré-requisitos, setup local passo-a-passo, estrutura do monorepo, usuários de teste padrão e fluxo de desenvolvimento
- `deploy-gcp`: Infraestrutura e procedimento completo de deploy no Google Cloud Platform — containerização do backend, configuração de ambiente para produção, pipeline CI/CD com Cloud Build, deploy serverless no Cloud Run, banco gerenciado Cloud SQL PostgreSQL 15, frontend estático no Cloud Storage, secrets no Secret Manager, sem dependência de domínio customizado (usa URLs nativas do GCP)

### Modified Capabilities

Nenhuma capability existente tem seus requisitos alterados — as mudanças são puramente de infraestrutura e documentação. O comportamento do sistema em runtime não muda.

## Non-goals

- Configurar domínio customizado ou SSL gerenciado (usa URLs nativas do Cloud Run e Cloud Storage)
- Criar conta GCP ou provisionar recursos reais (o guia documenta os comandos; a execução é manual)
- Migrar banco de dados existente (assume banco novo populado via `prisma db seed`)
- Implementar monitoramento avançado (Cloud Monitoring básico incluso, sem alertas configurados)
- Suporte a múltiplos ambientes (staging, homologação) — foco em produção única
- Docker Compose para produção (apenas ambiente local usa docker-compose)

## Impact

- **Backend**: `backend/Dockerfile` (novo), `backend/src/index.ts` (CORS parametrizável — mudança de 2 linhas), `backend/.env.example` referenciado do raiz
- **Frontend**: `frontend/vite.config.ts` (adição de proxy/API URL configurável — mudança de ~5 linhas)
- **Raiz do repositório**: `.env.example` (novo), `cloudbuild.yaml` (novo)
- **Documentação**: `docs/Readme.md` (novo), `docs/Deploy_GCP.md` (novo)
- **Dependências**: Nenhuma nova dependência de código — Docker, gcloud CLI e Cloud Build são ferramentas externas
- **Breaking changes**: Nenhum — CORS parametrizável mantém comportamento atual quando `ALLOWED_ORIGIN` não está definida (fallback para `*`)
