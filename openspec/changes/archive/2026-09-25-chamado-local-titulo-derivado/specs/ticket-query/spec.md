# Delta Spec: ticket-query

## ADDED Requirements

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
