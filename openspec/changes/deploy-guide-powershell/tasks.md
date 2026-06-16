## Tasks: deploy-guide-powershell

Cada task é uma substituição atômica de bloco(s) de comando em `docs/Deploy_GCP.md`.

---

### 1. Adaptar Seção 2 (Pré-requisitos) e Seção 4 (Passo 1)

**Seção 2:** Comandos `gcloud auth login` e `gcloud config set` são single-line compatíveis — manter.

**Seção 4:** Substituir:
- Continuação `\` por `` ` `` no `gcloud services enable` (8 APIs)
- `| grep` por `| Select-String` na verificação

---

### 2. Adaptar Seção 5 (Passo 2: Cloud SQL)

Substituir 3 blocos:
- `gcloud sql instances create` — 8 flags com `\` → `` ` ``
- `gcloud sql databases create` — single-line, manter
- `gcloud sql users create` — 3 flags com `\` → `` ` ``

---

### 3. Adaptar Seção 6 (Passo 3: Artifact Registry)

Substituir 2 blocos:
- `gcloud artifacts repositories create` — 4 flags com `\` → `` ` ``
- `gcloud auth configure-docker` — single-line, manter

---

### 4. Adaptar Seção 7 (Passo 4: Secret Manager) ⚠️ Critical

Substituir 7 blocos:
- 3 secrets creation: `echo -n \|` → `[System.IO.File]::WriteAllText` + `--data-file=` + `Remove-Item`
- JWT secret: `openssl rand -base64 32` → `RNGCryptoServiceProvider` + `[Convert]::ToBase64String`
- `PROJECT_NUMBER=$(...)` → `$PROJECT_NUMBER = (...)`
- 4 IAM bindings: `"${PROJECT_NUMBER}"` → `"$PROJECT_NUMBER"`, `\` → `` ` ``

---

### 5. Adaptar Seção 8 (Passo 5: Docker) e Seção 9 (Passo 6: Cloud Run)

**Seção 8:** Comandos `docker build` e `docker push` — manter (single-line).

**Seção 9:** Substituir:
- `gcloud run deploy` — 15 flags com `\` → `` ` `` (ou single-line)
- `gcloud run services describe` — single-line, manter
- `curl` → `Invoke-RestMethod -Uri ... -Method Get`

---

### 6. Adaptar Seção 10 (Passo 7: Migrations)

Substituir ambas as opções (A e B):
- `./cloud-sql-proxy` → `.\cloud-sql-proxy.exe`
- `export DATABASE_URL=...` → `$env:DATABASE_URL = "..."`
- `gcloud run jobs create` — `\` → `` ` ``
- `npx` comandos mantidos

---

### 7. Adaptar Seção 11 (Passo 8: Frontend Cloud Storage)

Substituir 7+ blocos:
- `gcloud storage buckets` — `\` → `` ` ``
- `CLOUD_RUN_URL=$(...)` → `$CLOUD_RUN_URL = (...)`
- `VITE_API_URL=$CLOUD_RUN_URL npm run build` → `$env:VITE_API_URL = $CLOUD_RUN_URL; npm run build --workspace=frontend`
- `gsutil` mantido como está
- `gcloud run services update` — `\` → `` ` ``

---

### 8. Adaptar Seção 12 (Passo 9: Cloud Build Trigger)

Substituir ~10 blocos:
- `PROJECT_NUMBER=...` → `$PROJECT_NUMBER = ...`
- `CLOUD_BUILD_SA=...` → `$CLOUD_BUILD_SA = ...`
- `"$CLOUD_BUILD_SA"` → mantido (PS expande)
- `\` → `` ` `` em todos os `gcloud projects add-iam-policy-binding`
- Trigger creation (8+ flags) — `\` → `` ` ``

---

### 9. Adaptar Seção 13 (Passo 10: Verificação)

Substituir 2 blocos `curl`:
- `curl` → `Invoke-RestMethod -Uri ... -Method Get`
- `curl -X POST -H ... -d '...'` → `Invoke-RestMethod -Uri ... -Method Post -Headers @{...} -Body '...'`

---

### 10. Adaptar Seção 14 (Troubleshooting)

Substituir ~10 blocos:
- `./cloud-sql-proxy` → `.\cloud-sql-proxy.exe`
- `sleep 2` → `Start-Sleep -Seconds 2`
- `cmd &` (background) → `Start-Process cmd`
- `curl` → `Invoke-RestMethod`
- `$(...)` → `$(...)` mantido (subexpressão é igual no PS)
- `\` → `` ` ``

---

### 11. Verificação final

Validar:
- Nenhum `openssl`, `echo -n`, `export `, `curl `, `./cloud-sql-proxy`, `sleep `, ` &` residual nos blocos de código
- Nenhum `\` de continuação residual (só aparece em paths Windows `C:\...` que não estão no documento)
- Todos os placeholders `<>` preservados
- Estrutura de 14 seções mantida
- Número de blocos de código idêntico ao original
