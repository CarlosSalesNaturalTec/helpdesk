## ADDED Requirements

### Requirement: Comandos PowerShell 5.1 copiáveis
Todos os blocos de comando em `docs/Deploy_GCP.md` DEVEM ser compatíveis com PowerShell 5.1 (Windows), sem dependência de ferramentas Unix externas (openssl, echo -n, export, bash substitutions). O texto descritivo, placeholders `<>`, nomes de recursos GCP e estrutura de seções permanecem inalterados.

#### Scenario: Geração de JWT Secret sem openssl
- **WHEN** o desenvolvedor executa o bloco de comandos da Seção 7 (Secret Manager) em um terminal PowerShell 5.1
- **THEN** o JWT secret é gerado usando classes nativas do .NET Framework 4.8 (`System.Security.Cryptography.RNGCryptoServiceProvider`), sem chamar `openssl`, e armazenado corretamente no Secret Manager via `gcloud secrets create`

#### Scenario: Criação de secrets sem echo -n e pipe
- **WHEN** o desenvolvedor cria secrets no Secret Manager (Seção 7)
- **THEN** strings sensíveis são gravadas em arquivo temporário via `[System.IO.File]::WriteAllText` (sem BOM, sem newline extra), consumidas com `--data-file=<path>`, e o arquivo temporário é removido em seguida

#### Scenario: Continuação de linha compatível
- **WHEN** o desenvolvedor copia qualquer comando multi-linha do guia
- **THEN** a continuação de linha usa backtick `` ` `` (PowerShell), não backslash `\` (bash)

#### Scenario: Variáveis de ambiente e substituição
- **WHEN** comandos do guia definem ou leem variáveis de ambiente (Seções 7, 10, 11, 12)
- **THEN** `export VAR=val` é substituído por `$env:VAR = "val"`, e `VAR=$(comando)` por `$VAR = (comando)`, com expansão via `$VAR` dentro de strings com aspas duplas

#### Scenario: Chamadas HTTP com Invoke-RestMethod
- **WHEN** o guia faz chamadas HTTP de verificação (Seções 9, 13, 14)
- **THEN** `curl` é substituído por `Invoke-RestMethod` com parâmetros `-Uri`, `-Method`, `-Headers`, `-Body` no formato PowerShell

#### Scenario: Comandos de sistema operacional
- **WHEN** o guia usa comandos de sistema (Seções 4, 10, 14)
- **THEN** `grep` é substituído por `Select-String`, `sleep N` por `Start-Sleep -Seconds N`, `./script` por `.\script.exe`, e processos em background usam `Start-Process`

#### Scenario: Build do frontend com variável de ambiente
- **WHEN** o desenvolvedor faz o build do frontend (Seção 11)
- **THEN** a definição de `VITE_API_URL` e execução do build ocorrem em linhas separadas com `;` — `$env:VITE_API_URL = $URL; npm run build --workspace=frontend` — em vez de inline `VAR=val comando`

#### Scenario: gsutil mantido
- **WHEN** comandos de Cloud Storage aparecem no guia (Seção 11)
- **THEN** `gsutil` é mantido como está (funciona via Cloud SDK no Windows), sem substituição por `gcloud storage`

### Requirement: Estrutura do documento preservada
A substituição de comandos NÃO DEVE alterar: estrutura de seções (14 seções), títulos, texto descritivo, diagrama ASCII, tabela de custos, placeholders `<>`, nomes de recursos GCP, notas e observações.

#### Scenario: Verificação estrutural pós-edição
- **WHEN** a edição é concluída
- **THEN** o documento mantém as 14 seções na mesma ordem, o mesmo número de blocos de código (apenas conteúdo interno alterado), e todos os placeholders `<>` permanecem inalterados
