# Deploy no Google Cloud Platform — HelpDesk

Guia passo-a-passo para realizar o deploy completo da aplicação HelpDesk no Google Cloud Platform (GCP). Ao final deste guia, você terá: backend serverless no Cloud Run, banco PostgreSQL gerenciado no Cloud SQL, frontend estático no Cloud Storage, secrets no Secret Manager e pipeline CI/CD com Cloud Build.

---

## 1. Visão Geral da Arquitetura GCP

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GCP Project                                │
│                                                                     │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐    │
│  │ Cloud Storage │────▶│   Cloud Run       │────▶│  Cloud SQL   │    │
│  │  (Frontend)   │     │  (Backend API)    │     │ (PostgreSQL) │    │
│  │               │     │  Port 3001        │     │  Port 5432   │    │
│  └──────────────┘     └───────┬────────────┘     └──────────────┘    │
│                               │                                      │
│                        ┌──────┴──────┐                               │
│                        │   VPC / NAT │                               │
│                        └────────────┘                               │
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │   Secret      │     │  Artifact     │     │ Cloud Build  │        │
│  │   Manager     │     │  Registry     │     │   (CI/CD)    │        │
│  └──────────────┘     └──────────────┘     └──────────────┘        │
│                                                                     │
│  Fluxo:                                                             │
│  git push → Cloud Build trigger → Build Docker → Push AR →         │
│  Deploy Cloud Run → Build Frontend → Upload Cloud Storage          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pré-requisitos

Antes de começar, certifique-se de ter:

- **Google Cloud SDK (gcloud CLI)** instalado e autenticado:
  ```powershell
  gcloud auth login
  gcloud config set project <PROJECT_ID>
  ```
- **Docker** instalado localmente
- **Um projeto GCP** com **billing habilitado** (o guia assume que o projeto será criado ou já existe)
- **Permissões de Owner ou Editor** no projeto GCP (necessário para habilitar APIs, criar recursos e configurar IAM)
- **Git** com acesso ao repositório do HelpDesk

---

## 3. Serviços GCP e Custos Estimados

| Serviço             | Tier / Config                          | Custo Mensal Estimado |
| ------------------- | -------------------------------------- | --------------------- |
| **Cloud SQL**       | PostgreSQL 15, db-g1-small (1 vCPU, 1.7 GB RAM), 10 GB SSD | ~$25.00 |
| **Cloud Run**       | min-instances=0, 512 MiB, 1 vCPU       | ~$0.00 (free tier cobre tráfego baixo) |
| **Cloud Storage**   | Standard, < 1 GB armazenado            | ~$0.50                |
| **Artifact Registry** | < 1 GB de imagens Docker             | ~$0.50                |
| **Secret Manager**  | 4 secrets                              | ~$0.25                |
| **Cloud Build**     | e2-medium, ~5 builds/mês               | ~$0.00 (free tier: 120 build-min/dia) |
| **Total Estimado**  |                                        | **~$26-29/mês**       |

> **Nota:** Os valores são estimativas para o volume descrito no PRD (50-300 chamados/mês). O Cloud SQL é o custo dominante. Para ambientes de teste/não-produção, é possível usar db-f1-micro (~$9/mês) ou desligar a instância quando não estiver em uso. O custo total fica confortavelmente dentro da faixa de **$25-40/mês**.

---

## 4. Passo 1: Criar Projeto GCP e Habilitar APIs

Se ainda não tem um projeto, crie:

```powershell
gcloud projects create <PROJECT_ID> --name="HelpDesk"
gcloud config set project <PROJECT_ID>
gcloud billing projects link <PROJECT_ID> --billing-account=<BILLING_ACCOUNT_ID>
```

Habilite as APIs necessárias:

```powershell
gcloud services enable `
  sqladmin.googleapis.com `
  run.googleapis.com `
  artifactregistry.googleapis.com `
  cloudbuild.googleapis.com `
  secretmanager.googleapis.com `
  storage.googleapis.com `
  cloudresourcemanager.googleapis.com
```

Verifique se todas foram habilitadas:

```powershell
gcloud services list --enabled | Select-String 'sqladmin|run|artifactregistry|cloudbuild|secretmanager|storage'
```

---

## 5. Passo 2: Configurar Cloud SQL (PostgreSQL 15)

### 5.1 Criar instância

```powershell
gcloud sql instances create helpdesk-db `
  --database-version=POSTGRES_15 `
  --tier=db-g1-small `
  --region=us-central1 `
  --storage-size=10 `
  --storage-type=SSD `
  --availability-type=zonal `
  --backup-start-time=03:00 `
  --assign-ip
```

> **Economia:** Para ambiente de desenvolvimento, use `--tier=db-f1-micro` (compartilhado, ~$9/mês). Para produção, db-g1-small é o mínimo recomendado.

### 5.2 Criar banco de dados e usuário

```powershell
gcloud sql databases create helpdesk --instance=helpdesk-db

gcloud sql users create helpdesk-user `
  --instance=helpdesk-db `
  --password=<DB_PASSWORD>
```

> **Anote a senha** — ela será armazenada no Secret Manager no Passo 4.

### 5.3 Montar a connection string

Formato: `postgresql://helpdesk-user:<DB_PASSWORD>@/helpdesk?host=/cloudsql/<PROJECT_ID>:us-central1:helpdesk-db`

Guarde este valor — será usado como `DATABASE_URL` no Secret Manager.

---

## 6. Passo 3: Criar Artifact Registry

Crie um repositório Docker para armazenar as imagens do backend:

```powershell
gcloud artifacts repositories create helpdesk-repo `
  --repository-format=docker `
  --location=us-central1 `
  --description="HelpDesk backend images"
```

Configure o Docker para autenticar com o Artifact Registry:

```powershell
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## 7. Passo 4: Configurar Secret Manager

Armazene os segredos da aplicação no Secret Manager:

```powershell
# Database URL (connection string completa)
[System.IO.File]::WriteAllText("$env:TEMP\helpdesk-db-url.txt", "postgresql://helpdesk-user:<DB_PASSWORD>@/helpdesk?host=/cloudsql/<PROJECT_ID>:us-central1:helpdesk-db", [System.Text.Encoding]::UTF8)
gcloud secrets create helpdesk-database-url --data-file="$env:TEMP\helpdesk-db-url.txt"
Remove-Item "$env:TEMP\helpdesk-db-url.txt"

# JWT Secret (gere um valor aleatório)
$jwtBytes = [byte[]]::new(32); (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($jwtBytes); $jwtSecret = [Convert]::ToBase64String($jwtBytes)
[System.IO.File]::WriteAllText("$env:TEMP\helpdesk-jwt.txt", $jwtSecret, [System.Text.Encoding]::UTF8)
gcloud secrets create helpdesk-jwt-secret --data-file="$env:TEMP\helpdesk-jwt.txt"
Remove-Item "$env:TEMP\helpdesk-jwt.txt"

# SendGrid API Key (opcional — deixe vazio se não for usar e-mail)
[System.IO.File]::WriteAllText("$env:TEMP\helpdesk-sg.txt", "<SG_API_KEY>", [System.Text.Encoding]::UTF8)
gcloud secrets create helpdesk-sendgrid-api-key --data-file="$env:TEMP\helpdesk-sg.txt"
Remove-Item "$env:TEMP\helpdesk-sg.txt"
```

Conceda permissão para o Cloud Run acessar os secrets:

```powershell
$PROJECT_NUMBER = (gcloud projects describe <PROJECT_ID> --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding helpdesk-database-url `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding helpdesk-jwt-secret `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding helpdesk-sendgrid-api-key `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

---

## 8. Passo 5: Build e Push da Imagem Docker

Faça o build da imagem localmente (opcional — o Cloud Build fará isso automaticamente depois):

```powershell
docker build -t us-central1-docker.pkg.dev/<PROJECT_ID>/helpdesk-repo/helpdesk-backend:latest .
```

Faça o push para o Artifact Registry:

```powershell
docker push us-central1-docker.pkg.dev/<PROJECT_ID>/helpdesk-repo/helpdesk-backend:latest
```

> **Nota:** Este passo é útil para testar a imagem antes de configurar o Cloud Build. Se preferir pular direto para o CI/CD, o Cloud Build fará o build automaticamente (Passo 9).

---

## 9. Passo 6: Deploy no Cloud Run

Implante o serviço do backend no Cloud Run:

```powershell
gcloud run deploy helpdesk-backend `
  --image=us-central1-docker.pkg.dev/<PROJECT_ID>/helpdesk-repo/helpdesk-backend:latest `
  --region=us-central1 `
  --platform=managed `
  --allow-unauthenticated `
  --memory=512Mi `
  --cpu=1 `
  --min-instances=0 `
  --max-instances=3 `
  --concurrency=80 `
  --timeout=300 `
  --port=3001 `
  --set-env-vars=NODE_ENV=production,PORT=3001,HOST=0.0.0.0 `
  --set-env-vars=FROM_EMAIL=noreply@helpdesk.local `
  --set-env-vars=ALLOWED_ORIGIN=https://storage.googleapis.com `
  --set-secrets=DATABASE_URL=helpdesk-database-url:latest `
  --set-secrets=JWT_SECRET=helpdesk-jwt-secret:latest `
  --set-secrets=SENDGRID_API_KEY=helpdesk-sendgrid-api-key:latest `
  --add-cloudsql-instances=<PROJECT_ID>:us-central1:helpdesk-db
```

Após o deploy, anote a URL do serviço:

```powershell
gcloud run services describe helpdesk-backend `
  --region=us-central1 `
  --format='value(status.url)'
```

A URL será algo como: `https://helpdesk-backend-xxxxx-uc.a.run.app`

### Verifique o health check

```powershell
Invoke-RestMethod -Uri https://helpdesk-backend-xxxxx-uc.a.run.app/api/health
# Deve retornar: {"status":"ok"}
```

> **Cold start:** Se o serviço estiver com `min-instances=0` e não recebeu requisições recentemente, o primeiro request pode levar 2-5 segundos (inicialização do container + conexão Cloud SQL).

---

## 10. Passo 7: Rodar Migrations do Prisma

As migrations precisam ser executadas para criar as tabelas no banco. Como o Cloud Run não expõe shell interativo, use um job temporário ou execute localmente conectando ao Cloud SQL.

### Opção A: Via Cloud SQL Proxy (recomendado)

1. Inicie o Cloud SQL Proxy:

   ```powershell
   .\cloud-sql-proxy.exe <PROJECT_ID>:us-central1:helpdesk-db
   ```

   > Baixe o proxy em: https://cloud.google.com/sql/docs/postgres/sql-proxy

2. Em outro terminal, configure a DATABASE_URL local:

   ```powershell
   $env:DATABASE_URL = "postgresql://helpdesk-user:<DB_PASSWORD>@localhost:5432/helpdesk"
   ```

3. Execute as migrations:

   ```powershell
   npx prisma migrate deploy
   ```

4. (Opcional) Popule com dados de teste:

   ```powershell
   npx prisma db seed
   ```

### Opção B: Via Cloud Run Job (alternativa)

Crie um job único no Cloud Run para executar a migration:

```powershell
gcloud run jobs create helpdesk-migration `
  --image=us-central1-docker.pkg.dev/<PROJECT_ID>/helpdesk-repo/helpdesk-backend:latest `
  --region=us-central1 `
  --command="npx" `
  --args="prisma,migrate,deploy" `
  --set-secrets=DATABASE_URL=helpdesk-database-url:latest `
  --add-cloudsql-instances=<PROJECT_ID>:us-central1:helpdesk-db

gcloud run jobs execute helpdesk-migration --region=us-central1
```

---

## 11. Passo 8: Build e Deploy do Frontend no Cloud Storage

### 11.1 Criar bucket

```powershell
gcloud storage buckets create gs://helpdesk-frontend-<PROJECT_ID> `
  --location=us-central1 `
  --public-access-prevention
```

> O bucket **não** é público. Configuramos acesso via load balancer ou usamos URLs assinadas. Para simplificar, este guia usa acesso público controlado (adequado para SPAs sem dados sensíveis no frontend).

Para tornar o bucket público (SPA):

```powershell
gcloud storage buckets add-iam-policy-binding gs://helpdesk-frontend-<PROJECT_ID> `
  --member=allUsers `
  --role=roles/storage.objectViewer
```

Configure a página de índice e erro para SPA:

```powershell
gcloud storage buckets update gs://helpdesk-frontend-<PROJECT_ID> `
  --web-main-page-suffix=index.html `
  --web-error-page=index.html
```

### 11.2 Build e upload

Obtenha a URL do Cloud Run (do Passo 6):

```powershell
$CLOUD_RUN_URL = (gcloud run services describe helpdesk-backend `
  --region=us-central1 `
  --format='value(status.url)')
```

Faça o build do frontend com a URL da API:

```powershell
$env:VITE_API_URL = $CLOUD_RUN_URL; npm run build --workspace=frontend
```

Faça o upload para o bucket:

```powershell
gsutil -m rsync -r -d frontend/dist/ gs://helpdesk-frontend-<PROJECT_ID>/

# Configure cache headers
gsutil -m setmeta -h 'Cache-Control:public, max-age=3600' `
  gs://helpdesk-frontend-<PROJECT_ID>/**/*.js
gsutil -m setmeta -h 'Cache-Control:public, max-age=3600' `
  gs://helpdesk-frontend-<PROJECT_ID>/**/*.css
gsutil -m setmeta -h 'Cache-Control:no-cache' `
  gs://helpdesk-frontend-<PROJECT_ID>/index.html
```

Acesse o frontend em:

```
https://storage.googleapis.com/helpdesk-frontend-<PROJECT_ID>/index.html
```

### 11.3 Atualizar CORS no Cloud Run

Após o deploy do frontend, atualize o `ALLOWED_ORIGIN` no Cloud Run:

```powershell
gcloud run services update helpdesk-backend `
  --region=us-central1 `
  --update-env-vars=ALLOWED_ORIGIN=https://storage.googleapis.com
```

---

## 12. Passo 9: Configurar Cloud Build Trigger (CI/CD)

### 12.1 Conceder permissões ao Cloud Build

A service account do Cloud Build precisa de permissões para deploy no Cloud Run e acesso aos secrets:

```powershell
$PROJECT_NUMBER = (gcloud projects describe <PROJECT_ID> --format='value(projectNumber)')
$CLOUD_BUILD_SA = "serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com"

# Permissão para deploy no Cloud Run
gcloud projects add-iam-policy-binding <PROJECT_ID> `
  --member="$CLOUD_BUILD_SA" `
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding <PROJECT_ID> `
  --member="$CLOUD_BUILD_SA" `
  --role="roles/iam.serviceAccountUser"

# Permissão para acessar Secret Manager
gcloud projects add-iam-policy-binding <PROJECT_ID> `
  --member="$CLOUD_BUILD_SA" `
  --role="roles/secretmanager.secretAccessor"

# Permissão para upload no Cloud Storage
gcloud projects add-iam-policy-binding <PROJECT_ID> `
  --member="$CLOUD_BUILD_SA" `
  --role="roles/storage.admin"

# Permissão para Cloud SQL
gcloud projects add-iam-policy-binding <PROJECT_ID> `
  --member="$CLOUD_BUILD_SA" `
  --role="roles/cloudsql.client"
```

### 12.2 Criar o trigger

Conecte o repositório ao Cloud Build (se ainda não estiver conectado):

```powershell
# Via GitHub
gcloud builds triggers create github `
  --name="helpdesk-deploy" `
  --repo-name="<REPO_NAME>" `
  --repo-owner="<GITHUB_USER_OR_ORG>" `
  --branch-pattern="^main$" `
  --build-config="cloudbuild.yaml" `
  --substitutions=`
_REGION=us-central1,`
_ARTIFACT_REGISTRY_REPO=helpdesk-repo,`
_CLOUD_RUN_SERVICE=helpdesk-backend,`
_CLOUD_SQL_INSTANCE=helpdesk-db,`
_FRONTEND_BUCKET=helpdesk-frontend-<PROJECT_ID>,`
_VITE_API_URL=<CLOUD_RUN_URL>
```

> **Nota:** Substitua `<CLOUD_RUN_URL>` pela URL real do serviço Cloud Run (ex: `https://helpdesk-backend-xxxxx-uc.a.run.app`).

### 12.3 Testar o trigger

Faça um push para a branch `main`:

```powershell
git add .
git commit -m "chore: trigger CI/CD pipeline"
git push origin main
```

Acompanhe o build:

```powershell
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>
```

---

## 13. Passo 10: Verificação e Testes

Após o deploy completo, execute a checklist de verificação:

### 13.1 Backend

```powershell
# Health check
Invoke-RestMethod -Uri https://<CLOUD_RUN_URL>/api/health

# Login (substitua as credenciais)
Invoke-RestMethod -Uri https://<CLOUD_RUN_URL>/api/auth/login `
  -Method Post `
  -Headers @{"Content-Type" = "application/json"} `
  -Body '{"email":"admin@helpdesk.com","senha":"admin123"}'
```

### 13.2 Frontend

- Acesse `https://storage.googleapis.com/helpdesk-frontend-<PROJECT_ID>/index.html`
- Faça login com `admin@helpdesk.com` / `admin123`
- Verifique: dashboard carrega, lista de tickets aparece, pode abrir um novo chamado

### 13.3 Banco de dados

```powershell
# Via Cloud SQL Proxy
gcloud sql connect helpdesk-db --user=helpdesk-user
# Execute: SELECT count(*) FROM "Ticket";
```

### 13.4 Pipeline

- Faça um commit de teste em `main`
- Verifique que o Cloud Build executa todos os 4 stages
- Confirme que a nova versão está no ar

---

## 14. Troubleshooting

### 14.1 Conexão Cloud SQL Recusada

**Sintoma:** Cloud Run retorna erro `ECONNREFUSED` ao tentar conectar ao banco.

**Causas prováveis:**
- Flag `--add-cloudsql-instances` não foi configurada ou está incorreta
- Cloud SQL Proxy não está sendo usado no ambiente local

**Solução:**
```powershell
# Verifique a configuração do Cloud Run
gcloud run services describe helpdesk-backend --region=us-central1 `
  --format='yaml(spec.template.metadata.annotations)'

# Confirme a instância Cloud SQL
gcloud sql instances list

# O formato deve ser: <PROJECT_ID>:<REGION>:<INSTANCE_NAME>
```

### 14.2 Migration Falhando (Prisma)

**Sintoma:** `prisma migrate deploy` falha com erro de conexão ou lock.

**Causas prováveis:**
- DATABASE_URL incorreta
- Banco não está acessível da máquina que executa a migration
- Migration anterior travada (lock)

**Solução:**
```powershell
# 1. Verifique a conectividade via Cloud SQL Proxy
Start-Process .\cloud-sql-proxy.exe -ArgumentList '<PROJECT_ID>:us-central1:helpdesk-db'
Start-Sleep -Seconds 2
psql "postgresql://helpdesk-user:<DB_PASSWORD>@localhost:5432/helpdesk" -c "SELECT 1;"

# 2. Se houver lock, veja as migrations pendentes
npx prisma migrate status

# 3. Force o reset em ambiente de dev (CUIDADO: apaga dados!)
npx prisma migrate reset --force
```

### 14.3 Cold Start no Cloud Run

**Sintoma:** Primeiro request após período de inatividade demora 3-5 segundos.

**Causa:** `min-instances=0` significa que o container é desligado quando não há tráfego. Ao receber um request, o Cloud Run precisa iniciar um novo container.

**Solução:**
- Opção 1 (recomendada para economia): Aceite o cold start — é aceitável para volumes baixos.
- Opção 2: Aumente `min-instances` para 1:
  ```powershell
  gcloud run services update helpdesk-backend `
    --region=us-central1 `
    --min-instances=1
  ```
  Custo adicional: ~$15-20/mês por instância.

### 14.4 CORS Bloqueando Frontend

**Sintoma:** Frontend carrega mas chamadas de API retornam erro de CORS no console do navegador.

**Causas prováveis:**
- `ALLOWED_ORIGIN` não está configurada ou tem o valor errado
- URL do Cloud Storage não corresponde ao valor em `ALLOWED_ORIGIN`

**Solução:**
```powershell
# Verifique o valor atual
gcloud run services describe helpdesk-backend --region=us-central1 `
  --format='yaml(spec.template.containers[0].env)'

# Atualize com a origem correta (sem a barra no final)
gcloud run services update helpdesk-backend `
  --region=us-central1 `
  --update-env-vars=ALLOWED_ORIGIN=https://storage.googleapis.com
```

### 14.5 Cloud Build Sem Permissão

**Sintoma:** Build falha com `Permission denied` ao tentar fazer deploy no Cloud Run ou acessar secrets.

**Causa:** Service account do Cloud Build não tem as roles necessárias.

**Solução:**
```powershell
$PROJECT_NUMBER = (gcloud projects describe <PROJECT_ID> --format='value(projectNumber)')
$CLOUD_BUILD_SA = "$PROJECT_NUMBER@cloudbuild.gserviceaccount.com"

# Revise todas as permissões concedidas
gcloud projects get-iam-policy <PROJECT_ID> `
  --flatten="bindings[].members" `
  --filter="bindings.members:$CLOUD_BUILD_SA"

# Conceda as permissões faltantes (veja Passo 9)
```

### 14.6 Imagem Docker Excede Limite

**Sintoma:** `docker push` falha ou Cloud Run recusa a imagem por tamanho excessivo.

**Causa:** Imagem final muito grande (> 2 GB). O limite do Cloud Run é ~2 GB.

**Solução:**
```powershell
# Verifique o tamanho da imagem
docker images | Select-String helpdesk-backend

# A imagem deve ter menos de 300 MB. Se estiver maior:
# 1. Verifique o .dockerignore — frontend/ e docs/ não devem estar na imagem
# 2. Certifique-se de que apenas node_modules de produção estão no stage 2
# 3. Use docker history para inspecionar camadas grandes:
docker history us-central1-docker.pkg.dev/<PROJECT_ID>/helpdesk-repo/helpdesk-backend:latest
```

---

## Referência: Variáveis de Ambiente no Cloud Run

| Variável           | Origem          | Descrição                                      |
| ------------------ | --------------- | ---------------------------------------------- |
| `DATABASE_URL`     | Secret Manager  | Connection string do PostgreSQL                |
| `JWT_SECRET`       | Secret Manager  | Chave de assinatura JWT (min 32 chars)         |
| `SENDGRID_API_KEY` | Secret Manager  | API key do SendGrid (opcional)                 |
| `NODE_ENV`         | Cloud Run env   | Sempre `production`                            |
| `PORT`             | Cloud Run env   | Porta do servidor (sempre `3001`)              |
| `HOST`             | Cloud Run env   | Endereço de bind (sempre `0.0.0.0`)            |
| `FROM_EMAIL`       | Cloud Run env   | Remetente dos e-mails                          |
| `ALLOWED_ORIGIN`   | Cloud Run env   | Origem permitida para CORS (URL do frontend)   |

---

🤖 Guia gerado como parte do OpenSpec change `docs-readme-deploy-gcp`.
