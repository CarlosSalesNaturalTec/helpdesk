## MODIFIED Requirements

### Requirement: Cinco papéis com permissões distintas
O sistema SHALL implementar cinco papéis de usuário com as seguintes permissões:

- **Solicitante:** vê apenas seus próprios chamados; pode abrir, interagir e fechar seus chamados resolvidos
- **Técnico:** vê os chamados da sua Unidade E do seu Tipo de Ocorrência; pode assumir chamados abertos, alterar status (exceto Fechar) e registrar mensagens
- **Gestor:** vê e gerencia os chamados da sua Unidade E do seu Tipo de Ocorrência, incluindo reatribuição e fechamento; gerencia usuários de sua Unidade
- **Diretor:** vê e gerencia todos os chamados da sua Unidade, em todos os Tipos de Ocorrência, incluindo reatribuição e fechamento; gerencia usuários de sua Unidade
- **Administrador do Sistema:** acesso irrestrito global; CRUD de Unidades, Tipos de Ocorrência e Usuários; visão consolidada de todas as Unidades

O papel anteriormente denominado `GESTOR_TI` SHALL passar a se chamar `GESTOR`. A especialidade do gestor NÃO É mais fixada no nome do papel: ela é determinada pelo Tipo de Ocorrência (`sectorId`) associado ao usuário.

#### Scenario: Solicitante acessa apenas seus chamados
- **WHEN** um Solicitante consulta a lista de chamados
- **THEN** o sistema retorna exclusivamente os chamados cujo `solicitanteId` corresponde ao seu ID de usuário

#### Scenario: Gestor acessa apenas chamados da sua Unidade e área
- **WHEN** um Gestor da "Unidade A" com Tipo de Ocorrência "Limpeza" consulta a lista de chamados
- **THEN** o sistema retorna apenas chamados da "Unidade A" cujo `sectorId` é "Limpeza"
- **AND** chamados de "Tecnologia" da mesma Unidade NÃO são retornados

#### Scenario: Diretor mantém visão de todas as áreas da Unidade
- **WHEN** um Diretor da "Unidade A" consulta a lista de chamados
- **THEN** o sistema retorna chamados de todos os Tipos de Ocorrência da "Unidade A"

#### Scenario: Admin acessa dados globais
- **WHEN** o Administrador do Sistema consulta qualquer recurso
- **THEN** o sistema retorna dados de todas as Unidades e Tipos de Ocorrência sem restrição

### Requirement: Isolamento de dados entre Unidades e áreas
O sistema SHALL garantir que Técnico, Gestor e Diretor alocados a uma Unidade não visualizem chamados, usuários ou quaisquer dados cujo contexto pertença a outra Unidade. O sistema SHALL adicionalmente garantir que Técnico e Gestor não visualizem chamados, métricas de dashboard ou métricas de relatório pertencentes a um Tipo de Ocorrência diferente do seu. Apenas o Administrador do Sistema possui visão irrestrita; o Diretor possui visão irrestrita dentro da sua Unidade.

#### Scenario: Gestor lista usuários
- **WHEN** um Gestor da "Unidade A" consulta a lista de usuários
- **THEN** o sistema retorna apenas usuários cuja `unidadeId` corresponde à "Unidade A"

#### Scenario: Gestor de uma área tenta acessar chamado de outra área por ID
- **WHEN** um Gestor de "Limpeza" da "Unidade A" requisita `/api/tickets/999`, onde o chamado 999 pertence à "Unidade A" mas ao Tipo de Ocorrência "Tecnologia"
- **THEN** o sistema retorna HTTP 404, não distinguindo entre "não existe" e "sem permissão"

#### Scenario: Diretor tenta editar usuário de outra Unidade
- **WHEN** um Diretor da "Unidade A" tenta editar um usuário da "Unidade B"
- **THEN** o sistema retorna HTTP 404 e a edição não é realizada

## ADDED Requirements

### Requirement: Escopo derivado de forma centralizada
O sistema SHALL derivar a cláusula de escopo (Unidade e Tipo de Ocorrência) a partir do papel do usuário em um único ponto compartilhado, em vez de repetir a condicional em cada módulo de rota. Toda consulta que retorne chamados ou métricas agregadas SHALL aplicar essa cláusula.

#### Scenario: Novo módulo de consulta herda o escopo correto
- **WHEN** um módulo de rota que retorna dados de chamados aplica a cláusula de escopo compartilhada para um Gestor
- **THEN** a consulta resultante contém tanto o filtro de `unidadeId` quanto o de `sectorId`
