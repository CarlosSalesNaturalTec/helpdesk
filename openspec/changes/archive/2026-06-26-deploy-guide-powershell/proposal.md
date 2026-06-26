## Why

O guia `docs/Deploy_GCP.md` foi escrito com comandos em shell Unix (bash), assumindo ambiente Linux/Mac. No Windows PowerShell 5.1 — ambiente padrão dos desenvolvedores que trabalham no projeto — comandos como `openssl`, `echo -n`, `export`, substituição `$()`, e `curl` falham ou têm comportamento diferente. O item 7.4 expõe o problema real: `openssl` não é reconhecido como cmdlet no PowerShell. Sem adaptação, o guia é inutilizável no Windows.

## What Changes

- Substituir TODOS os blocos de comando do `docs/Deploy_GCP.md` por equivalentes PowerShell 5.1 nativos, sem referência ao formato bash anterior
- Substituir `openssl rand -base64 32` por geração criptográfica via `System.Security.Cryptography.RNGCryptoServiceProvider` (.NET Framework 4.8)
- Substituir piping `echo -n \| cmd --data-file=-` por arquivo temporário com `[System.IO.File]::WriteAllText` + `--data-file=<path>` (evita problema de CRLF no stdin)
- Substituir continuação de linha `\` por `` ` `` (backtick) do PowerShell
- Substituir `export VAR=val`, `VAR=$(cmd)`, `curl`, `grep`, `sleep`, `./script` pelos equivalentes PowerShell
- Adaptar `VITE_API_URL=$URL npm run build` para `$env:VITE_API_URL = $URL; npm run build`
- Manter `gsutil` como está (funciona no Windows via Cloud SDK)
- Manter texto descritivo, placeholders `<>`, nomes de recursos e estrutura do documento intactos

## Capabilities

### New Capabilities

- `deploy-guide-powershell`: O guia de deploy (`docs/Deploy_GCP.md`) DEVE conter comandos compatíveis com PowerShell 5.1 no Windows, sem depender de ferramentas Unix (openssl, echo -n, export, bash substitutions). Todos os blocos de comando devem ser copiáveis e executáveis em um terminal PowerShell 5.1.

### Modified Capabilities

Nenhuma — a capability `deploy-gcp` original (do change `docs-readme-deploy-gcp`) não foi sincronizada para `openspec/specs/`. O comportamento do deploy em si não muda; apenas a sintaxe dos comandos documentados.

## Non-goals

- Criar versão dual bash/PowerShell lado a lado (o guia vira Windows-only)
- Alterar lógica de deploy, nomes de recursos GCP, ou flags dos comandos `gcloud`
- Substituir `gsutil` por `gcloud storage` (gsutil permanece)
- Testar comandos em ambiente real GCP (a verificação é sintática e estrutural)
- Adicionar suporte a PowerShell 7+ (`RandomNumberGenerator.GetBytes()` estático) — foco exclusivo no PS 5.1

## Impact

- **Documentação**: `docs/Deploy_GCP.md` — substituição de ~20 blocos de comando, adaptação de ~15 padrões sintáticos
- **Código, APIs, dependências**: Nenhum impacto — mudança restrita à documentação
