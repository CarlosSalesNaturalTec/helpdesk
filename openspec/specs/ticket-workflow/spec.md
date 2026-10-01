# Spec: Workflow do Chamado (ticket-workflow)

Máquina de estados que governa o ciclo de vida do chamado, com transições permitidas, registros de histórico e bloqueios.

## Purpose
TBD

## Requirements

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
O sistema SHALL impedir qualquer alteração de status, adição de mensagens ou **edição de campos do chamado** em chamados "Fechados" que não utilize a ação explícita "Reabrir Chamado".

#### Scenario: Tentativa de alterar chamado fechado sem reabrir
- **WHEN** qualquer usuário tenta alterar o status ou adicionar mensagem em um chamado "Fechado" sem usar "Reabrir Chamado"
- **THEN** o sistema exibe "Este chamado está fechado. Para continuar, utilize a opção 'Reabrir Chamado'." e bloqueia a ação

#### Scenario: Tentativa de corrigir a localidade de chamado fechado
- **WHEN** um usuário autorizado tenta corrigir a localidade de um chamado "Fechado"
- **THEN** o sistema bloqueia a operação com a mesma orientação e nenhum evento de edição é registrado

### Requirement: Histórico cronológico do chamado
O sistema SHALL registrar uma linha do tempo cronológica para cada chamado contendo: dados da abertura (autor, data/hora, título, descrição, tipo, urgência), todas as mensagens trocadas (com autor, data e hora) e todas as mudanças de status (status anterior, novo status, autor, data/hora). O histórico DEVE ser exibido em ordem cronológica da mais antiga para a mais recente.

#### Scenario: Linha do tempo completa
- **WHEN** qualquer participante de um chamado acessa a tela de detalhes
- **THEN** todas as interações são exibidas em ordem cronológica (mais antiga primeiro), formando uma timeline legível com abertura, mensagens e mudanças de status

#### Scenario: Histórico registra transição de status
- **WHEN** um chamado transita de "Em Andamento" para "Resolvido"
- **THEN** o histórico registra: autor da transição, status anterior, novo status, data/hora e a solução registrada

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
