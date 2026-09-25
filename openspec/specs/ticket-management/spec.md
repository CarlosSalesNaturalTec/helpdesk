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

### Requirement: Correção da localidade do chamado
O sistema SHALL permitir corrigir a localidade de um chamado já aberto através de `PATCH /api/tickets/:id/local`, enquanto o chamado não estiver Fechado.

Podem corrigir: o Solicitante dono do chamado, o Técnico atribuído a ele, o Gestor e o Diretor dentro do seu escopo de Unidade e Tipo de Ocorrência, e o Administrador. Quando o chamado estiver fora do escopo de visão do solicitante da operação, o sistema SHALL responder **HTTP 404**, sem revelar a existência do chamado. Quando o chamado estiver dentro do escopo de visão mas o usuário não tiver direito de corrigi-lo, o sistema SHALL responder **HTTP 403** — devolver 404 seria incoerente com um chamado que o usuário já consulta nas demais rotas.

A localidade informada SHALL passar pela mesma normalização aplicada na abertura, tomando como referência a Unidade **do chamado**, e não a do usuário que corrige.

#### Scenario: Solicitante corrige o próprio chamado
- **WHEN** o Solicitante dono de um chamado Aberto informa uma nova localidade e confirma
- **THEN** a localidade do chamado é atualizada e a alteração passa a constar da linha do tempo

#### Scenario: Técnico atribuído corrige ao constatar divergência
- **WHEN** o Técnico atribuído a um chamado Em Andamento informa a localidade correta
- **THEN** a localidade é atualizada

#### Scenario: Técnico não atribuído é recusado com 403
- **WHEN** um Técnico da mesma Unidade e do mesmo Tipo de Ocorrência do chamado, porém não atribuído a ele, tenta corrigir a localidade
- **THEN** o sistema retorna HTTP 403 e a localidade permanece inalterada

#### Scenario: Chamado fora do escopo é recusado com 404
- **WHEN** um Técnico ou Gestor de outro Tipo de Ocorrência ou de outra Unidade tenta corrigir a localidade
- **THEN** o sistema retorna HTTP 404 e nada é alterado

#### Scenario: Gestor padroniza a grafia
- **WHEN** um Gestor corrige a localidade de um chamado do seu escopo para a grafia padronizada
- **THEN** a localidade é atualizada e a lista de sugestões da Unidade reflete a correção

#### Scenario: Chamado fechado não aceita correção
- **WHEN** qualquer usuário tenta corrigir a localidade de um chamado Fechado
- **THEN** o sistema recusa a operação, informando que o chamado está fechado, e nada é alterado

#### Scenario: Chamado resolvido ainda aceita correção
- **WHEN** o Solicitante dono corrige a localidade de um chamado Resolvido, ainda não fechado
- **THEN** a localidade é atualizada

#### Scenario: Normalização usa a Unidade do chamado
- **WHEN** o Administrador corrige um chamado de outra Unidade informando uma grafia que difere apenas em maiúsculas de uma localidade já registrada **naquela** Unidade
- **THEN** o sistema grava a grafia já registrada na Unidade do chamado

### Requirement: Título recomposto ao corrigir a localidade
Ao corrigir a localidade de um chamado, o sistema SHALL recompor e persistir o título derivado a partir do Tipo de Problema e da nova localidade, de modo que o título nunca aponte uma localidade que o chamado não possui mais. A recomposição SHALL respeitar o mesmo limite de tamanho e a mesma regra de truncagem aplicados na criação.

#### Scenario: Título acompanha a correção
- **WHEN** um chamado com título "Impressora travada — Recepção" tem a localidade corrigida para "Sala de Medicação"
- **THEN** o título passa a ser "Impressora travada — Sala de Medicação" na listagem, nos detalhes e nas notificações subsequentes

#### Scenario: Recomposição respeita o limite
- **WHEN** a nova localidade faz a composição ultrapassar o limite de caracteres do título
- **THEN** o título recomposto preserva o nome do Tipo de Problema por inteiro e apresenta a localidade encurtada com marca de corte

#### Scenario: Chamado anterior ao campo de local passa a ter título derivado
- **WHEN** um chamado aberto antes da existência do campo, cujo título foi digitado por uma pessoa, recebe uma localidade pela correção
- **THEN** o título passa a ser o composto a partir do Tipo de Problema e da localidade

### Requirement: Ação de correção do local na tela de detalhes
A tela de detalhes do chamado SHALL apresentar uma ação de edição junto à localidade, visível apenas para os usuários autorizados a corrigi-la e apenas enquanto o chamado não estiver Fechado. O campo de edição SHALL oferecer as mesmas sugestões de localidade da abertura, referentes à Unidade do chamado, e SHALL permitir informar uma localidade nova. Recusas do servidor SHALL ser apresentadas junto ao campo.

#### Scenario: Ação visível para quem pode corrigir
- **WHEN** o Solicitante dono, o Técnico atribuído ou um Gestor do escopo abre os detalhes de um chamado não fechado
- **THEN** a ação de edição é apresentada junto à localidade

#### Scenario: Ação oculta para quem não pode corrigir
- **WHEN** um Técnico não atribuído do mesmo escopo abre os detalhes do chamado
- **THEN** a localidade é apresentada somente para leitura, sem ação de edição

#### Scenario: Ação oculta em chamado fechado
- **WHEN** o Solicitante dono abre os detalhes de um chamado Fechado
- **THEN** nenhuma ação de edição da localidade é apresentada

#### Scenario: Recusa do servidor é apresentada no campo
- **WHEN** a correção é recusada pelo servidor
- **THEN** a mensagem é apresentada junto ao campo e a localidade exibida permanece a anterior
