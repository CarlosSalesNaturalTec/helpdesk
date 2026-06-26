# Deploy GCP

## Purpose
TBD

## Requirements

### Requirement: Dockerfile multi-stage para backend
O projeto DEVE conter um `Dockerfile` na raiz do repositório que produza uma imagem Docker otimizada para o backend, resolvendo corretamente a dependência do workspace `@helpdesk/shared`.

#### Scenario: Build da imagem Docker
- **WHEN** o comando `docker build -t helpdesk-backend .` é executado na raiz do repositório
- **THEN** a imagem é construída com sucesso em dois estágios (build com TypeScript + runtime Alpine enxuto), o tamanho final da imagem é inferior a 300MB, e o container expõe a porta 3001

#### Scenario: Container inicia e responde
- **WHEN** o container é executado com as variáveis de ambiente corretas (`DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGIN`)
- **THEN** o backend responde a `GET /api/health` com `{ "status": "ok" }` em menos de 5 segundos

### Requirement: .dockerignore
O projeto DEVE conter um `.dockerignore` na raiz que exclua diretórios e arquivos desnecessários do build context Docker, incluindo `frontend/`, `docs/`, `.git/`, `node_modules/`, arquivos de ambiente local e configurações de IDE.

#### Scenario: Build context não inclui frontend
- **WHEN** o build Docker é executado
- **THEN** o diretório `frontend/` não é copiado para nenhum estágio da imagem, e a imagem final não contém código do frontend

### Requirement: .env.example com todas as variáveis de ambiente
O projeto DEVE conter um arquivo `.env.example` na raiz documentando todas as variáveis de ambiente necessárias para desenvolvimento e produção, com exemplos de valores e indicação de quais são obrigatórias.

#### Scenario: Desenvolvedor configura ambiente a partir do .env.example
- **WHEN** um desenvolvedor copia `.env.example` para `.env` e preenche as variáveis
- **THEN** todas as variáveis necessárias estão documentadas com comentários explicativos, incluindo: `DATABASE_URL`, `JWT_SECRET`, `SENDGRID_API_KEY`, `FROM_EMAIL`, `ALLOWED_ORIGIN`, `PORT`, `HOST`

### Requirement: CORS parametrizável no backend
O backend DEVE ler a origem permitida para CORS da variável de ambiente `ALLOWED_ORIGIN`, com fallback para `*` quando a variável não estiver definida, mantendo compatibilidade com desenvolvimento local.

#### Scenario: CORS em produção com origem específica
- **WHEN** `ALLOWED_ORIGIN=https://storage.googleapis.com/helpdesk-frontend/index.html` está definida
- **THEN** o header `Access-Control-Allow-Origin` nas respostas é `https://storage.googleapis.com/helpdesk-frontend` (origem exata, não wildcard)

#### Scenario: CORS em desenvolvimento local sem variável definida
- **WHEN** `ALLOWED_ORIGIN` não está definida no ambiente
- **THEN** o header `Access-Control-Allow-Origin` é `*` (fallback), mantendo o comportamento atual

### Requirement: URL da API configurável no frontend
O frontend DEVE ler a URL da API da variável de ambiente `VITE_API_URL` em tempo de build, com fallback para `http://localhost:3001` quando não definida.

#### Scenario: Build de produção com API remota
- **WHEN** o frontend é buildado com `VITE_API_URL=https://helpdesk-api-xxxxx-uc.a.run.app`
- **THEN** todas as chamadas de API do frontend usam `https://helpdesk-api-xxxxx-uc.a.run.app` como base URL

#### Scenario: Dev local sem variável definida
- **WHEN** o frontend roda em modo dev (`npm run dev`) sem `VITE_API_URL` definida
- **THEN** as chamadas de API usam `http://localhost:3001` como base URL (fallback)

### Requirement: cloudbuild.yaml com pipeline CI/CD
O projeto DEVE conter um arquivo `cloudbuild.yaml` na raiz que defina uma pipeline CI/CD no Google Cloud Build com trigger automático no push para a branch `main`, executando 4 stages sequenciais: build e push da imagem Docker, deploy no Cloud Run, build do frontend, e upload do frontend para Cloud Storage.

#### Scenario: Push na main dispara pipeline
- **WHEN** um commit é pushado para a branch `main`
- **THEN** o Cloud Build executa a pipeline definida em `cloudbuild.yaml`, builda a imagem Docker, faz push para Artifact Registry, implanta no Cloud Run, builda o frontend com `VITE_API_URL` apontando para a URL do Cloud Run, e faz upload dos arquivos estáticos para o bucket Cloud Storage

#### Scenario: Pipeline falha em stage intermediário
- **WHEN** o build do Docker falha no Stage 1
- **THEN** os stages subsequentes não são executados, e o Cloud Build reporta falha com o log do stage que quebrou

### Requirement: Guia de deploy no GCP
O projeto DEVE conter um arquivo `docs/Deploy_GCP.md` com instruções passo-a-passo para realizar o deploy completo da aplicação no Google Cloud Platform, cobrindo desde a criação do projeto GCP até a verificação final.

#### Scenario: Desenvolvedor segue o guia do zero
- **WHEN** um desenvolvedor com acesso a um projeto GCP limpo segue o guia `Deploy_GCP.md` do início ao fim
- **THEN** ao final ele tem: Cloud SQL PostgreSQL 15 rodando, backend no Cloud Run respondendo, frontend servido no Cloud Storage, e pipeline CI/CD configurada com Cloud Build trigger

### Requirement: Estrutura do Deploy_GCP.md
O guia de deploy DEVE conter as seguintes seções, nesta ordem:

1. Visão Geral da Arquitetura GCP (diagrama ASCII)
2. Pré-requisitos (gcloud CLI, Docker, projeto GCP com billing)
3. Serviços GCP e Custos Estimados (tabela com serviço, tier, custo mensal estimado)
4. Passo 1: Criar projeto GCP e habilitar APIs
5. Passo 2: Configurar Cloud SQL (PostgreSQL 15)
6. Passo 3: Criar Artifact Registry
7. Passo 4: Configurar Secret Manager
8. Passo 5: Build e Push da imagem Docker
9. Passo 6: Deploy no Cloud Run
10. Passo 7: Rodar migrations do Prisma
11. Passo 8: Build e Deploy do Frontend no Cloud Storage
12. Passo 9: Configurar Cloud Build Trigger (CI/CD)
13. Passo 10: Verificação e Testes
14. Troubleshooting (problemas comuns e soluções)

#### Scenario: Guia contém todas as seções obrigatórias
- **WHEN** o arquivo `docs/Deploy_GCP.md` é gerado
- **THEN** ele contém exatamente as 14 seções listadas, nesta ordem, cada uma com comandos `gcloud` exatos e verificáveis

### Requirement: Comandos gcloud copiáveis
Todos os comandos no guia de deploy DEVEM ser completos e copiáveis — incluindo placeholders entre `<>` com explicação do que substituir, nomes de recursos consistentes com prefixo `helpdesk-` ao longo de todo o guia.

#### Scenario: Desenvolvedor copia e cola comandos
- **WHEN** um desenvolvedor copia qualquer bloco de comando do guia e substitui apenas os placeholders `<>`
- **THEN** o comando executa com sucesso sem necessidade de ajustes adicionais

### Requirement: Tabela de custos estimados
O guia de deploy DEVE incluir uma tabela realista de custos mensais estimados para cada serviço GCP utilizado, assumindo volume baixo (50-300 chamados/mês), sem reserva de recursos, tier gratuito quando aplicável.

#### Scenario: Stakeholder avalia viabilidade financeira
- **WHEN** um gestor lê a seção de custos do guia de deploy
- **THEN** ele encontra uma estimativa mensal total entre $25-40 USD para operação em produção com o volume de uso descrito no PRD
