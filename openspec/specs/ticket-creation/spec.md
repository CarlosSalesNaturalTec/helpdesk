# Delta Spec: ticket-creation

## MODIFIED Requirements

### Requirement: Abertura de chamado com dados obrigatórios
O sistema SHALL permitir que o Solicitante abra um chamado informando: local do problema (obrigatório, mínimo 2, máximo 60 caracteres), descrição (obrigatória, mínimo 10, máximo 2000 caracteres), Setor (seleção obrigatória entre os setores ativos), Tipo de Problema (seleção obrigatória dependente do Setor escolhido), nível de urgência (Baixa, Média, Alta, Crítica) e, opcionalmente, um arquivo anexo (máximo 1, até 5 MB, tipos: JPG, PNG, PDF, DOCX).

O formulário NÃO DEVE mais solicitar um título: ele passa a ser derivado pelo servidor. Os dados cadastrais do Solicitante (nome, e-mail, Unidade) DEVEM ser preenchidos automaticamente com base na sessão autenticada e NÃO DEVEM ser editáveis.

#### Scenario: Abertura completa com sucesso
- **WHEN** um Solicitante informa o local, a descrição, seleciona Setor, Tipo de Problema e urgência, e confirma a abertura
- **THEN** o chamado é criado com status "Aberto", associado automaticamente à Unidade do Solicitante e ao Setor escolhido, recebe um número único de identificação, e o Solicitante vê a confirmação com o número do chamado

#### Scenario: Formulário não pede título
- **WHEN** um Solicitante acessa a tela "Abrir Novo Chamado"
- **THEN** nenhum campo de título é apresentado e o campo "Onde está o problema?" ocupa o seu lugar entre os campos obrigatórios

#### Scenario: Abertura com anexo opcional
- **WHEN** um Solicitante preenche todos os campos obrigatórios e seleciona um arquivo anexo válido
- **THEN** o chamado é criado com o anexo armazenado no Google Cloud Storage e os metadados do arquivo salvos junto ao chamado

#### Scenario: Campos obrigatórios não preenchidos
- **WHEN** um Solicitante tenta abrir um chamado sem informar o local ou a descrição, ou sem selecionar Setor/Tipo de Problema
- **THEN** o sistema destaca os campos obrigatórios com a mensagem "Este campo é obrigatório" e impede a abertura

#### Scenario: Local abaixo do mínimo
- **WHEN** o local informado tem menos de 2 caracteres após a normalização
- **THEN** o sistema retorna erro de validação no campo de local e a abertura é impedida

#### Scenario: Descrição acima do máximo
- **WHEN** a descrição informada tem mais de 2000 caracteres
- **THEN** o sistema retorna erro "O campo Descrição deve ter entre 10 e 2000 caracteres"

#### Scenario: Dados do Solicitante preenchidos automaticamente
- **WHEN** um Solicitante autenticado acessa a tela de "Abrir Chamado"
- **THEN** os campos nome, e-mail e Unidade aparecem preenchidos com seus dados cadastrais e não são editáveis

#### Scenario: Requisição direta à API sem local é recusada
- **WHEN** uma requisição chega diretamente a `POST /api/tickets` sem o campo de local
- **THEN** o servidor recusa a criação com erro de validação, sem depender da validação do cliente

### Requirement: API de criação de chamados desacoplada
O sistema SHALL expor a lógica de criação de chamados através de uma API REST que NÃO depende da interface web. A interface web de "Abrir Chamado" DEVE consumir essa mesma API. O endpoint `POST /api/tickets` DEVE aceitar requisições `multipart/form-data` com campos de texto e campo opcional de arquivo (`anexo`). Isso garante que canais alternativos (como chatbot) possam criar chamados com as mesmas validações, vinculação automática à Unidade do Solicitante, suporte a anexo e retorno do número do chamado.

#### Scenario: UI web consome a API
- **WHEN** o formulário web de abertura de chamado é submetido
- **THEN** a requisição é enviada para `POST /api/tickets` como `multipart/form-data` e a resposta é exibida na interface

#### Scenario: Canal alternativo consome a mesma API
- **WHEN** um cliente externo autenticado envia um payload válido para `POST /api/tickets`
- **THEN** o chamado é criado com as mesmas validações, vinculação à Unidade do usuário autenticado e retorno do número do chamado

### Requirement: Falha ao carregar dados de referência do formulário é visível e recuperável
O formulário de abertura de chamado depende de três conjuntos de dados de referência carregados do servidor: Tipos de Ocorrência, Tipos de Problema e níveis de urgência. Quando o carregamento de qualquer um deles falhar, o sistema SHALL exibir, no lugar do seletor correspondente, uma mensagem indicando que a lista não pôde ser carregada e uma ação "Tentar novamente" que refaz a busca sem recarregar a página. O sistema NÃO DEVE, em nenhuma hipótese, apresentar um seletor habilitado e vazio como se não houvesse opções cadastradas.

Enquanto qualquer um dos conjuntos de referência estiver ausente, o sistema SHALL manter a ação de envio do chamado desabilitada, informando o motivo.

#### Scenario: Lista de Tipos de Ocorrência falha ao carregar
- **WHEN** a requisição dos Tipos de Ocorrência falha ao abrir a tela "Abrir Novo Chamado"
- **THEN** no lugar do seletor é exibida a mensagem de falha e a ação "Tentar novamente"
- **AND** a ação "Enviar Chamado" permanece desabilitada

#### Scenario: Recuperação sem recarregar a página
- **WHEN** o Solicitante aciona "Tentar novamente" e o servidor responde com sucesso
- **THEN** o seletor é preenchido com as opções, a mensagem de falha desaparece e o envio é liberado, sem que a página seja recarregada

#### Scenario: Falha isolada identifica qual lista quebrou
- **WHEN** apenas a lista de níveis de urgência falha e as demais carregam
- **THEN** somente o seletor de urgência exibe a mensagem de falha, enquanto Tipo de Ocorrência e Tipo de Problema seguem operáveis

#### Scenario: Instabilidade momentânea é absorvida sem erro
- **WHEN** a primeira requisição de um conjunto de referência falha por indisponibilidade momentânea do servidor e uma repetição subsequente tem sucesso
- **THEN** a lista é preenchida normalmente e nenhuma mensagem de falha chega a ser exibida ao Solicitante

### Requirement: Local do problema com sugestões da própria Unidade
O sistema SHALL apresentar, no campo "Onde está o problema?", as localidades já registradas em chamados da Unidade do Solicitante, sem repetição, e SHALL permitir informar uma localidade que ainda não conste da lista.

O sistema SHALL expor essas localidades através de `GET /api/tickets/locais`, restrito ao escopo de visão do usuário: Solicitante, Técnico, Gestor e Diretor recebem apenas as localidades da própria Unidade; o Administrador recebe as de todas as Unidades e PODE estreitar o resultado informando `unidadeId`. Localidades de uma Unidade NÃO DEVEM ser apresentadas a usuários de outra Unidade.

#### Scenario: Sugestões apresentadas ao abrir o formulário
- **WHEN** um Solicitante cuja Unidade já possui chamados nos locais "Recepção" e "Sala de Medicação" acessa o formulário de abertura
- **THEN** o campo de local oferece "Recepção" e "Sala de Medicação" como sugestões, cada uma uma única vez

#### Scenario: Local novo é aceito
- **WHEN** o Solicitante digita uma localidade que não consta das sugestões e conclui a abertura
- **THEN** o chamado é criado com essa localidade, que passa a constar das sugestões da Unidade nas próximas aberturas

#### Scenario: Locais de outra Unidade não são sugeridos
- **WHEN** um Solicitante da "Unidade Central" abre o formulário e a "Unidade Secundária" possui chamados no local "Almoxarifado"
- **THEN** "Almoxarifado" não é oferecido como sugestão

#### Scenario: Base sem histórico de locais
- **WHEN** nenhum chamado da Unidade possui local registrado
- **THEN** o campo é apresentado sem sugestões, permanece editável e orienta o formato esperado pelo texto de exemplo

#### Scenario: Administrador consulta as localidades
- **WHEN** o Administrador requisita `GET /api/tickets/locais` sem informar `unidadeId`
- **THEN** o sistema devolve as localidades distintas de todas as Unidades

### Requirement: Normalização do local na gravação
O sistema SHALL normalizar a localidade informada antes de gravá-la: aparar espaços nas extremidades e colapsar espaços internos repetidos. Quando a localidade normalizada coincidir, ignorando diferenças entre maiúsculas e minúsculas, com uma localidade já registrada na mesma Unidade, o sistema SHALL gravar a grafia já existente, de modo que a lista de sugestões não acumule variações quase idênticas.

A normalização SHALL ocorrer no servidor, valendo igualmente para requisições vindas da interface web e de qualquer outro canal.

#### Scenario: Diferença de caixa reaproveita a grafia existente
- **WHEN** a Unidade já possui o local "Recepção" e um Solicitante informa "recepção"
- **THEN** o chamado é gravado com o local "Recepção" e a lista de sugestões continua apresentando uma única entrada

#### Scenario: Espaços excedentes são removidos
- **WHEN** o Solicitante informa "  Sala   de Medicação  "
- **THEN** o local gravado é "Sala de Medicação"

#### Scenario: Normalização vale para outros canais
- **WHEN** uma requisição chega diretamente a `POST /api/tickets` com local contendo espaços excedentes ou caixa divergente de uma localidade existente
- **THEN** o servidor aplica a mesma normalização antes de gravar

### Requirement: Título do chamado derivado do Tipo de Problema e do local
O sistema SHALL compor o título do chamado no servidor, no momento da criação, a partir do nome do Tipo de Problema e da localidade informada, no formato `Tipo de Problema — Local`, e SHALL persistir esse valor junto ao chamado. O título composto NÃO DEVE ultrapassar 100 caracteres; quando a composição exceder esse limite, o sistema SHALL preservar o nome do Tipo de Problema por inteiro e encurtar a localidade, sinalizando o corte.

O título derivado SHALL ser usado no cabeçalho da tela de detalhes, nas notificações internas e nas mensagens de e-mail. Nas superfícies que já apresentam Tipo de Ocorrência e Tipo de Problema em colunas próprias, o título composto NÃO DEVE ser apresentado — ver o requisito de coluna de local em `ticket-management`.

#### Scenario: Título composto na criação
- **WHEN** um chamado é aberto com Tipo de Problema "Impressora travada" no local "Recepção"
- **THEN** o chamado é gravado com o título "Impressora travada — Recepção"

#### Scenario: Composição excede o limite
- **WHEN** a junção do Tipo de Problema com a localidade ultrapassa 100 caracteres
- **THEN** o título gravado tem no máximo 100 caracteres, preserva o nome do Tipo de Problema por inteiro e apresenta a localidade encurtada com marca de corte

#### Scenario: Título aparece no cabeçalho dos detalhes
- **WHEN** qualquer usuário com acesso abre os detalhes do chamado
- **THEN** o cabeçalho apresenta o título composto

#### Scenario: Título aparece nas notificações
- **WHEN** uma notificação interna ou um e-mail é disparado para um chamado
- **THEN** a mensagem identifica o chamado pelo título composto

#### Scenario: Título não é informado pelo cliente
- **WHEN** uma requisição chega a `POST /api/tickets` contendo um campo de título
- **THEN** o campo é ignorado e o título persistido é o derivado pelo servidor
