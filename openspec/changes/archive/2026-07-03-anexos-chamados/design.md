## Context

O HelpDesk é um sistema de chamados para um Instituto com múltiplas Unidades. Atualmente, chamados são criados via `POST /api/tickets` com payload JSON contendo campos de texto (título, descrição, setor, tipo de problema, urgência). Não há suporte a upload de arquivos. O backend usa Fastify sem plugin multipart, e o frontend envia dados via Axios com `Content-Type: application/json`. O sistema roda em GCP Cloud Run com PostgreSQL no Cloud SQL.

## Goals / Non-Goals

**Goals:**
- Permitir upload de um anexo opcional por chamado, armazenado no Google Cloud Storage
- Fornecer endpoints para substituição e remoção do anexo pelo solicitante
- Exibir preview de anexos na listagem e visualização completa nos detalhes
- Manter compatibilidade com o fluxo existente (chamados sem anexo continuam funcionando)

**Non-Goals:**
- Múltiplos anexos por chamado
- Anexos em mensagens/respostas
- Thumbnails gerados server-side
- Fallback de armazenamento local para desenvolvimento
- Versionamento ou histórico de alterações do anexo

## Decisions

### D1: Campos diretos no model Ticket (não tabela separada)

**Escolha**: Adicionar 4 campos opcionais (`anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho`) direto no model `Ticket`.

**Alternativa descartada**: Tabela `Anexo` separada com relação 1:1.

**Rationale**: Com limite de 1 anexo por chamado, uma tabela separada adiciona complexidade desnecessária (JOIN extra, migração mais pesada). Se no futuro for necessário suportar múltiplos anexos, a migração para tabela separada é simples.

### D2: Upload via multipart/form-data no endpoint existente

**Escolha**: Alterar `POST /api/tickets` para aceitar `multipart/form-data` com campos de texto + campo de arquivo opcional (`anexo`). Usar `@fastify/multipart` para parsing.

**Alternativa descartada**: Endpoint separado de upload (POST /api/tickets/:id/anexo) executado após criação — introduziria estado intermediário (ticket criado sem anexo que deveria ter).

**Rationale**: Operação atômica — o chamado é criado com seu anexo em uma única requisição. Simplifica o tratamento de erro (se o upload falhar, o chamado não é criado).

### D3: Google Cloud Storage com objetos públicos individuais

**Escolha**: Usar `@google-cloud/storage` SDK. Após upload, chamar `file.makePublic()` para tornar cada objeto acessível via URL pública. Estrutura: `gs://{bucket}/tickets/{ticketId}/{uuid}-{nomeOriginal}`.

**Alternativa descartada**: Signed URLs com expiração — adiciona complexidade de renovação de URLs e o requisito é acesso público.

**Rationale**: O requisito é "qualquer pessoa com a URL pode ver". Objetos públicos individuais são a abordagem mais simples e direta. O UUID no path previne enumeração.

### D4: Validação dupla (frontend + backend)

**Escolha**: Validar tipo MIME e tamanho tanto no frontend (antes do envio) quanto no backend (antes do upload ao GCS).

**Frontend**: Atributo `accept` no input file + verificação de `file.size` antes do submit.

**Backend**: Verificar MIME type do buffer recebido + tamanho do stream. Tipos permitidos: `image/jpeg`, `image/png`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

**Rationale**: Nunca confiar apenas no frontend para validação de segurança. A validação do frontend melhora UX (feedback imediato).

### D5: Permissão de gerenciamento restrita ao solicitante

**Escolha**: Apenas o solicitante (criador do chamado) pode anexar (na criação), substituir (`PATCH /api/tickets/:id/anexo`) ou remover (`DELETE /api/tickets/:id/anexo`). Todos os outros perfis podem visualizar.

**Rationale**: O anexo é evidência fornecida pelo solicitante. Técnicos e gestores não devem alterar a evidência do solicitante.

### D6: Autenticação GCS via Application Default Credentials

**Escolha**: Em Cloud Run, usar as credenciais do service account automaticamente providas pelo ambiente (ADC). Não armazenar chaves de API como variáveis de ambiente.

**Rationale**: É o padrão recomendado pelo GCP. O service account do Cloud Run precisa apenas do papel `Storage Object Admin` no bucket de anexos.

### D7: Deleção no GCS ao substituir ou remover

**Escolha**: Ao substituir um anexo, deletar o arquivo antigo do GCS antes de fazer upload do novo. Ao remover, deletar do GCS e limpar os 4 campos no banco.

**Rationale**: Evitar acúmulo de arquivos órfãos no bucket.

## Risks / Trade-offs

- **[Upload falha após criação do ticket]** → O endpoint de criação faz upload ao GCS antes de salvar no banco. Se o GCS falhar, o ticket não é criado e o erro é retornado. Se o banco falhar após upload ao GCS, haverá um arquivo órfão — risco aceitável dado o volume baixo.

- **[Tamanho do payload em Cloud Run]** → Cloud Run aceita até 32 MB por request por padrão. Com limite de 5 MB no anexo, não há risco. O `@fastify/multipart` será configurado com `limits.fileSize: 5 * 1024 * 1024`.

- **[Acesso público ao bucket]** → Arquivos ficam acessíveis a qualquer pessoa com a URL. O UUID no path previne enumeração, mas não impede acesso se a URL for compartilhada. Risco aceito pelo requisito explícito.

- **[Mudança de Content-Type no POST /api/tickets]** → O frontend precisa mudar de JSON para FormData. Isso é uma mudança **BREAKING** no contrato da API para qualquer consumidor externo que use JSON. Mitigação: não há consumidores externos conhecidos.

## Migration Plan

1. Criar bucket GCS manualmente no console GCP (documentado)
2. Aplicar migração Prisma (4 campos nullable — sem impacto em dados existentes)
3. Instalar dependências no backend (`@fastify/multipart`, `@google-cloud/storage`)
4. Deploy: adicionar `GCS_BUCKET_NAME` como variável de ambiente no Cloud Run
5. Rollback: campos são opcionais, remover código de upload não afeta chamados existentes

## Open Questions

Nenhuma — todas as decisões foram alinhadas com o usuário durante a fase de exploração.
