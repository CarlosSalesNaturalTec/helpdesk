# Delta Spec: ticket-management

## ADDED Requirements

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
