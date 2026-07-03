## 1. Database e Schema

- [x] 1.1 Adicionar campos `anexoUrl` (String?), `anexoNome` (String?), `anexoTipo` (String?) e `anexoTamanho` (Int?) ao model Ticket no `prisma/schema.prisma`
- [x] 1.2 Gerar e aplicar migração Prisma (`npx prisma migrate dev --name add-ticket-attachments`)

## 2. Backend — Dependências e Configuração GCS

- [x] 2.1 Instalar `@fastify/multipart` e `@google-cloud/storage` no workspace backend
- [x] 2.2 Criar módulo `backend/src/lib/storage.ts` com funções: `uploadFile(bucket, path, buffer, mimeType)` → URL pública, `deleteFile(bucket, path)`, inicialização do client GCS via Application Default Credentials
- [x] 2.3 Criar constantes de validação de anexo em `backend/src/lib/attachment.ts`: tipos MIME permitidos, tamanho máximo (5MB), função `validateAttachment(file)` que retorna erro ou metadados válidos

## 3. Backend — Alterar Criação de Chamado (multipart)

- [x] 3.1 Registrar plugin `@fastify/multipart` no Fastify com `limits.fileSize: 5 * 1024 * 1024` em `backend/src/index.ts`
- [x] 3.2 Alterar `POST /api/tickets` em `backend/src/routes/tickets.ts` para processar `multipart/form-data`: extrair campos de texto + arquivo opcional, validar campos via Zod, validar arquivo (tipo/tamanho), fazer upload ao GCS, salvar ticket com campos de anexo

## 4. Backend — Endpoints de Gerenciamento de Anexo

- [x] 4.1 Implementar `PATCH /api/tickets/:id/anexo` — substituir anexo: verificar que o user é o solicitante, validar novo arquivo, deletar arquivo antigo do GCS, fazer upload do novo, atualizar campos no banco
- [x] 4.2 Implementar `DELETE /api/tickets/:id/anexo` — remover anexo: verificar que o user é o solicitante, deletar arquivo do GCS, setar campos de anexo como null no banco
- [x] 4.3 Verificar que os endpoints GET existentes (listagem e detalhes) já retornam os novos campos de anexo nos selects do Prisma (adicionar ao `select` se necessário)

## 5. Frontend — API Client

- [x] 5.1 Alterar `createTicket` em `frontend/src/api/tickets.ts` para enviar `FormData` em vez de JSON, incluindo campo de arquivo opcional
- [x] 5.2 Adicionar funções `replaceAttachment(ticketId, file)` e `removeAttachment(ticketId)` em `frontend/src/api/tickets.ts`
- [x] 5.3 Atualizar interface `Ticket` em `frontend/src/api/tickets.ts` com campos `anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho`

## 6. Frontend — Formulário de Abertura de Chamado

- [x] 6.1 Adicionar input de arquivo em `frontend/src/pages/AbrirChamado.tsx` com `accept=".jpg,.jpeg,.png,.pdf,.docx"`, estilizado como área de drop/seleção com preview do arquivo selecionado
- [x] 6.2 Implementar validação no frontend (tipo e tamanho) antes do submit com feedback visual de erro
- [x] 6.3 Alterar `handleSubmit` para construir `FormData` com todos os campos + arquivo e enviar via `createTicket` atualizado

## 7. Frontend — Listagem de Chamados

- [x] 7.1 Adicionar coluna "Anexo" na tabela em `frontend/src/pages/Chamados.tsx` com ícone de imagem (🖼️) para JPG/PNG, ícone de documento (📄) para PDF/DOCX, e traço (—) para sem anexo
- [x] 7.2 Tornar ícones clicáveis — abrir o arquivo em nova aba ao clicar

## 8. Frontend — Detalhes do Chamado

- [x] 8.1 Adicionar seção de anexo em `frontend/src/pages/DetalhesChamado.tsx`: imagens renderizadas inline (max-width responsivo), PDFs com link "Abrir PDF" (nova aba), DOCX com link "Baixar Documento"
- [x] 8.2 Exibir botões "Substituir Anexo" e "Remover Anexo" apenas quando o usuário logado é o solicitante do chamado, com modal de confirmação para remoção
- [x] 8.3 Implementar fluxo de substituição (input file + upload via `replaceAttachment`) e remoção (confirmação + chamada `removeAttachment`) com invalidação de queries

## 9. Infra e Documentação

- [x] 9.1 Adicionar variável `GCS_BUCKET_NAME` ao `backend/.env.example` com comentários explicando que requer ADC e IAM roles (Storage Object Admin)
- [x] 9.2 Atualizar `cloudbuild.yaml` para passar `GCS_BUCKET_NAME` como variável de ambiente ao Cloud Run
- [x] 9.3 Criar documentação `docs/gcs-bucket-setup.md` com checklist de criação do bucket no console GCP (nome, região, uniform access, permissão allUsers/Storage Object Viewer, configuração CORS, papel Storage Object Admin para o service account do Cloud Run)
