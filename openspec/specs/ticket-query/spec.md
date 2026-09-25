# Delta Spec: ticket-query

## Requirements

### Requirement: Retorno de dados relacionais nas queries de chamado
A API de chamados SHALL retornar os objetos completos relacionados ao `Sector` e `ProblemType` quando listar ou consultar um chamado específico, permitindo a exibição de dados ricos (como o nome do Setor e do Tipo de Problema) no frontend sem necessidade de queries adicionais. A API SHALL também retornar os campos de anexo (`anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho`) para exibição de preview na listagem e visualização completa nos detalhes.

#### Scenario: Detalhes do chamado retorna dados de Setor e Tipo
- **WHEN** o frontend consulta os detalhes de um chamado via `GET /api/tickets/:id`
- **THEN** o payload de resposta inclui os objetos `sector` (com `id` e `nome`) e `problemType` (com `id` e `nome`)

#### Scenario: Listagem de chamados retorna dados de Setor
- **WHEN** o frontend consulta a lista de chamados via `GET /api/tickets`
- **THEN** cada ticket no array de resposta inclui o objeto `sector` e `problemType` para exibição em colunas ou cards

#### Scenario: Listagem retorna dados de anexo
- **WHEN** o frontend consulta a lista de chamados via `GET /api/tickets`
- **THEN** cada ticket no array inclui os campos `anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho` (null se sem anexo) para exibição de preview na coluna de anexo

#### Scenario: Detalhes retorna dados de anexo
- **WHEN** o frontend consulta os detalhes de um chamado via `GET /api/tickets/:id`
- **THEN** o payload inclui os campos `anexoUrl`, `anexoNome`, `anexoTipo`, `anexoTamanho` para exibição do anexo em tamanho original

### Requirement: Escopo de busca restrito por Unidade e Setor
O sistema SHALL restringir a busca e filtro ao escopo de visão do usuário logado. Diretores DEVEM buscar apenas dentro dos chamados de sua Unidade, englobando todos os setores. Gestores e Técnicos DEVEM buscar apenas dentro dos chamados de sua Unidade E pertencentes ao seu setor de atuação. Solicitantes DEVEM buscar apenas entre seus próprios chamados. O Administrador do Sistema DEVE buscar em todas as Unidades e Setores.

#### Scenario: Técnico busca apenas na sua Unidade e Setor
- **WHEN** um Técnico da "Unidade A" do setor "Tecnologia" realiza qualquer busca ou filtro
- **THEN** o sistema aplica o critério de busca SOMENTE sobre os chamados da "Unidade A" que pertencem ao setor "Tecnologia"

#### Scenario: Gestor busca apenas na sua Unidade e Setor
- **WHEN** um Gestor da "Unidade A" do setor "Manutenção" realiza uma busca
- **THEN** o sistema aplica o critério SOMENTE sobre chamados da "Unidade A" pertencentes ao setor "Manutenção"
- **AND** a contagem de paginação reflete apenas esse subconjunto

#### Scenario: Diretor busca em todos os setores da Unidade
- **WHEN** um Diretor da "Unidade A" realiza uma busca
- **THEN** o sistema busca em chamados de qualquer setor dentro da "Unidade A"

#### Scenario: Admin busca em todas as Unidades e Setores
- **WHEN** o Administrador do Sistema realiza uma busca sem filtrar Unidade ou Setor
- **THEN** o sistema busca em chamados de todas as Unidades e todos os Setores

### Requirement: Acesso a chamado individual respeita o escopo de área
O sistema SHALL negar a um Gestor ou Técnico o acesso a um chamado de outro Tipo de Ocorrência, mesmo dentro da sua própria Unidade, em todas as rotas que operam sobre um chamado específico — detalhe, histórico, mensagens, transições de status e operações de anexo.

#### Scenario: Gestor tenta ler o histórico de um chamado de outra área
- **WHEN** um Gestor de "Limpeza" requisita `GET /api/tickets/:id/history` de um chamado de "Tecnologia" da sua Unidade
- **THEN** o sistema retorna HTTP 404

#### Scenario: Gestor tenta postar mensagem em chamado de outra área
- **WHEN** um Gestor de "Limpeza" requisita `POST /api/tickets/:id/messages` em um chamado de "Tecnologia"
- **THEN** o sistema retorna HTTP 404 e nenhuma mensagem é registrada

#### Scenario: Gestor tenta substituir o anexo de um chamado de outra área
- **WHEN** um Gestor de "Limpeza" requisita `PATCH /api/tickets/:id/anexo` em um chamado de "Tecnologia"
- **THEN** o sistema retorna HTTP 404 e nenhum arquivo é enviado ao Cloud Storage

### Requirement: Filtro de status com múltiplos valores
O sistema SHALL aceitar mais de um status simultaneamente no filtro da listagem de chamados, retornando os chamados que estejam em **qualquer** um dos status informados. Um único status informado SHALL continuar funcionando como hoje.

#### Scenario: Dois status simultâneos
- **WHEN** um Gestor filtra a listagem por "Aberto" e "Reaberto"
- **THEN** a listagem retorna chamados de ambos os status
- **AND** a contagem total de paginação reflete a união dos dois

#### Scenario: Status único permanece compatível
- **WHEN** uma requisição informa um único status
- **THEN** o comportamento é idêntico ao anterior à mudança

#### Scenario: Status inválido é rejeitado
- **WHEN** uma requisição informa um status que não existe no workflow
- **THEN** o sistema retorna HTTP 400 e nenhum resultado

### Requirement: Filtro de urgência na listagem de chamados
O sistema SHALL permitir filtrar a listagem de chamados por nível de urgência, combinável com os demais filtros por conjunção.

#### Scenario: Urgência combinada com status
- **WHEN** um Diretor filtra por urgência "Crítica" e pelos status diferentes de "Fechado"
- **THEN** a listagem retorna apenas chamados críticos ainda não fechados

#### Scenario: Urgência disponível na barra de filtros
- **WHEN** um usuário com acesso à listagem abre a tela de Chamados
- **THEN** há um controle de filtro por urgência, e sua seleção se reflete na listagem e na contagem

### Requirement: Filtro de Unidade restrito ao Administrador
O sistema SHALL aceitar um filtro de Unidade na listagem de chamados **exclusivamente** para o Administrador do Sistema. Para todos os demais papéis o parâmetro SHALL ser ignorado, prevalecendo o escopo derivado do papel, sem que a resposta revele a existência ou o conteúdo de outra Unidade.

#### Scenario: Admin filtra por Unidade
- **WHEN** o Admin filtra a listagem pela "Unidade A"
- **THEN** a listagem retorna apenas chamados da "Unidade A"

#### Scenario: Técnico não escapa do seu escopo pelo parâmetro
- **WHEN** um Técnico da "Unidade A" requisita a listagem informando a Unidade B
- **THEN** a listagem retorna apenas chamados da "Unidade A" e do setor do Técnico
- **AND** nenhum chamado da "Unidade B" é exposto, nem a contagem total os inclui

#### Scenario: Gestor não escapa do seu escopo de área pelo parâmetro
- **WHEN** um Gestor de "Manutenção" requisita a listagem informando o Tipo de Ocorrência "Tecnologia"
- **THEN** nenhum chamado de "Tecnologia" é exposto

### Requirement: Filtros da listagem preservados no endereço da página
O sistema SHALL refletir os filtros ativos da tela de Chamados no endereço da página, e SHALL reconstituir esses filtros ao abrir um endereço que os contenha.

#### Scenario: Recarregar preserva os filtros
- **WHEN** um usuário aplica filtros na tela de Chamados e recarrega a página
- **THEN** os mesmos filtros continuam aplicados e refletidos nos controles da tela

#### Scenario: Voltar desfaz a última mudança de filtro
- **WHEN** um usuário chega à listagem por um card do Dashboard, altera um filtro e aciona o botão voltar do navegador
- **THEN** a listagem retorna ao filtro com que chegou

#### Scenario: Filtros reconstituídos respeitam o escopo de quem abre
- **WHEN** um Admin compartilha um endereço filtrado por uma Unidade e um Técnico de outra Unidade o abre
- **THEN** os filtros de status e urgência são aplicados, mas o escopo do Técnico prevalece sobre o filtro de Unidade

### Requirement: Campos alcançados pela busca textual
O sistema SHALL aplicar o termo de busca textual da listagem de chamados sobre o título, a **descrição**, o **local**, o nome do Solicitante e o nome da Unidade, sem diferenciar maiúsculas de minúsculas. A busca SHALL continuar restrita ao escopo de visão do usuário logado.

Descrição e local passam a integrar a busca porque o título deixou de ser redigido pelo Solicitante: sem eles, procurar por uma palavra do problema ou por uma localidade deixaria de encontrar o chamado.

#### Scenario: Busca por palavra presente apenas na descrição
- **WHEN** um usuário busca por um termo que consta somente na descrição de um chamado do seu escopo
- **THEN** o chamado é retornado na listagem

#### Scenario: Busca por localidade
- **WHEN** um usuário busca por "Recepção"
- **THEN** são retornados os chamados do seu escopo cujo local é "Recepção", inclusive aqueles cujo título teve a localidade encurtada por limite de tamanho

#### Scenario: Busca ignora diferenças de caixa
- **WHEN** um usuário busca por "recepção" em minúsculas
- **THEN** os chamados do local "Recepção" são retornados

#### Scenario: Busca ampliada respeita o escopo
- **WHEN** um Técnico da "Unidade A" do setor "Tecnologia" busca por um termo que consta na descrição de um chamado da "Unidade B"
- **THEN** esse chamado não é retornado

### Requirement: Retorno do local nas queries de chamado
A API de chamados SHALL retornar o campo `local` ao listar chamados e ao consultar um chamado específico, com valor nulo para os chamados anteriores à existência do campo.

#### Scenario: Listagem retorna o local
- **WHEN** o frontend consulta a lista de chamados via `GET /api/tickets`
- **THEN** cada chamado no array inclui o campo `local`

#### Scenario: Detalhes retornam o local
- **WHEN** o frontend consulta os detalhes de um chamado via `GET /api/tickets/:id`
- **THEN** o payload inclui o campo `local`

#### Scenario: Chamado anterior à change
- **WHEN** um chamado aberto antes da existência do campo é retornado
- **THEN** o campo `local` vem nulo, sem erro
