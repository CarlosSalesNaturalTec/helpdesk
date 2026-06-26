## Context

O projeto HelpDesk é um monorepo npm workspaces com três pacotes (`shared`, `backend`, `frontend`) e Prisma como ORM. Atualmente, o ambiente local usa `docker-compose.yml` apenas para o banco PostgreSQL. Não existe containerização do backend nem configuração para produção. O frontend é uma SPA React com Vite, o backend é Fastify + TypeScript compilado para `dist/`.

O deploy será no Google Cloud Platform usando Cloud Run (serverless containers) para o backend, Cloud Storage para o frontend estático, e Cloud SQL para PostgreSQL gerenciado. A pipeline CI/CD usará Cloud Build com trigger no push para a branch `main`.

## Goals / Non-Goals

**Goals:**
- Criar Dockerfile multi-stage otimizado que resolva corretamente o workspace monorepo (`shared` → `backend`)
- Parametrizar CORS para produção sem quebrar desenvolvimento local
- Parametrizar URL da API no frontend para builds de produção
- Documentar todas as variáveis de ambiente em `.env.example` centralizado
- Pipeline CI/CD que automatiza build → push → deploy no push para `main`
- Guia de deploy que qualquer desenvolvedor com acesso ao projeto GCP consiga seguir

**Non-Goals:**
- Docker Compose para produção (apenas local)
- Múltiplos ambientes (staging, homologação)
- Domínio customizado com SSL
- Monitoramento avançado (alertas, SLOs)
- Migração de banco com downtime zero
- Health check além do `/api/health` já existente

## Decisions

### D1: Dockerfile na raiz do repositório

**Decisão:** Colocar o `Dockerfile` na raiz do repositório, não dentro de `backend/`.

**Alternativa considerada:** Dockerfile dentro de `backend/` com build context limitado.

**Rationale:** Como o backend depende de `@helpdesk/shared` (workspace dependency), o build context precisa incluir tanto `shared/` quanto `backend/`. Com Dockerfile na raiz, o comando `docker build` tem acesso a ambos. A imagem final contém apenas o necessário (backend compilado + produção node_modules do backend + shared compilado).

**Estrutura do build multi-stage:**
```
Stage 1 (build):
  - Copia shared/package.json, shared/tsconfig.json, shared/src/
  - Compila shared (tsc)
  - Copia backend/package.json, backend/tsconfig.json, backend/src/
  - Copia prisma/schema.prisma (para prisma generate)
  - npm install (produção) no workspace root
  - Compila backend (tsc)
  - prisma generate

Stage 2 (runtime):
  - node:20-alpine
  - Copia apenas dist/, node_modules/, prisma/ do stage 1
  - EXPOSE 3001
  - CMD ["node", "dist/index.js"]
```

### D2: CORS com fallback para wildcard

**Decisão:** Substituir `'*'` por `process.env.ALLOWED_ORIGIN || '*'` no hook `onRequest`.

**Alternativa considerada:** Array de origens permitidas com whitelist.

**Rationale:** O caso mais simples cobre as necessidades. Em Cloud Run, `ALLOWED_ORIGIN` será a URL do Cloud Storage. Em dev local, o fallback `*` mantém o comportamento atual sem configuração adicional. Array seria overengineering para um frontend único.

### D3: VITE_API_URL injetada via variável de ambiente no build

**Decisão:** Usar `import.meta.env.VITE_API_URL` no código do frontend e definir `VITE_API_URL` no Cloud Build durante o build.

**Alternativa considerada:** Proxy reverso no Cloud Run servindo o frontend.

**Rationale:** Separar frontend estático (Cloud Storage) de backend (Cloud Run) é mais barato e escalável. Cloud Storage serve arquivos estáticos sem custo de compute. O Vite já suporta `VITE_*` prefix variables nativamente — a URL do backend é injetada em tempo de build, não em runtime.

No código, criar `frontend/src/config.ts`:
```ts
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### D4: Cloud Build pipeline em 4 stages

**Decisão:** Pipeline linear com 4 stages no `cloudbuild.yaml`:
```
1. Build Docker image + push to Artifact Registry
2. Deploy to Cloud Run
3. Build frontend (npm run build --workspace=frontend)
4. Deploy frontend to Cloud Storage (gsutil rsync)
```

**Alternativa considerada:** Stages paralelos (backend e frontend em paralelo).

**Rationale:** Frontend build é rápido (<30s), backend Docker build é o gargalo (~2min). Paralelismo economizaria pouco tempo e complicaria o YAML. Pipeline linear é mais simples de depurar. Além disso, o deploy do backend deve preceder o build do frontend se quiséssemos injetar a URL real do Cloud Run no frontend — mas como a URL do Cloud Run é conhecida antes do deploy (definida como `--service`), podemos buildar em paralelo se necessário. Mantemos linear por simplicidade.

**Arquitetura da pipeline:**
```
┌─────────────────────────────────────────────────┐
│  Cloud Build Trigger (push → main)               │
│                                                   │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  │ Stage 1  │──▶│ Stage 2  │──▶│ Stage 3  │──▶│ Stage 4  │
│  │ Docker   │   │ Deploy   │   │ Frontend │   │ Upload   │
│  │ Build    │   │ Cloud Run│   │ Build    │   │ GCS      │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘
│       ↑              ↑              ↑              ↑
│  Artifact Reg.   Cloud Run    npm build      gsutil rsync
│                                                   │
└─────────────────────────────────────────────────┘
```

### D5: Secrets via Secret Manager + envFrom no Cloud Run

**Decisão:** Variáveis sensíveis (`DATABASE_URL`, `JWT_SECRET`, `SENDGRID_API_KEY`) armazenadas no Secret Manager e montadas como variáveis de ambiente no Cloud Run. Variáveis não-sensíveis (`ALLOWED_ORIGIN`, `PORT`, `HOST`, `FROM_EMAIL`) definidas diretamente no YAML de deploy.

**Rationale:** Separação clara entre config e secrets. Secret Manager oferece versionamento, auditoria e IAM granular. Cloud Run tem integração nativa com `--set-secrets`.

## Risks / Trade-offs

- **[Risco] Docker build no Cloud Build pode exceder o timeout padrão (10min)** → Mitigação: Usar máquina `e2-medium` (padrão) é suficiente; multi-stage com cache do Artifact Registry reduz builds subsequentes. Se necessário, aumentar timeout para 20min.

- **[Risco] Cloud SQL cold start após escala a zero** → Mitigação: Documentar no guia de deploy que o primeiro request após inatividade pode levar ~2-3s (conexão ao Cloud SQL + startup do container). Cloud Run com `min-instances=0` é a opção mais econômica para baixo volume.

- **[Risco] Frontend com URL do backend hardcoded no build** → Mitigação: Se a URL do Cloud Run mudar (recriação do serviço), é necessário rebuild do frontend. Como usamos Cloud Build trigger no push, um commit com a nova URL resolve. Para ambientes mais dinâmicos, seria melhor usar um Load Balancer com URL fixa, mas isso vai contra o escopo "cru".

- **[Trade-off] Dockerfile na raiz vs dentro de backend/** → Vantagem: build context completo para resolver workspace. Desvantagem: `.dockerignore` precisa ser cuidadoso para não incluir `frontend/`, `docs/`, `.git/` na imagem. Aceitável pois `.dockerignore` resolve.

- **[Trade-off] `min-instances=0` vs `min-instances=1`** → 0 = mais barato (~$0/mês sem tráfego), mas cold start. 1 = resposta imediata, mas custo contínuo (~$15-20/mês por instância). Para o volume de 50-300 chamados/mês, `min-instances=0` é a escolha correta.

## Open Questions

- Nenhuma pendência. Todas as decisões técnicas estão resolvidas para implementação.
