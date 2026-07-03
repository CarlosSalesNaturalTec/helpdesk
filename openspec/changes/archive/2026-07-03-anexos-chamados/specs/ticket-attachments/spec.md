# Spec: Anexos de Chamados (ticket-attachments)

Upload, armazenamento, substituição, remoção e visualização de um anexo opcional por chamado, com validação de tipo e tamanho, armazenado no Google Cloud Storage.

## Purpose

Permitir que solicitantes anexem evidências visuais ou documentais aos chamados para agilizar o diagnóstico pela equipe técnica.

## Requirements

### Requirement: Upload opcional de anexo na abertura do chamado
O sistema SHALL permitir que o Solicitante anexe opcionalmente um arquivo ao abrir um chamado. O anexo DEVE ser enviado junto com os demais dados do chamado em uma única requisição. O chamado DEVE ser criado normalmente caso nenhum anexo seja fornecido.

#### Scenario: Abertura com anexo
- **WHEN** um Solicitante preenche o formulário de abertura com todos os campos obrigatórios e seleciona um arquivo válido
- **THEN** o chamado é criado com status "Aberto" e o anexo é armazenado no Google Cloud Storage, com a URL pública e metadados salvos no chamado

#### Scenario: Abertura sem anexo
- **WHEN** um Solicitante preenche o formulário de abertura sem selecionar nenhum arquivo
- **THEN** o chamado é criado normalmente sem anexo, com os campos de anexo nulos

### Requirement: Restrição de tipos de arquivo permitidos
O sistema SHALL aceitar apenas arquivos dos tipos: JPEG (image/jpeg), PNG (image/png), PDF (application/pdf) e DOCX (application/vnd.openxmlformats-officedocument.wordprocessingml.document). Qualquer outro tipo DEVE ser rejeitado com mensagem de erro clara.

#### Scenario: Arquivo com tipo permitido
- **WHEN** o Solicitante seleciona um arquivo PNG de 2 MB
- **THEN** o arquivo é aceito e processado normalmente

#### Scenario: Arquivo com tipo não permitido
- **WHEN** o Solicitante seleciona um arquivo .exe ou .zip
- **THEN** o sistema rejeita o arquivo com a mensagem "Tipo de arquivo não permitido. Tipos aceitos: JPG, PNG, PDF, DOCX"

### Requirement: Tamanho máximo de 5 MB por anexo
O sistema SHALL rejeitar arquivos que excedam 5 MB de tamanho. A validação DEVE ocorrer tanto no frontend (antes do envio) quanto no backend (antes do armazenamento).

#### Scenario: Arquivo dentro do limite
- **WHEN** o Solicitante seleciona um arquivo de 4.5 MB
- **THEN** o arquivo é aceito e processado normalmente

#### Scenario: Arquivo excede o limite
- **WHEN** o Solicitante seleciona um arquivo de 6 MB
- **THEN** o sistema rejeita com a mensagem "O arquivo excede o tamanho máximo de 5 MB"

### Requirement: Máximo de 1 anexo por chamado
O sistema SHALL permitir no máximo um anexo por chamado. O formulário de abertura NÃO DEVE permitir seleção de múltiplos arquivos.

#### Scenario: Tentativa de selecionar múltiplos arquivos
- **WHEN** o Solicitante tenta selecionar mais de um arquivo no input de anexo
- **THEN** apenas o último arquivo selecionado é considerado

### Requirement: Substituição de anexo pelo solicitante
O sistema SHALL permitir que o Solicitante (criador do chamado) substitua o anexo existente por um novo arquivo via `PATCH /api/tickets/:id/anexo`. O arquivo antigo DEVE ser deletado do Google Cloud Storage antes do upload do novo.

#### Scenario: Substituição com sucesso
- **WHEN** o Solicitante do chamado #42 envia um novo arquivo via PATCH
- **THEN** o arquivo antigo é removido do GCS, o novo arquivo é armazenado, e os metadados do anexo são atualizados no banco

#### Scenario: Substituição por não-solicitante
- **WHEN** um Técnico ou Gestor tenta substituir o anexo de um chamado
- **THEN** o sistema retorna erro 403 "Apenas o solicitante pode alterar o anexo"

### Requirement: Remoção de anexo pelo solicitante
O sistema SHALL permitir que o Solicitante (criador do chamado) remova o anexo via `DELETE /api/tickets/:id/anexo`. O arquivo DEVE ser deletado do Google Cloud Storage e os campos de anexo DEVEM ser limpos no banco.

#### Scenario: Remoção com sucesso
- **WHEN** o Solicitante do chamado #42 envia DELETE para remover o anexo
- **THEN** o arquivo é removido do GCS e os campos `anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho` são setados como null

#### Scenario: Remoção de chamado sem anexo
- **WHEN** o Solicitante tenta remover o anexo de um chamado que não possui anexo
- **THEN** o sistema retorna erro 404 "Este chamado não possui anexo"

### Requirement: Armazenamento no Google Cloud Storage com acesso público
O sistema SHALL armazenar os arquivos no Google Cloud Storage sob o path `tickets/{ticketId}/{uuid}-{nomeOriginal}`. Cada arquivo armazenado DEVE ser tornado público individualmente via `makePublic()`, permitindo que qualquer pessoa com a URL acesse o arquivo diretamente.

#### Scenario: Arquivo armazenado com URL pública
- **WHEN** um anexo "relatorio.pdf" é enviado para o chamado #42
- **THEN** o arquivo é salvo no GCS em `tickets/42/{uuid}-relatorio.pdf` e a URL pública `https://storage.googleapis.com/{bucket}/tickets/42/{uuid}-relatorio.pdf` é salva no campo `anexoUrl`

### Requirement: Visualização de anexo na listagem de chamados
O sistema SHALL exibir uma coluna dedicada "Anexo" na tabela de listagem de chamados para todos os perfis de usuário. Para imagens (JPG/PNG), a coluna DEVE exibir um ícone de imagem clicável. Para documentos (PDF/DOCX), a coluna DEVE exibir um ícone de documento clicável. Para chamados sem anexo, a coluna DEVE exibir um traço (—).

#### Scenario: Chamado com anexo de imagem na lista
- **WHEN** um chamado com anexo JPG aparece na listagem
- **THEN** a coluna "Anexo" exibe um ícone de imagem que ao ser clicado abre a imagem em nova aba

#### Scenario: Chamado com anexo de documento na lista
- **WHEN** um chamado com anexo PDF aparece na listagem
- **THEN** a coluna "Anexo" exibe um ícone de documento que ao ser clicado abre/baixa o documento

#### Scenario: Chamado sem anexo na lista
- **WHEN** um chamado sem anexo aparece na listagem
- **THEN** a coluna "Anexo" exibe "—"

### Requirement: Visualização em tamanho original nos detalhes do chamado
O sistema SHALL exibir o anexo em tamanho original na página de detalhes do chamado. Para imagens (JPG/PNG), o sistema DEVE renderizar a imagem inline com largura máxima responsiva. Para PDF, o sistema DEVE disponibilizar link para abrir em nova aba. Para DOCX, o sistema DEVE disponibilizar link para download.

#### Scenario: Imagem exibida nos detalhes
- **WHEN** um usuário acessa os detalhes de um chamado com anexo PNG
- **THEN** a imagem é exibida inline em tamanho original (com max-width responsivo) na seção de informações do chamado

#### Scenario: PDF exibido nos detalhes
- **WHEN** um usuário acessa os detalhes de um chamado com anexo PDF
- **THEN** um link "Abrir PDF" é exibido que abre o documento em nova aba do navegador

#### Scenario: DOCX exibido nos detalhes
- **WHEN** um usuário acessa os detalhes de um chamado com anexo DOCX
- **THEN** um link "Baixar Documento" é exibido que inicia o download do arquivo

#### Scenario: Solicitante vê botões de gerenciamento
- **WHEN** o Solicitante (criador do chamado) acessa os detalhes do seu chamado com anexo
- **THEN** além da visualização, são exibidos botões "Substituir Anexo" e "Remover Anexo"

#### Scenario: Outros perfis não veem botões de gerenciamento
- **WHEN** um Técnico, Gestor, Diretor ou Admin acessa os detalhes de um chamado com anexo
- **THEN** o anexo é exibido para visualização, sem botões de substituição ou remoção

### Requirement: Retorno de dados de anexo nas APIs de consulta
A API de chamados SHALL retornar os campos de anexo (`anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho`) nas respostas de listagem (`GET /api/tickets`) e detalhes (`GET /api/tickets/:id`) quando o chamado possuir anexo.

#### Scenario: Listagem retorna dados de anexo
- **WHEN** o frontend consulta `GET /api/tickets`
- **THEN** cada ticket no array inclui os campos `anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho` (ou null se sem anexo)

#### Scenario: Detalhes retorna dados de anexo
- **WHEN** o frontend consulta `GET /api/tickets/:id`
- **THEN** o payload inclui os campos `anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho`
