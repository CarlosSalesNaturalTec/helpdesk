# Delta Spec: ticket-query

## MODIFIED Requirements

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
