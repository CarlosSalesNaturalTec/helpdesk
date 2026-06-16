# Spec: Mensagens no Chamado (ticket-messaging)

Troca de mensagens textuais entre Técnico e Solicitante dentro do chamado, registradas na timeline cronológica.

## Purpose
TBD

## Requirements

### Requirement: Envio de mensagem por Técnico
O sistema SHALL permitir que o Técnico responsável (ou Gestor/Diretor da Unidade) envie mensagens textuais dentro de um chamado de sua Unidade, desde que o chamado não esteja "Fechado". A mensagem DEVE ter entre 1 e 2000 caracteres.

#### Scenario: Técnico envia mensagem ao Solicitante
- **WHEN** o Técnico responsável por um chamado "Em Andamento" escreve uma mensagem e aciona "Enviar"
- **THEN** a mensagem é registrada no histórico do chamado com autor, data e hora, e fica visível para o Solicitante

#### Scenario: Gestor envia mensagem em chamado de sua Unidade
- **WHEN** um Gestor de TI da "Unidade A" envia uma mensagem em um chamado da "Unidade A"
- **THEN** a mensagem é registrada no histórico e visível para todos os participantes do chamado

### Requirement: Envio de mensagem por Solicitante
O sistema SHALL permitir que o Solicitante envie mensagens textuais dentro de seus próprios chamados, desde que o chamado não esteja "Fechado". A mensagem DEVE ter entre 1 e 2000 caracteres.

#### Scenario: Solicitante responde a questionamento do Técnico
- **WHEN** o Solicitante acessa seu chamado e envia uma mensagem com informações adicionais
- **THEN** a mensagem é registrada no histórico e fica visível para o Técnico

### Requirement: Mensagem retorna chamado de Aguardando para Em Andamento
O sistema SHALL transitar automaticamente o chamado de "Aguardando" para "Em Andamento" quando o Solicitante envia uma mensagem.

#### Scenario: Solicitante responde e chamado sai de Aguardando
- **WHEN** um chamado está "Aguardando" e o Solicitante envia uma mensagem
- **THEN** o status transita para "Em Andamento" e a mudança é registrada no histórico

### Requirement: Bloqueio de mensagem em chamado fechado
O sistema NÃO DEVE permitir o envio de mensagens em chamados com status "Fechado".

#### Scenario: Tentativa de enviar mensagem em chamado fechado
- **WHEN** qualquer usuário tenta enviar uma mensagem em um chamado "Fechado"
- **THEN** o sistema exibe "Este chamado está fechado. Para continuar, utilize a opção 'Reabrir Chamado'." e bloqueia o envio

### Requirement: Timeline unificada
O sistema SHALL exibir o histórico completo do chamado em ordem cronológica (da mais antiga para a mais recente), incluindo: abertura do chamado, mensagens trocadas, mudanças de status, atribuições e reatribuições.

#### Scenario: Timeline com múltiplos tipos de evento
- **WHEN** um chamado possui eventos de abertura, 3 mensagens, 2 mudanças de status e 1 atribuição
- **THEN** a timeline exibe todos os 7 eventos em ordem cronológica, cada um com seu tipo, autor e data/hora
