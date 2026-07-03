## Why

Chamados de suporte frequentemente precisam de evidências visuais ou documentos anexos (captura de tela de erro, relatório PDF, documento DOCX) para que a equipe técnica compreenda o problema sem necessidade de troca extra de mensagens. Hoje o solicitante só pode descrever o problema textualmente, o que limita a comunicação e atrasa o diagnóstico.

## What Changes

- Adicionar campo opcional de anexo (máximo 1 arquivo) ao formulário de abertura de chamado
- Armazenar arquivos no Google Cloud Storage com acesso público por URL
- Restringir tipos a JPG, PNG, PDF e DOCX, com tamanho máximo de 5 MB
- Permitir que o solicitante substitua ou remova o anexo após a abertura do chamado
- Exibir coluna dedicada de anexo na listagem de chamados (todos os perfis) com preview visual para imagens e ícone tipado para documentos
- Exibir o anexo em tamanho original na página de detalhes do chamado
- Alterar `POST /api/tickets` para aceitar `multipart/form-data` com campo de arquivo opcional
- Criar `PATCH /api/tickets/:id/anexo` (substituir) e `DELETE /api/tickets/:id/anexo` (remover) restritos ao solicitante dono do chamado
- Adicionar 4 campos opcionais ao model Ticket no Prisma: `anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho`
- Incluir documentação de setup do bucket GCS no console da GCP

## Non-goals

- Múltiplos anexos por chamado (limitado a 1)
- Anexos em mensagens/respostas do chamado
- Geração de thumbnails server-side (usa imagem original redimensionada via CSS)
- Compressão ou reprocessamento de imagens
- Armazenamento local como fallback para desenvolvimento
- Versionamento de anexos (substituir sobrescreve, sem histórico)

## Capabilities

### New Capabilities
- `ticket-attachments`: Upload, armazenamento (GCS), substituição, remoção e visualização de um anexo opcional por chamado, com validação de tipo e tamanho

### Modified Capabilities
- `ticket-creation`: Formulário e API de abertura passam a aceitar um arquivo opcional via multipart/form-data
- `ticket-query`: Listagem de chamados retorna dados de anexo e exibe coluna dedicada com preview
- `ticket-management`: Página de detalhes exibe anexo em tamanho original; solicitante pode gerenciar (substituir/remover) o anexo

## Impact

- **Prisma schema**: 4 novos campos opcionais em `Ticket` + nova migração
- **Backend deps**: `@fastify/multipart`, `@google-cloud/storage`
- **Backend routes**: `tickets.ts` — alteração do POST (multipart), 2 novos endpoints (PATCH/DELETE anexo), inclusão de campos de anexo em todos os GETs
- **Frontend pages**: `AbrirChamado.tsx`, `Chamados.tsx`, `DetalhesChamado.tsx`
- **Frontend API**: `tickets.ts` — alteração de `createTicket` para FormData
- **Infra/deploy**: Nova variável `GCS_BUCKET_NAME`, atualização do `cloudbuild.yaml`, documentação de criação de bucket
