# Spec: Abertura de Chamado (ticket-creation)

Criação de chamados de suporte com validação, categorização e geração de identificador único. A API de criação é desacoplada da interface web, permitindo que canais alternativos (chatbot futuro) consumam a mesma lógica de negócio.

## Purpose
TBD

## Requirements

### Requirement: Abertura de chamado com dados obrigatórios
O sistema SHALL permitir que o Solicitante abra um chamado informando: título (obrigatório, mínimo 5, máximo 100 caracteres), descrição (obrigatória, mínimo 10, máximo 2000 caracteres), Setor (seleção obrigatória entre os setores ativos), Tipo de Problema (seleção obrigatória dependente do Setor escolhido) e nível de urgência (Baixa, Média, Alta, Crítica). Os dados cadastrais do Solicitante (nome, e-mail, Unidade) DEVEM ser preenchidos automaticamente com base na sessão autenticada e NÃO DEVEM ser editáveis.

#### Scenario: Abertura completa com sucesso
- **WHEN** um Solicitante preenche título, descrição, seleciona Setor, Tipo de Problema e urgência, e confirma a abertura
- **THEN** o chamado é criado com status "Aberto", associado automaticamente à Unidade do Solicitante e ao Setor escolhido, recebe um número único de identificação, e o Solicitante vê a confirmação "Chamado #XXX aberto com sucesso. A equipe técnica já pode visualizá-lo."

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

### Requirement: Número único e sequencial do chamado
O sistema SHALL gerar um número único e sequencial para cada chamado criado, independentemente da Unidade. O número DEVE ser exibido na tela de confirmação e utilizado como referência em todas as comunicações e consultas.

#### Scenario: Número sequencial gerado
- **WHEN** o chamado #150 é criado
- **THEN** o próximo chamado criado recebe o número #151, independentemente da Unidade do Solicitante

### Requirement: API de criação de chamados desacoplada
O sistema SHALL expor a lógica de criação de chamados através de uma API REST que NÃO depende da interface web. A interface web de "Abrir Chamado" DEVE consumir essa mesma API. Isso garante que canais alternativos (como chatbot) possam criar chamados com as mesmas validações, vinculação automática à Unidade do Solicitante e retorno do número do chamado.

#### Scenario: UI web consome a API
- **WHEN** o formulário web de abertura de chamado é submetido
- **THEN** a requisição é enviada para `POST /api/tickets` e a resposta é exibida na interface

#### Scenario: Canal alternativo consome a mesma API
- **WHEN** um cliente externo autenticado envia um payload válido para `POST /api/tickets`
- **THEN** o chamado é criado com as mesmas validações, vinculação à Unidade do usuário autenticado e retorno do número do chamado

### Requirement: Tipos de problema dinâmicos por Setor e níveis de urgência
O sistema SHALL disponibilizar os Setores ativos e seus respectivos Tipos de Problema como listas fechadas que podem ser consultadas via endpoint dedicado. O Tipo de Problema DEVE ser exibido em cascata na interface web, mostrando apenas as opções pertencentes ao Setor selecionado previamente. Os níveis de urgência permanecem como uma lista estática.

#### Scenario: Exibição de tipos de problema filtrados
- **WHEN** o Solicitante seleciona o Setor "Manutenção" no formulário
- **THEN** o campo de Tipo de Problema é limpo e as opções exibidas são restritas aos tipos pertencentes à "Manutenção" (ex: Troca de Lâmpada)

#### Scenario: Consulta de Setores e Tipos de problema
- **WHEN** qualquer cliente autenticado consulta a API de setores e tipos de problema
- **THEN** o sistema retorna a lista de Setores ativos e seus Tipos de Problema vinculados

#### Scenario: Consulta de níveis de urgência
- **WHEN** qualquer cliente autenticado consulta `GET /api/tickets/niveis-urgencia`
- **THEN** o sistema retorna a lista completa de níveis de urgência disponíveis
