# Spec: Atribuição de Chamados (ticket-assignment)

Mecanismo de auto-atribuição por Técnico e reatribuição por Gestor/Diretor, sempre respeitando o escopo da Unidade e, para o Gestor, do Tipo de Ocorrência.

## Purpose
TBD

## Requirements

### Requirement: Auto-atribuição por Técnico da mesma Unidade
O sistema SHALL permitir que qualquer Técnico assuma um chamado com status "Aberto" ou "Reaberto" desde que o chamado pertença à mesma Unidade do Técnico. Ao assumir, o chamado DEVE transitar automaticamente para "Em Andamento" e o Técnico DEVE ser registrado como responsável.

#### Scenario: Técnico assume chamado da sua Unidade
- **WHEN** um Técnico da "Unidade A" seleciona um chamado "Aberto" da "Unidade A" e aciona "Assumir Chamado"
- **THEN** o chamado transita para "Em Andamento", o Técnico é registrado como responsável, e a atribuição fica no histórico

#### Scenario: Técnico não pode assumir chamado de outra Unidade
- **WHEN** um Técnico da "Unidade A" tenta assumir um chamado cujo solicitante pertence à "Unidade B"
- **THEN** o sistema retorna HTTP 404 (como se o chamado não existisse para ele)

### Requirement: Auto-atribuição respeita o escopo de área
O sistema SHALL permitir que um Técnico ou Gestor assuma um chamado aberto somente quando o chamado pertencer à sua Unidade E ao seu Tipo de Ocorrência.

#### Scenario: Gestor tenta assumir chamado de outra área
- **WHEN** um Gestor de "Limpeza" requisita `PATCH /api/tickets/:id/assign` em um chamado de "Tecnologia" da sua Unidade
- **THEN** o sistema retorna HTTP 404 e o chamado permanece no status `ABERTO`

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

### Requirement: Visibilidade dos chamados por papel
O sistema SHALL garantir que cada papel veja apenas os chamados permitidos: Técnico, Gestor e Diretor veem os chamados de sua Unidade (Técnico e Gestor restritos adicionalmente ao seu Tipo de Ocorrência); Solicitante vê apenas seus próprios chamados; Administrador do Sistema vê todos os chamados de todas as Unidades.

#### Scenario: Técnico vê fila de chamados da sua Unidade
- **WHEN** um Técnico da "Unidade A" acessa a tela de Gestão de Chamados
- **THEN** o sistema retorna todos os chamados cujo solicitante pertence à "Unidade A"

#### Scenario: Solicitante vê apenas seus chamados
- **WHEN** um Solicitante acessa a lista de chamados
- **THEN** o sistema retorna exclusivamente os chamados onde ele é o solicitante

#### Scenario: Admin vê todos os chamados
- **WHEN** o Administrador do Sistema acessa a Gestão de Chamados
- **THEN** o sistema retorna chamados de todas as Unidades sem restrição
