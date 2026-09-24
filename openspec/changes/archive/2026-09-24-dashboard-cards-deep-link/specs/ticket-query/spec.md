## ADDED Requirements

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
