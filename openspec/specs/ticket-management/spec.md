# Delta Spec: ticket-management

## ADDED Requirements

### Requirement: Coluna dedicada de anexo na listagem de chamados
O sistema SHALL exibir uma coluna dedicada "Anexo" na tabela de listagem de chamados para todos os perfis de usuário. Para imagens (JPG/PNG), a coluna DEVE exibir um ícone de imagem clicável que abre o arquivo em nova aba. Para documentos (PDF/DOCX), a coluna DEVE exibir um ícone de documento clicável que abre/baixa o arquivo. Para chamados sem anexo, a coluna DEVE exibir um traço (—).

#### Scenario: Chamado com anexo de imagem na lista
- **WHEN** um chamado com anexo JPG aparece na listagem
- **THEN** a coluna "Anexo" exibe um ícone de imagem clicável que abre a imagem em nova aba

#### Scenario: Chamado com anexo de documento na lista
- **WHEN** um chamado com anexo PDF aparece na listagem
- **THEN** a coluna "Anexo" exibe um ícone de documento clicável que abre/baixa o documento

#### Scenario: Chamado sem anexo na lista
- **WHEN** um chamado sem anexo aparece na listagem
- **THEN** a coluna "Anexo" exibe "—"

### Requirement: Exibição de anexo em tamanho original nos detalhes
O sistema SHALL exibir o anexo em tamanho original na página de detalhes do chamado. Para imagens, o sistema DEVE renderizar a imagem inline com largura máxima responsiva. Para PDF, o sistema DEVE disponibilizar link para abrir em nova aba. Para DOCX, o sistema DEVE disponibilizar link para download.

#### Scenario: Imagem exibida nos detalhes
- **WHEN** um usuário acessa os detalhes de um chamado com anexo PNG
- **THEN** a imagem é exibida inline em tamanho original (com max-width responsivo)

#### Scenario: PDF exibido nos detalhes
- **WHEN** um usuário acessa os detalhes de um chamado com anexo PDF
- **THEN** um link "Abrir PDF" é exibido que abre o documento em nova aba do navegador

#### Scenario: DOCX exibido nos detalhes
- **WHEN** um usuário acessa os detalhes de um chamado com anexo DOCX
- **THEN** um link "Baixar Documento" é exibido que inicia o download do arquivo

### Requirement: Gerenciamento de anexo restrito ao solicitante
O sistema SHALL permitir que apenas o Solicitante (criador do chamado) substitua ou remova o anexo na página de detalhes. Os botões "Substituir Anexo" e "Remover Anexo" DEVEM ser exibidos exclusivamente para o Solicitante dono do chamado.

#### Scenario: Solicitante vê botões de gerenciamento
- **WHEN** o Solicitante acessa os detalhes do seu chamado com anexo
- **THEN** são exibidos botões "Substituir Anexo" e "Remover Anexo" junto à visualização do anexo

#### Scenario: Outros perfis não veem botões de gerenciamento
- **WHEN** um Técnico, Gestor, Diretor ou Admin acessa os detalhes de um chamado com anexo
- **THEN** o anexo é exibido apenas para visualização, sem botões de substituição ou remoção

### Requirement: Coluna dedicada de anexo na listagem de chamados
O sistema SHALL exibir uma coluna dedicada "Anexo" na tabela de listagem de chamados para todos os perfis de usuário. Para imagens (JPG/PNG), a coluna DEVE exibir um ícone de imagem clicável que abre o arquivo em nova aba. Para documentos (PDF/DOCX), a coluna DEVE exibir um ícone de documento clicável que abre/baixa o arquivo. Para chamados sem anexo, a coluna DEVE exibir um traço (—).

#### Scenario: Visualização da listagem de chamados
- **WHEN** um usuário (qualquer perfil) acessa a tela de listagem de chamados
- **THEN** a tabela exibe uma coluna dedicada para "Tipo de Ocorrência"
- **THEN** a tabela exibe uma coluna dedicada para "Tipo de Problema"
- **THEN** o título do chamado é exibido sozinho na sua respectiva coluna, sem conter o tipo de ocorrência ou problema concatenado

### Requirement: Coluna dedicada de anexo na listagem de chamados
O sistema SHALL exibir uma coluna dedicada "Anexo" na tabela de listagem de chamados para todos os perfis de usuário. Para imagens (JPG/PNG), a coluna DEVE exibir um ícone de imagem clicável que abre o arquivo em nova aba. Para documentos (PDF/DOCX), a coluna DEVE exibir um ícone de documento clicável que abre/baixa o arquivo. Para chamados sem anexo, a coluna DEVE exibir um traço (—).

#### Scenario: Chamado com anexo de imagem na lista
- **WHEN** um chamado com anexo JPG aparece na listagem
- **THEN** a coluna "Anexo" exibe um ícone de imagem clicável que abre a imagem em nova aba

#### Scenario: Chamado com anexo de documento na lista
- **WHEN** um chamado com anexo PDF aparece na listagem
- **THEN** a coluna "Anexo" exibe um ícone de documento clicável que abre/baixa o documento

#### Scenario: Chamado sem anexo na lista
- **WHEN** um chamado sem anexo aparece na listagem
- **THEN** a coluna "Anexo" exibe "—"

### Requirement: Exibição de anexo em tamanho original nos detalhes
O sistema SHALL exibir o anexo em tamanho original na página de detalhes do chamado. Para imagens, o sistema DEVE renderizar a imagem inline com largura máxima responsiva. Para PDF, o sistema DEVE disponibilizar link para abrir em nova aba. Para DOCX, o sistema DEVE disponibilizar link para download.

#### Scenario: Imagem exibida nos detalhes
- **WHEN** um usuário acessa os detalhes de um chamado com anexo PNG
- **THEN** a imagem é exibida inline em tamanho original (com max-width responsivo)

#### Scenario: PDF exibido nos detalhes
- **WHEN** um usuário acessa os detalhes de um chamado com anexo PDF
- **THEN** um link "Abrir PDF" é exibido que abre o documento em nova aba do navegador

#### Scenario: DOCX exibido nos detalhes
- **WHEN** um usuário acessa os detalhes de um chamado com anexo DOCX
- **THEN** um link "Baixar Documento" é exibido que inicia o download do arquivo

### Requirement: Gerenciamento de anexo restrito ao solicitante
O sistema SHALL permitir que apenas o Solicitante (criador do chamado) substitua ou remova o anexo na página de detalhes. Os botões "Substituir Anexo" e "Remover Anexo" DEVEM ser exibidos exclusivamente para o Solicitante dono do chamado.

#### Scenario: Solicitante vê botões de gerenciamento
- **WHEN** o Solicitante acessa os detalhes do seu chamado com anexo
- **THEN** são exibidos botões "Substituir Anexo" e "Remover Anexo" junto à visualização do anexo

#### Scenario: Outros perfis não veem botões de gerenciamento
- **WHEN** um Técnico, Gestor, Diretor ou Admin acessa os detalhes de um chamado com anexo
- **THEN** o anexo é exibido apenas para visualização, sem botões de substituição ou remoção
