# Spec: Workflow do Chamado (ticket-workflow)

Máquina de estados que governa o ciclo de vida do chamado, com transições permitidas, registros de histórico e bloqueios.

## Purpose
TBD

## Requirements

### Requirement: Máquina de estados do chamado
O sistema SHALL implementar o seguinte ciclo de vida: **Aberto → Em Andamento → Resolvido → Fechado**. O status "Aguardando" DEVE ser acionável a partir de "Em Andamento" como um desvio, retornando a "Em Andamento" quando houver atualização. Chamados "Fechados" PODEM ser reabertos exclusivamente pela ação explícita "Reabrir Chamado", transitando para "Reaberto" e retornando ao ciclo normal (Reaberto → Em Andamento → Resolvido → Fechado).

#### Scenario: Progressão normal
- **WHEN** um Técnico assume um chamado Aberto, trabalha nele e altera o status para "Resolvido" registrando a solução
- **THEN** cada transição de status é registrada no histórico com autor, data/hora e, quando aplicável, a descrição da solução

#### Scenario: Colocar chamado em Aguardando
- **WHEN** um Técnico altera o status de "Em Andamento" para "Aguardando" e registra uma mensagem solicitando informações do Solicitante
- **THEN** o status é atualizado para "Aguardando" e o chamado permanece assim até que haja uma atualização que o retorne para "Em Andamento"

#### Scenario: Retorno de Aguardando para Em Andamento
- **WHEN** um chamado está "Aguardando" e o Solicitante responde ou o Técnico retoma o atendimento
- **THEN** o status retorna para "Em Andamento" e a transição é registrada no histórico

### Requirement: Fechamento com pesquisa de satisfação
O sistema SHALL exigir que o Solicitante avalie o atendimento antes de concluir o fechamento. Ao acionar "Fechar Chamado" em um chamado "Resolvido", o sistema DEVE apresentar a tela de pesquisa de satisfação (1 a 5 estrelas). O fechamento só DEVE ser concluído após a seleção de uma nota.

#### Scenario: Solicitante fecha com avaliação
- **WHEN** o Solicitante acessa um chamado "Resolvido", aciona "Fechar Chamado", seleciona 4 estrelas e confirma
- **THEN** o chamado transita para "Fechado", a nota é registrada, e o chamado não pode mais ser alterado diretamente

#### Scenario: Fechamento administrativo por Gestor ou Diretor
- **WHEN** um Gestor de TI ou Diretor aciona "Fechar Chamado" em um chamado "Resolvido" de sua Unidade
- **THEN** o chamado transita para "Fechado" sem acionar a pesquisa de satisfação, e a ação é registrada no histórico

### Requirement: Reabertura de chamado fechado
O sistema SHALL permitir a reabertura de chamados "Fechados" exclusivamente pela ação explícita "Reabrir Chamado", com registro obrigatório do motivo. A reabertura DEVE transitar o chamado para o status "Reaberto" e disponibilizá-lo na fila comum da Unidade.

#### Scenario: Solicitante reabre chamado
- **WHEN** o Solicitante original acessa um chamado "Fechado", aciona "Reabrir Chamado" e informa o motivo
- **THEN** o chamado passa para "Reaberto", o motivo é registrado no histórico, e o chamado retorna à fila comum da Unidade

#### Scenario: Técnico, Gestor ou Diretor reabre chamado
- **WHEN** um Técnico, Gestor de TI ou Diretor da Unidade do chamado aciona "Reabrir Chamado" em um chamado "Fechado" e informa o motivo
- **THEN** o chamado passa para "Reaberto" e fica disponível na fila comum da Unidade

### Requirement: Bloqueio de alterações em chamado fechado
O sistema SHALL impedir qualquer alteração de status ou adição de mensagens em chamados "Fechados" que não utilize a ação explícita "Reabrir Chamado".

#### Scenario: Tentativa de alterar chamado fechado sem reabrir
- **WHEN** qualquer usuário tenta alterar o status ou adicionar mensagem em um chamado "Fechado" sem usar "Reabrir Chamado"
- **THEN** o sistema exibe "Este chamado está fechado. Para continuar, utilize a opção 'Reabrir Chamado'." e bloqueia a ação

### Requirement: Histórico cronológico do chamado
O sistema SHALL registrar uma linha do tempo cronológica para cada chamado contendo: dados da abertura (autor, data/hora, título, descrição, tipo, urgência), todas as mensagens trocadas (com autor, data e hora) e todas as mudanças de status (status anterior, novo status, autor, data/hora). O histórico DEVE ser exibido em ordem cronológica da mais antiga para a mais recente.

#### Scenario: Linha do tempo completa
- **WHEN** qualquer participante de um chamado acessa a tela de detalhes
- **THEN** todas as interações são exibidas em ordem cronológica (mais antiga primeiro), formando uma timeline legível com abertura, mensagens e mudanças de status

#### Scenario: Histórico registra transição de status
- **WHEN** um chamado transita de "Em Andamento" para "Resolvido"
- **THEN** o histórico registra: autor da transição, status anterior, novo status, data/hora e a solução registrada
