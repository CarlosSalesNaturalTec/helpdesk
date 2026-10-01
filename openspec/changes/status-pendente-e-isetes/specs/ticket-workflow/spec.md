# Spec Delta

## REMOVED Requirements

### Requirement: Máquina de estados do chamado
**Reason**: O desvio do ciclo de vida passa a chamar-se "Pendente" e a retornar a "Em Andamento" apenas por ação explícita do Técnico. O requisito é reescrito como "Máquina de estados do chamado com desvio de pendência", abaixo, com os cenários renomeados — a redação anterior ("retornando a Em Andamento quando houver atualização") descrevia justamente o comportamento automático que esta mudança remove.

**Migration**: Nenhuma migração de dados. O ciclo de vida em si não muda: os mesmos estados, as mesmas transições permitidas e o mesmo registro em histórico seguem valendo, agora sob o rótulo "Pendente" e sem a retomada automática. O requisito substituto preserva integralmente os cenários de progressão normal e de reabertura.

## ADDED Requirements

### Requirement: Máquina de estados do chamado com desvio de pendência
O sistema SHALL implementar o seguinte ciclo de vida: **Aberto → Em Andamento → Resolvido → Fechado**. O status **"Pendente"** DEVE ser acionável a partir de "Em Andamento" como um desvio, e SHALL retornar a "Em Andamento" **exclusivamente por ação explícita do Técnico responsável** — nenhuma outra interação no chamado, inclusive mensagens do Solicitante, DEVE alterar o status de um chamado Pendente. Chamados "Fechados" PODEM ser reabertos exclusivamente pela ação explícita "Reabrir Chamado", transitando para "Reaberto" e retornando ao ciclo normal (Reaberto → Em Andamento → Resolvido → Fechado).

Toda apresentação do status ao usuário SHALL empregar o rótulo "Pendente".

#### Scenario: Progressão normal
- **WHEN** um Técnico assume um chamado Aberto, trabalha nele e altera o status para "Resolvido" registrando a solução
- **THEN** cada transição de status é registrada no histórico com autor, data/hora e, quando aplicável, a descrição da solução

#### Scenario: Colocar chamado em Pendente
- **WHEN** um Técnico altera o status de "Em Andamento" para "Pendente" e informa a Razão da Pendência
- **THEN** o status é atualizado para "Pendente", a razão é registrada no chamado e no histórico, e o chamado permanece Pendente até que o Técnico retome o atendimento

#### Scenario: Retorno de Pendente para Em Andamento
- **WHEN** o Técnico responsável por um chamado "Pendente" aciona "Retomar Atendimento"
- **THEN** o status retorna para "Em Andamento", a transição é registrada no histórico e o chamado deixa de apresentar razão de pendência

#### Scenario: Mensagem do Solicitante não retoma chamado Pendente
- **WHEN** o Solicitante envia uma mensagem em um chamado "Pendente"
- **THEN** a mensagem é registrada no histórico, o Técnico responsável é notificado, e o status permanece "Pendente"

### Requirement: Razão da Pendência obrigatória
O sistema SHALL exigir uma Razão da Pendência para colocar um chamado em "Pendente", com no mínimo 2 e no máximo 100 caracteres, e SHALL recusar a transição quando ela não for informada.

A razão SHALL ser registrada tanto no chamado — de modo a permanecer consultável enquanto o chamado estiver Pendente — quanto no evento de mudança de status do histórico. Ao retomar o atendimento, o sistema SHALL limpar a razão do chamado, preservando o registro histórico.

#### Scenario: Transição recusada sem razão
- **WHEN** um Técnico tenta colocar um chamado em "Pendente" sem informar a Razão da Pendência
- **THEN** o sistema recusa a transição, informa que a razão é obrigatória e o status permanece "Em Andamento"

#### Scenario: Razão consultável enquanto Pendente
- **WHEN** um chamado está "Pendente" com a razão "Aguardando material"
- **THEN** a razão é apresentada a quem tem acesso ao chamado e consta do evento de mudança de status na linha do tempo

#### Scenario: Razão limpa ao retomar
- **WHEN** o Técnico retoma um chamado que estava "Pendente" por "Aguardando material"
- **THEN** o chamado deixa de apresentar razão de pendência, e o evento histórico que registrou "Aguardando material" permanece na linha do tempo

### Requirement: Razões de pendência com sugestões do próprio Tipo de Ocorrência
O sistema SHALL apresentar, no campo "Razão da Pendência", as razões já registradas em chamados do mesmo Tipo de Ocorrência, sem repetição, e SHALL permitir informar uma razão que ainda não conste da lista.

O sistema SHALL expor essas razões através de `GET /api/tickets/razoes-pendencia`, restrito ao escopo de visão do usuário: Técnico e Gestor recebem as razões do próprio Tipo de Ocorrência; Diretor recebe as dos Tipos de Ocorrência de sua Unidade; o Administrador recebe as de todos e PODE estreitar o resultado informando `sectorId`. As razões SHALL respeitar o isolamento entre Unidades já vigente para a consulta de chamados.

As sugestões são conveniência, não pré-requisito: quando a consulta falhar, o campo SHALL permanecer editável como texto livre, sem mensagem de erro.

#### Scenario: Sugestões apresentadas ao abrir o modal
- **WHEN** um Técnico do Tipo de Ocorrência "Manutenção", cujos chamados já registraram as razões "Aguardando material" e "Aguardando fornecedor", aciona "Colocar em Pendente"
- **THEN** o campo oferece "Aguardando material" e "Aguardando fornecedor" como sugestões, cada uma uma única vez

#### Scenario: Razão nova é aceita
- **WHEN** o Técnico digita uma razão que não consta das sugestões e confirma a pendência
- **THEN** o chamado é colocado em "Pendente" com essa razão, que passa a constar das sugestões do Tipo de Ocorrência nas próximas pendências

#### Scenario: Razões de outro Tipo de Ocorrência não são sugeridas
- **WHEN** um Técnico de "Tecnologia" aciona "Colocar em Pendente" e o Tipo de Ocorrência "Manutenção" possui a razão "Aguardando verba de obra"
- **THEN** "Aguardando verba de obra" não é oferecida como sugestão

#### Scenario: Base sem histórico de razões
- **WHEN** nenhum chamado do Tipo de Ocorrência possui razão de pendência registrada
- **THEN** o campo é apresentado sem sugestões, permanece editável e orienta o formato esperado pelo texto de exemplo

#### Scenario: Falha na consulta de sugestões
- **WHEN** a consulta das razões falha
- **THEN** o campo segue aceitando texto livre, a pendência pode ser concluída normalmente e nenhuma mensagem de falha é exibida

### Requirement: Normalização da razão na gravação
O sistema SHALL normalizar a razão informada antes de gravá-la: aparar espaços nas extremidades e colapsar espaços internos repetidos. Quando a razão normalizada coincidir, ignorando diferenças entre maiúsculas e minúsculas, com uma razão já registrada no mesmo Tipo de Ocorrência, o sistema SHALL gravar a grafia já existente, de modo que a lista de sugestões não acumule variações quase idênticas.

#### Scenario: Grafia existente é reaproveitada
- **WHEN** o Tipo de Ocorrência já registrou "Aguardando material" e um Técnico informa "  aguardando   material  "
- **THEN** o chamado é gravado com "Aguardando material" e a lista de sugestões continua com uma única entrada

#### Scenario: Espaços internos colapsados em razão nova
- **WHEN** um Técnico informa "Aguardando   laudo   técnico" e nenhuma razão semelhante existe no Tipo de Ocorrência
- **THEN** a razão é gravada como "Aguardando laudo técnico"
