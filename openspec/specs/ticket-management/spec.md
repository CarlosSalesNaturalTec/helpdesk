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

### Requirement: Coluna de Local na listagem e nos cards de chamado
A listagem de chamados SHALL apresentar uma coluna **"Local"**, no lugar da antiga coluna "Título", exibindo a localidade do problema. Os cards de chamado SHALL apresentar a localidade na posição antes ocupada pelo título, mantendo a linha de meta com Tipo de Ocorrência e Tipo de Problema. Para chamados sem localidade registrada, ambas as superfícies SHALL exibir um traço.

O título composto do chamado (`Tipo de Problema — Local`) NÃO DEVE ser apresentado na listagem nem nos cards: como ambas as superfícies já exibem Tipo de Ocorrência e Tipo de Problema em elementos próprios, apresentá-lo ali repetiria o Tipo de Problema na mesma linha — exatamente a concatenação que a separação de colunas eliminou a pedido do cliente.

#### Scenario: Listagem apresenta o local
- **WHEN** um usuário de qualquer perfil acessa a listagem de chamados
- **THEN** a tabela exibe uma coluna "Local" com a localidade de cada chamado
- **AND** as colunas "Tipo de Ocorrência" e "Tipo de Problema" permanecem separadas e preenchidas

#### Scenario: Tipo de Problema não é repetido na coluna Local
- **WHEN** um chamado de Tipo de Problema "Impressora travada" no local "Recepção" aparece na listagem
- **THEN** a coluna "Local" exibe apenas "Recepção", sem conter o Tipo de Ocorrência ou o Tipo de Problema concatenado

#### Scenario: Card exibe o local
- **WHEN** a listagem é apresentada em formato de cards
- **THEN** o card exibe a localidade na posição de destaque e mantém a linha com Tipo de Ocorrência e Tipo de Problema

#### Scenario: Chamado sem local registrado
- **WHEN** um chamado aberto antes da existência do campo aparece na listagem ou em card
- **THEN** a posição do local exibe um traço, sem erro

### Requirement: Local apresentado nos detalhes do chamado
A tela de detalhes do chamado SHALL apresentar a localidade do problema como informação própria, junto aos demais dados do chamado, e SHALL manter o título composto no cabeçalho.

#### Scenario: Detalhes apresentam local e título
- **WHEN** um usuário com acesso abre os detalhes de um chamado aberto com local
- **THEN** o cabeçalho apresenta o título composto e a localidade aparece identificada entre os dados do chamado

#### Scenario: Detalhes de chamado sem local
- **WHEN** um usuário abre os detalhes de um chamado anterior à existência do campo
- **THEN** o cabeçalho apresenta o título originalmente informado e a localidade é omitida ou exibida como não informada
