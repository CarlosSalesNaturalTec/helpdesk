# Delta Spec: ticket-creation

## MODIFIED Requirements

### Requirement: Abertura de chamado com dados obrigatórios
O sistema SHALL permitir que o Solicitante abra um chamado informando: título (obrigatório, mínimo 5, máximo 100 caracteres), descrição (obrigatória, mínimo 10, máximo 2000 caracteres), Setor (seleção obrigatória entre os setores ativos), Tipo de Problema (seleção obrigatória dependente do Setor escolhido), nível de urgência (Baixa, Média, Alta, Crítica) e, opcionalmente, um arquivo anexo (máximo 1, até 5 MB, tipos: JPG, PNG, PDF, DOCX). Os dados cadastrais do Solicitante (nome, e-mail, Unidade) DEVEM ser preenchidos automaticamente com base na sessão autenticada e NÃO DEVEM ser editáveis.

#### Scenario: Abertura completa com sucesso
- **WHEN** um Solicitante preenche título, descrição, seleciona Setor, Tipo de Problema e urgência, e confirma a abertura
- **THEN** o chamado é criado com status "Aberto", associado automaticamente à Unidade do Solicitante e ao Setor escolhido, recebe um número único de identificação, e o Solicitante vê a confirmação "Chamado #XXX aberto com sucesso. A equipe técnica já pode visualizá-lo."

#### Scenario: Abertura com anexo opcional
- **WHEN** um Solicitante preenche todos os campos obrigatórios e seleciona um arquivo anexo válido
- **THEN** o chamado é criado com o anexo armazenado no Google Cloud Storage e os metadados do arquivo salvos junto ao chamado

#### Scenario: Campos obrigatórios não preenchidos
- **WHEN** um Solicitante tenta abrir um chamado sem preencher título ou descrição ou sem selecionar Setor/Tipo de Problema
- **THEN** o sistema destaca os campos obrigatórios com a mensagem "Este campo é obrigatório" e impede a abertura

#### Scenario: Título abaixo do mínimo
- **WHEN** o título informado tem menos de 5 caracteres
- **THEN** o sistema retorna erro "O campo Título deve ter entre 5 e 100 caracteres"

#### Scenario: Descrição acima do máximo
- **WHEN** a descrição informada tem mais de 2000 caracteres
- **THEN** o sistema retorna erro "O campo Descrição deve ter entre 10 e 2000 caracteres"

#### Scenario: Dados do Solicitante preenchidos automaticamente
- **WHEN** um Solicitante autenticado acessa a tela de "Abrir Chamado"
- **THEN** os campos nome, e-mail e Unidade aparecem preenchidos com seus dados cadastrais e não são editáveis

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
