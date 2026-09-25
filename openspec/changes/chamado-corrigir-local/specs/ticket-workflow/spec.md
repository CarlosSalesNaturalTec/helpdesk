# Delta Spec: ticket-workflow

## ADDED Requirements

### Requirement: Registro de edição de campo no histórico
O sistema SHALL registrar na linha do tempo do chamado um evento do tipo `EDICAO` sempre que um campo do chamado for alterado fora das transições de status, contendo o campo alterado, o valor anterior, o valor novo, o autor e a data/hora.

O tipo `EDICAO` SHALL existir de forma consistente no enum do banco de dados, no enum compartilhado de validação e na apresentação da linha do tempo, e SHALL ser apresentado com rótulo e ícone próprios — nunca no tratamento padrão de tipo desconhecido.

Nesta capacidade, o único campo que produz evento de edição é a localidade do chamado.

#### Scenario: Correção de localidade registrada
- **WHEN** a localidade de um chamado é corrigida de "Recepção" para "Sala de Medicação"
- **THEN** a linha do tempo passa a apresentar um evento de edição informando o autor, a data/hora, o valor anterior e o valor novo

#### Scenario: Evento apresentado com identidade própria
- **WHEN** um chamado com evento de edição tem sua linha do tempo exibida
- **THEN** o evento aparece com rótulo e ícone próprios, em ordem cronológica junto aos demais eventos

#### Scenario: Paridade do enum entre as camadas
- **WHEN** o tipo `EDICAO` é acrescentado ao enum de tipos de histórico
- **THEN** ele consta igualmente do schema do banco de dados, do enum compartilhado de validação e do tratamento de apresentação

## MODIFIED Requirements

### Requirement: Bloqueio de alterações em chamado fechado
O sistema SHALL impedir qualquer alteração de status, adição de mensagens ou **edição de campos do chamado** em chamados "Fechados" que não utilize a ação explícita "Reabrir Chamado".

#### Scenario: Tentativa de alterar chamado fechado sem reabrir
- **WHEN** qualquer usuário tenta alterar o status ou adicionar mensagem em um chamado "Fechado" sem usar "Reabrir Chamado"
- **THEN** o sistema exibe "Este chamado está fechado. Para continuar, utilize a opção 'Reabrir Chamado'." e bloqueia a ação

#### Scenario: Tentativa de corrigir a localidade de chamado fechado
- **WHEN** um usuário autorizado tenta corrigir a localidade de um chamado "Fechado"
- **THEN** o sistema bloqueia a operação com a mesma orientação e nenhum evento de edição é registrado
