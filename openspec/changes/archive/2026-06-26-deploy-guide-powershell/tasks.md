## Tasks: deploy-guide-powershell

Cada task é uma substituição atômica de bloco(s) de comando em `docs/Deploy_GCP.md`.

---

- [x] 1. Adaptar Seção 2 (Pré-requisitos) e Seção 4 (Passo 1): `bash` → `powershell` nos blocos de código, `\` → `` ` `` no `gcloud services enable`, `| grep` → `| Select-String`
- [x] 2. Adaptar Seção 5 (Passo 2: Cloud SQL): `\` → `` ` `` nos blocos `gcloud sql instances create` e `gcloud sql users create`
- [x] 3. Adaptar Seção 6 (Passo 3: Artifact Registry): `\` → `` ` `` no `gcloud artifacts repositories create`
- [x] 4. Adaptar Seção 7 (Passo 4: Secret Manager) ⚠️ Critical: `echo -n \|` → `[System.IO.File]::WriteAllText` + `--data-file=`; `openssl rand -base64 32` → `RNGCryptoServiceProvider`; `PROJECT_NUMBER=$(...)` → `$PROJECT_NUMBER = (...)`; `"${PROJECT_NUMBER}"` → `"$PROJECT_NUMBER"`; `\` → `` ` ``
- [x] 5. Adaptar Seção 8 (Passo 5: Docker) e Seção 9 (Passo 6: Cloud Run): `\` → `` ` `` no `gcloud run deploy`; `curl` → `Invoke-RestMethod`
- [x] 6. Adaptar Seção 10 (Passo 7: Migrations): `./cloud-sql-proxy` → `.\cloud-sql-proxy.exe`; `export` → `$env:`; `\` → `` ` ``
- [x] 7. Adaptar Seção 11 (Passo 8: Frontend): `CLOUD_RUN_URL=$(...)` → `$CLOUD_RUN_URL = (...)`; `VITE_API_URL=$VAR npm run build` → `$env:VITE_API_URL = $VAR; npm run build`; `\` → `` ` ``; manter `gsutil`
- [x] 8. Adaptar Seção 12 (Passo 9: Cloud Build): `PROJECT_NUMBER=$(...)` → `$PROJECT_NUMBER = (...)`; `CLOUD_BUILD_SA="serviceAccount:${...}"` → `$CLOUD_BUILD_SA = "serviceAccount:$..."; `\` → `` ` ``
- [x] 9. Adaptar Seção 13 (Passo 10: Verificação): `curl` → `Invoke-RestMethod`
- [x] 10. Adaptar Seção 14 (Troubleshooting): `./cloud-sql-proxy` → `.\cloud-sql-proxy.exe`; `sleep N` → `Start-Sleep -Seconds N`; `cmd &` → `Start-Process cmd`; `curl` → `Invoke-RestMethod`; `\` → `` ` ``
- [x] 11. Verificação final: nenhum `openssl`, `echo -n`, `export `, `curl `, `./cloud-sql-proxy`, `sleep ` residual; placeholders `<>` preservados; 14 seções mantidas
