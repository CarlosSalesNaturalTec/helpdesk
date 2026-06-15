# Spec: Busca e Filtro de Chamados (ticket-query)

Sistema de busca textual combinada com filtro por status, permitindo que Técnicos, Gestores e Diretores localizem rapidamente chamados específicos no volume diário de sua Unidade.

## ADDED Requirements

### Requirement: Busca textual por título, solicitante e unidade
O sistema SHALL permitir busca textual nos chamados visíveis ao usuário logado, pesquisando nos campos: título, nome do solicitante e nome da Unidade. A busca DEVE ser case-insensitive e retornar chamados cujo texto contenha o termo digitado em qualquer um desses campos.

#### Scenario: Busca por termo no título
- **WHEN** um Técnico digita "impressora" no campo de busca e aciona "Buscar"
- **THEN** o sistema retorna apenas os chamados de sua Unidade cujo título contenha "impressora" (ex: "Impressora não liga", "Troca de tonner da impressora")

#### Scenario: Busca por nome do solicitante
- **WHEN** um Gestor de TI digita "Maria" no campo de busca
- **THEN** o sistema retorna os chamados de sua Unidade onde o nome do solicitante contenha "Maria"

#### Scenario: Busca sem resultados
- **WHEN** o termo buscado não é encontrado em nenhum chamado visível
- **THEN** o sistema exibe "Nenhum chamado encontrado" e o contador mostra 0

### Requirement: Filtro por status
O sistema SHALL permitir filtrar os chamados visíveis por status, com as opções: Aberto, Em Andamento, Aguardando, Resolvido, Fechado, Reaberto.

#### Scenario: Filtro por status único
- **WHEN** um Técnico seleciona o filtro "Em Andamento"
- **THEN** apenas os chamados com este status de sua Unidade são exibidos

#### Scenario: Filtro sem resultados
- **WHEN** o filtro selecionado não encontra chamados correspondentes
- **THEN** o sistema exibe "Nenhum chamado encontrado" com contador zerado

### Requirement: Combinação de busca e filtro
O sistema SHALL permitir combinar busca textual e filtro por status simultaneamente. O resultado DEVE ser a interseção dos critérios (chamados que atendem a busca E o filtro). O total de chamados encontrados DEVE ser exibido como "X chamados encontrados".

#### Scenario: Busca + filtro combinados
- **WHEN** um Técnico aplica filtro "Aberto" e busca por "impressora"
- **THEN** o sistema exibe apenas os chamados de sua Unidade com status "Aberto" E que contenham "impressora" no título, solicitante ou unidade

#### Scenario: Contador reflete combinação
- **WHEN** uma busca combinada com filtro retorna 3 chamados
- **THEN** o sistema exibe "3 chamados encontrados"

### Requirement: Escopo de busca restrito por Unidade
O sistema SHALL restringir a busca e filtro ao escopo de visão do usuário logado. Técnicos, Gestores e Diretores DEVEM buscar apenas dentro dos chamados de sua Unidade. Solicitantes DEVEM buscar apenas entre seus próprios chamados. O Administrador do Sistema DEVE buscar em todas as Unidades.

#### Scenario: Técnico busca apenas na sua Unidade
- **WHEN** um Técnico da "Unidade A" realiza qualquer busca ou filtro
- **THEN** o sistema aplica o critério de busca SOMENTE sobre os chamados da "Unidade A"

#### Scenario: Admin busca em todas as Unidades
- **WHEN** o Administrador do Sistema realiza uma busca sem filtrar Unidade
- **THEN** o sistema busca em chamados de todas as Unidades
