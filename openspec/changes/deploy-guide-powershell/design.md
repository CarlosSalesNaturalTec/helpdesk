## Design: Adaptação PowerShell 5.1 do Deploy_GCP.md

### Tabela de tradução sintática

Toda substituição segue esta tabela. Padrões são aplicados mecanicamente a cada bloco de comando do documento.

| # | Padrão Unix/Bash | PowerShell 5.1 | Seções afetadas |
|---|---|---|---|
| 1 | `openssl rand -base64 32` | `$jwtBytes = [byte[]]::new(32); (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($jwtBytes); $jwtSecret = [Convert]::ToBase64String($jwtBytes)` | 7 |
| 2 | `` echo -n "str" \| cmd --data-file=- `` | `[System.IO.File]::WriteAllText("$env:TEMP\f.txt", "str"); cmd --data-file="$env:TEMP\f.txt"; Remove-Item "$env:TEMP\f.txt"` | 7 |
| 3 | `comando \` (continuação) | `` comando ` `` (backtick) | 4, 5, 6, 7, 9, 10, 11, 12 |
| 4 | `export VAR=val` | `$env:VAR = "val"` | 10 |
| 5 | `VAR=$(comando)` | `$VAR = (comando)` | 7, 11, 12, 14 |
| 6 | `$VAR` em string | `$VAR` (PS expande em `"..."`) | 7, 11, 12 |
| 7 | `\| grep pattern` | `\| Select-String pattern` | 4 |
| 8 | `curl -X POST url -H ... -d '...'` | `Invoke-RestMethod -Uri url -Method Post -Headers @{...} -Body '...'` | 9, 13, 14 |
| 9 | `./cloud-sql-proxy` | `.\cloud-sql-proxy.exe` | 10, 14 |
| 10 | `sleep N` | `Start-Sleep -Seconds N` | 14 |
| 11 | `cmd &` (background) | `Start-Process cmd` | 14 |
| 12 | `VAR=val comando` (inline env) | `$env:VAR = "val"; comando` | 11 |
| 13 | `psql` | `psql` (mantido, requer PostgreSQL instalado) | 14 |
| 14 | `gsutil` | `gsutil` (mantido, requer Cloud SDK) | 11 |
| 15 | `gcloud ... \| gcloud secrets create --data-file=-` | Sempre usa arquivo temp intermediário em vez de pipe | 7 |

### Decisões de design

**D1: Arquivo temporário em vez de pipe para secrets.** PowerShell 5.1 adiciona `\r\n` ao pipe e não tem equivalente confiável ao `echo -n`. Usar `[System.IO.File]::WriteAllText` + `--data-file=<path>` garante conteúdo exato, sem newline parasita. Arquivo é removido após uso.

**D2: `[System.IO.File]::WriteAllText` em vez de `Set-Content -NoNewline`.** Ambos funcionam no PS 5.1, mas `WriteAllText`:
- Não adiciona BOM (ao contrário de `Set-Content` que pode adicionar dependendo da configuração)
- É explícito sobre encoding (UTF-8 sem BOM)
- Comportamento determinístico cross-platform dentro do .NET

**D3: RNGCryptoServiceProvider em vez de RandomNumberGenerator.GetBytes().** PS 5.1 roda em .NET Framework 4.8, onde `RandomNumberGenerator` não tem método estático `GetBytes()`. `RNGCryptoServiceProvider` é a API correta para este runtime.

**D4: Backtick para continuação de linha.** Fragilidade conhecida (espaço após backtick quebra), mas é o mecanismo nativo do PS. Alternativa (splatting com `@params`) seria mais robusta mas descaracterizaria o formato `gcloud` que o usuário copia e cola. Mantemos backtick com nota de atenção.

**D5: `Invoke-RestMethod` em vez de `curl.exe`.** `Invoke-RestMethod` é nativo do PS, trata JSON automaticamente (desserializa), e evita dependência de curl instalado. A sintaxe é idiomática para PowerShell.

### Abordagem de edição

Edição cirúrgica bloco a bloco, de cima para baixo, sem reescrever o documento. Cada bloco de código é substituído atomicamente. Nenhum texto fora de blocos de código é alterado.
