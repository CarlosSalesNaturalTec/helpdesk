## Context

O branding atual está espalhado como literais de string. Levantamento no código:

| Local | Ocorrências |
| --- | --- |
| `frontend/index.html:7` | `<title>` |
| `frontend/src/components/Layout.tsx:45` | `.nav-brand` |
| `frontend/src/pages/Login.tsx:71` | título do painel de login |
| `frontend/src/pages/Relatorios.tsx:60` | nome do arquivo baixado |
| `backend/src/services/email.ts` | 8 assinaturas (`linhas 55, 73, 88, 103, 121, 139, 155, 170`) |
| `backend/src/routes/reports.ts:24,32` | `Content-Disposition` e título do PDF |

O repositório já tem um padrão estabelecido para configuração por ambiente: variáveis lidas de `process.env` com fallback no backend (ver `email.ts:3-5`) e `import.meta.env` no frontend (`config.ts`), ambas injetadas via `substitutions` do `cloudbuild.yaml`. Esta change segue exatamente esse padrão.

## Goals / Non-Goals

**Goals:**
- Zero literais de branding fora dos dois módulos de configuração.
- Fallbacks embutidos, de modo que uma implantação sem as novas variáveis não quebre.
- Backend e frontend derivando o mesmo nome composto.

**Non-Goals:**
- Configuração em runtime, multi-tenancy, ou upload de branding pela UI.
- Alterar o `EMAIL_FROM` padrão (`helpdesk@naturaltec.com.br`) — é um endereço verificado no SendGrid e independe do nome exibido.

## Decisions

- **Duas variáveis, não uma.** `APP_NAME` e `CLIENT_NAME` são conceitos distintos: a aplicação é vendida como SOLUTUS e o cliente muda. Uma única string obrigaria a reescrever tudo a cada cliente novo, que é justamente o problema atual.
- **Nome composto centralizado.** Cada lado expõe `appName`, `clientName` e `fullName` (`` `${appName} — ${clientName}` ``, ou apenas `appName` quando `clientName` estiver vazio). Assim um deploy sem cliente definido não exibe um travessão órfão.
- **Título do HTML via substituição do Vite.** O Vite substitui `%VITE_APP_NAME%` em `index.html` no build, sem plugin adicional e sem *flash* de título no carregamento — preferível a definir `document.title` em runtime.
- **Prefixo `VITE_` no frontend, sem prefixo no backend.** O frontend precisa de `VITE_APP_NAME` / `VITE_CLIENT_NAME` (exigência do Vite); o backend lê `APP_NAME` / `CLIENT_NAME`. O `cloudbuild.yaml` alimenta ambos a partir das mesmas substitutions `_APP_NAME` / `_CLIENT_NAME`, evitando divergência entre as camadas.
- **Nome de arquivo derivado, não literal.** `relatorio_helpdesk_instituto_setes.pdf` passa a ser gerado por *slugify* do nome composto (minúsculas, sem acentos, espaços → `_`), mantendo backend e frontend consistentes.

## Risks / Trade-offs

- **[Risco] Divergência entre o nome do backend e o do frontend** (build do frontend e deploy do Cloud Run são etapas separadas do pipeline).
  - *Mitigação*: uma única substitution por variável no `cloudbuild.yaml`, consumida pelas duas etapas.
- **[Risco] Trocar o nome exige rebuild do frontend**, já que é substituição em tempo de build.
  - *Trade-off aceito*: trocar de cliente é evento raro e já implica novo deploy (bucket, CORS, e-mail remetente).
- **[Risco] Textos residuais fora da varredura** (documentos em `docs/`, seed, README).
  - *Mitigação*: `grep -rin "instituto setes\|helpdesk instituto"` como verificação final da tarefa.
