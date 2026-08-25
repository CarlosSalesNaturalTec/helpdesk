## MODIFIED Requirements

### Requirement: Reatribuição restrita à Unidade e à área
O sistema SHALL permitir que Gestor, Diretor e Administrador reatribuam um chamado a outro Técnico. O Gestor SHALL reatribuir apenas chamados do seu próprio Tipo de Ocorrência, e apenas para Técnicos ou Gestores do mesmo Tipo de Ocorrência e da mesma Unidade. O Diretor SHALL reatribuir chamados de qualquer área da sua Unidade, para destinatários da mesma Unidade e do mesmo Tipo de Ocorrência do chamado. O Administrador não possui restrição de Unidade, mas o destinatário SHALL pertencer ao Tipo de Ocorrência do chamado.

#### Scenario: Gestor reatribui dentro da própria área
- **WHEN** um Gestor de "Manutenção" da "Unidade A" reatribui um chamado de "Manutenção" para um Técnico de "Manutenção" da "Unidade A"
- **THEN** a reatribuição é realizada e um registro `REATRIBUICAO` é gravado em `TicketHistory`

#### Scenario: Gestor tenta reatribuir chamado de outra área
- **WHEN** um Gestor de "Manutenção" tenta reatribuir um chamado de "Tecnologia"
- **THEN** o sistema retorna HTTP 404 e a reatribuição não ocorre

#### Scenario: Reatribuição para técnico de outra área é rejeitada
- **WHEN** um Diretor tenta reatribuir um chamado de "Tecnologia" para um Técnico de "Limpeza" da mesma Unidade
- **THEN** o sistema retorna HTTP 400 com mensagem indicando que o destinatário não pertence ao Tipo de Ocorrência do chamado

#### Scenario: Lista de destinatários oferecida na interface
- **WHEN** um Gestor abre o modal de reatribuição de um chamado
- **THEN** a lista de destinatários contém apenas Técnicos e Gestores ativos da mesma Unidade e do mesmo Tipo de Ocorrência do chamado

## ADDED Requirements

### Requirement: Auto-atribuição respeita o escopo de área
O sistema SHALL permitir que um Técnico ou Gestor assuma um chamado aberto somente quando o chamado pertencer à sua Unidade E ao seu Tipo de Ocorrência.

#### Scenario: Gestor tenta assumir chamado de outra área
- **WHEN** um Gestor de "Limpeza" requisita `PATCH /api/tickets/:id/assign` em um chamado de "Tecnologia" da sua Unidade
- **THEN** o sistema retorna HTTP 404 e o chamado permanece no status `ABERTO`
