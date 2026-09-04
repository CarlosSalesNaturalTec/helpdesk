# Deploy no Google Cloud Platform — HelpDesk

Guia passo-a-passo para realizar o deploy completo da aplicação HelpDesk no Google Cloud Platform (GCP). Ao final deste guia, você terá: backend serverless no Cloud Run, banco PostgreSQL gerenciado no Cloud SQL, frontend estático no Firebase Hosting, secrets no Secret Manager e pipeline CI/CD com Cloud Build.

---

## 1. Visão Geral da Arquitetura GCP

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GCP Project                                │
│                                                                     │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐    │
│  │  Firebase     │────▶│   Cloud Run       │────▶│  Cloud SQL   │    │
│  │  Hosting      │     │  (Backend API)    │     │ (PostgreSQL) │    │
│  │  (Frontend)   │     │  Port 3001        │     │  Port 5432   │    │
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
│  Deploy Cloud Run → Build Frontend/Manual → Publish Firebase       │
│  Hosting                                                            │
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
- **Firebase CLI** instalado (usado no Passo 8, para o deploy do frontend):
  ```powershell
  npm install -g firebase-tools
  firebase login
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
| **Firebase Hosting** | plano Spark (gratuito), 10 GB armazenados / 360 MB de transferência por dia | ~$0.00 |
| **Cloud Storage**   | Standard, < 1 GB armazenado (bucket de anexos) | ~$0.50                |
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
  --set-env-vars=EMAIL_FROM=helpdesk@naturaltec.com.br `
  --set-env-vars=FRONTEND_URL=https://<PROJECT_ID>.web.app `
  --set-env-vars=ALLOWED_ORIGIN=https://<PROJECT_ID>.web.app `
  --set-env-vars=GCS_BUCKET_NAME=helpdesk-attachments-<PROJECT_ID> `
  --set-secrets=DATABASE_URL=helpdesk-database-url:latest `
  --set-secrets=JWT_SECRET=helpdesk-jwt-secret:latest `
  --set-secrets=SENDGRID_API_KEY=helpdesk-sendgrid-api-key:latest `
  --add-cloudsql-instances=<PROJECT_ID>:us-central1:helpdesk-db
```

> **Atenção aos nomes das variáveis de e-mail:** o backend lê exatamente `EMAIL_FROM` e `FRONTEND_URL` (veja `backend/src/services/email.ts`). Se os nomes forem grafados de outra forma, não há erro — o serviço apenas cai nos valores padrão do código (`helpdesk@naturaltec.com.br` e `http://localhost:5173`), e os links dos e-mails de notificação apontam para `localhost`.

> **`EMAIL_FROM`** precisa ser um remetente (ou domínio) verificado no SendGrid, caso contrário as mensagens são rejeitadas na entrega.

> **`FRONTEND_URL`** é usada para montar os links dos e-mails (`${FRONTEND_URL}/chamados/{id}`). O site padrão do Firebase (`<PROJECT_ID>.web.app`) já existe assim que o Firebase é habilitado no projeto (Passo 8.1), então o valor acima já é definitivo — não é necessário voltar aqui depois. O Firebase Hosting reescreve qualquer rota do SPA para `index.html` (`firebase.json`), então esses links profundos resolvem diretamente, sem domínio customizado nem load balancer.

> **`GCS_BUCKET_NAME`** é obrigatória para o upload de anexos de chamados; sem ela, as requisições de anexo falham com HTTP 500. A criação e as permissões desse bucket (incluindo `roles/storage.objectAdmin` para a service account do Cloud Run) estão em [`gcs-bucket-setup.md`](./gcs-bucket-setup.md).

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
  --set-cloudsql-instances=<PROJECT_ID>:us-central1:helpdesk-db

gcloud run jobs execute helpdesk-migration --region=us-central1
```

---

## 11. Passo 8: Build e Deploy do Frontend no Firebase Hosting

### 11.1 Habilitar o Firebase no projeto GCP existente

O Firebase Hosting roda sobre o mesmo projeto GCP — não é um projeto separado:

```powershell
firebase projects:addfirebase <PROJECT_ID>
```

Confirme que o site padrão foi criado (a URL segue o padrão `<PROJECT_ID>.web.app`):

```powershell
firebase hosting:sites:list --project <PROJECT_ID>
```

### 11.2 Ativar a API e conceder permissão à service account do Cloud Build

```powershell
gcloud services enable firebasehosting.googleapis.com --project <PROJECT_ID>

$PROJECT_NUMBER = (gcloud projects describe <PROJECT_ID> --format='value(projectNumber)')
gcloud projects add-iam-policy-binding <PROJECT_ID> `
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
  --role="roles/firebasehosting.admin"
```

> Se esta permissão for esquecida, o estágio `deploy-frontend` do Cloud Build falha com 403 — o backend já terá subido normalmente (Passo 6 roda antes), e o frontend fica na versão publicada anteriormente. Falha visível, sem estado inconsistente.

### 11.3 `firebase.json` e `.firebaserc`

O repositório já versiona os dois arquivos na raiz — não é necessário criar nada manualmente. `firebase.json` declara onde estão os arquivos publicáveis, a ordem das reescritas (SPA e manual) e os headers de cache:

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*"],
    "rewrites": [
      { "source": "/manual/**", "destination": "/manual/404.html" },
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      },
      {
        "source": "**/*.html",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      }
    ]
  }
}
```

A reescrita de `/manual/**` para o 404 do próprio manual vem **antes** do catch-all do SPA — assim uma URL inexistente sob `/manual/` cai na página 404 do MkDocs, e não na tela da aplicação. Arquivos estáticos existentes (`/assets/*.js`, `/manual/perfis/tecnico.html`) são sempre servidos diretamente, antes de qualquer reescrita.

`.firebaserc` só precisa apontar para o projeto:

```json
{
  "projects": {
    "default": "<PROJECT_ID>"
  }
}
```

### 11.4 Build e deploy manual (validação única)

Antes de tocar no pipeline, valide credenciais e reescritas com um deploy manual a partir de um build local:

```powershell
$CLOUD_RUN_URL = (gcloud run services describe helpdesk-backend `
  --region=us-central1 `
  --format='value(status.url)')

npm ci
npm run build --workspace=shared
$env:VITE_API_URL = $CLOUD_RUN_URL; npm run build --workspace=frontend

firebase deploy --only hosting --project <PROJECT_ID>
```

> **Base absoluta dos assets:** `frontend/vite.config.ts` usa `base: '/'` (não `'./'`). Com base relativa, uma rota aninhada servida pela reescrita de SPA — `/chamados/123` — resolveria os assets contra `/chamados/assets/…` em vez de `/assets/…`, resultando em tela em branco. `/login` funcionaria e mascararia o problema; o deep link de e-mail, que motivou esta migração, é quem quebraria.
>
> **Manual do sistema:** o pipeline do Cloud Build também publica o manual de uso (MkDocs), gerado dentro de `frontend/dist/manual/` e publicado na mesma operação `firebase deploy`, acessível em `<url-do-frontend>/manual/index.html` — e também em `<url-do-frontend>/manual/`, que o Firebase Hosting resolve como índice de diretório. Veja `docs/manual/operacao/deploy.md` para detalhes da etapa `build-docs`.

Acesse o frontend em:

```
https://<PROJECT_ID>.web.app/login
```

### 11.5 Confirmar CORS e a URL do frontend no Cloud Run

`ALLOWED_ORIGIN` e `FRONTEND_URL` já foram definidas com o valor final no Passo 6 (`https://<PROJECT_ID>.web.app`), porque o site padrão do Firebase existe desde o Passo 8.1 — não há necessidade de atualizar o Cloud Run de novo aqui. Se os valores tiverem sido definidos de outra forma, corrija com:

```powershell
gcloud run services update helpdesk-backend `
  --region=us-central1 `
  --update-env-vars=ALLOWED_ORIGIN=https://<PROJECT_ID>.web.app `
  --update-env-vars=FRONTEND_URL=https://<PROJECT_ID>.web.app
```

> `ALLOWED_ORIGIN` é a **origem** (esquema + host, sem caminho e sem barra no final) usada na validação de CORS; `FRONTEND_URL` é a **URL base** usada para montar os links dos e-mails. No Firebase Hosting as duas coincidem, porque não há caminho de bucket a considerar. Quando houver domínio customizado, ambas passam a apontar para ele.

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

# Permissão para Cloud SQL
gcloud projects add-iam-policy-binding <PROJECT_ID> `
  --member="$CLOUD_BUILD_SA" `
  --role="roles/cloudsql.client"
```

> A permissão para publicar no Firebase Hosting (`roles/firebasehosting.admin`) já foi concedida a esta mesma service account no Passo 8.2 — não repita aqui.

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
  --substitutions="_REGION=us-central1,_ARTIFACT_REGISTRY_REPO=helpdesk-repo,_CLOUD_RUN_SERVICE=helpdesk-backend,_CLOUD_SQL_INSTANCE=helpdesk-db,_VITE_API_URL=<CLOUD_RUN_URL>,_GCS_BUCKET_NAME=helpdesk-attachments-<PROJECT_ID>,_EMAIL_FROM=helpdesk@naturaltec.com.br,_FRONTEND_URL=https://<PROJECT_ID>.web.app"
```

> **Nota:** Substitua `<CLOUD_RUN_URL>` pela URL real do serviço Cloud Run (ex: `https://helpdesk-backend-xxxxx-uc.a.run.app`).

> Todas essas substituições já têm valores padrão no `cloudbuild.yaml`; informá-las no trigger serve para sobrescrevê-las sem editar o arquivo versionado. `_EMAIL_FROM` e `_FRONTEND_URL` alimentam as variáveis `EMAIL_FROM` e `FRONTEND_URL` do Cloud Run.

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

- Acesse `https://<PROJECT_ID>.web.app/login` diretamente (URL digitada, não navegada) — deve responder 200 e renderizar a tela de Login
- Faça login com `admin@helpdesk.com` / `admin123`
- Verifique: dashboard carrega, lista de tickets aparece, pode abrir um novo chamado
- **Deep link aninhado:** cole `https://<PROJECT_ID>.web.app/chamados/{id}` de um chamado real direto no navegador e confirme que a tela carrega — é o caso que quebraria com `base: './'` em `vite.config.ts`
- F5 em uma tela autenticada (ex.: `/dashboard`) e confirme que recarrega sem erro do servidor
- Acesse `https://<PROJECT_ID>.web.app/manual/` (barra final) e confirme 200 — e uma URL inexistente sob `/manual/`, que deve cair na página 404 do próprio manual, não na tela da aplicação

### 13.3 Banco de dados

```powershell
# Via Cloud SQL Proxy
gcloud sql connect helpdesk-db --user=helpdesk-user
# Execute: SELECT count(*) FROM "Ticket";
```

### 13.4 Pipeline

- Faça um commit de teste em `main`
- Verifique que o Cloud Build executa todos os 5 stages
- Confirme que a nova versão está no ar, tanto no Cloud Run quanto no Firebase Hosting

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

**Sintoma:** o formulário de login exibe "Falha ao autenticar. Verifique sua conexão." — o sintoma genérico de uma chamada de API bloqueada por CORS no navegador.

**Causas prováveis:**
- `ALLOWED_ORIGIN` não está configurada ou tem o valor errado
- A URL do Firebase Hosting (`https://<PROJECT_ID>.web.app`) não corresponde ao valor em `ALLOWED_ORIGIN`

**Solução:**
```powershell
# Verifique o valor atual
gcloud run services describe helpdesk-backend --region=us-central1 `
  --format='yaml(spec.template.containers[0].env)'

# Atualize com a origem correta (sem a barra no final)
gcloud run services update helpdesk-backend `
  --region=us-central1 `
  --update-env-vars=ALLOWED_ORIGIN=https://<PROJECT_ID>.web.app
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
| `EMAIL_FROM`       | Cloud Run env   | Remetente dos e-mails; precisa ser verificado no SendGrid. Padrão do código: `helpdesk@naturaltec.com.br` |
| `FRONTEND_URL`     | Cloud Run env   | URL base do frontend (Firebase Hosting), usada nos links dos e-mails (`${FRONTEND_URL}/chamados/{id}`). Padrão do código: `http://localhost:5173` |
| `ALLOWED_ORIGIN`   | Cloud Run env   | Origem permitida para CORS — mesmo valor de `FRONTEND_URL`. Padrão do código: `*` |
| `GCS_BUCKET_NAME`  | Cloud Run env   | Bucket dos anexos de chamados; obrigatória para upload/remoção de anexos |

> Todas as variáveis de ambiente acima são definidas pelo pipeline em `cloudbuild.yaml`, via as substituições `_EMAIL_FROM`, `_FRONTEND_URL` e `_GCS_BUCKET_NAME` — ajuste-as lá (ou no trigger) para que o próximo build não sobrescreva alterações feitas manualmente com `gcloud run services update`.

> Os nomes precisam corresponder exatamente aos lidos pelo backend. Uma variável com nome errado não gera erro de deploy: o serviço sobe normalmente e usa o valor padrão do código, o que torna esse tipo de falha silenciosa.

---

🤖 Guia gerado como parte do OpenSpec change `docs-readme-deploy-gcp`.
