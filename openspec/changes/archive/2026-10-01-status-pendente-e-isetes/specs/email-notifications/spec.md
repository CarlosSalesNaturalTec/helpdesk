# Spec Delta

## REMOVED Requirements

### Requirement: E-mail ao colocar chamado em Aguardando
**Reason**: O status passa a chamar-se "Pendente" e o motivo livre dá lugar à Razão da Pendência. O requisito é reescrito abaixo como "E-mail ao colocar chamado em Pendente".

**Migration**: Nenhuma. O disparo continua existindo, com o mesmo destinatário (o Solicitante) e o mesmo gatilho (a entrada no desvio de pendência); apenas o rótulo do status e o conteúdo do motivo mudam.

### Requirement: E-mail quando Solicitante responde em Aguardando
**Reason**: Além do novo rótulo, o conteúdo do e-mail deixa de anunciar que o status foi atualizado automaticamente — a retomada passa a depender de ação do Técnico. O requisito é reescrito abaixo como "E-mail quando Solicitante responde em chamado Pendente".

**Migration**: Nenhuma. O disparo continua existindo, com o mesmo destinatário (o Técnico responsável) e o mesmo gatilho (mensagem do Solicitante em chamado pendente). Este e-mail é o que preserva o aviso ao Técnico após a remoção da transição automática descrita no delta de `ticket-messaging`.

## ADDED Requirements

### Requirement: E-mail ao colocar chamado em Pendente
O sistema SHALL enviar e-mail ao Solicitante quando um chamado for colocado em "Pendente", incluindo a Razão da Pendência registrada pelo Técnico.

O e-mail SHALL referir-se ao status como "Pendente" no assunto e no corpo, e NÃO DEVE prometer que uma resposta do Solicitante retomará o atendimento.

#### Scenario: Solicitante recebe e-mail de Pendente
- **WHEN** um Técnico altera o status para "Pendente" e informa a razão "Aguardando material"
- **THEN** o Solicitante recebe e-mail informando que o chamado está Pendente, com a razão registrada e link para acompanhar o chamado

#### Scenario: E-mail não promete retomada automática
- **WHEN** o e-mail de pendência é composto
- **THEN** seu corpo não afirma que responder no sistema fará o chamado voltar a "Em Andamento"

### Requirement: E-mail quando Solicitante responde em chamado Pendente
O sistema SHALL notificar o Técnico responsável quando o Solicitante enviar uma mensagem em um chamado com status "Pendente".

O e-mail SHALL informar que o chamado permanece Pendente e que a retomada do atendimento depende de ação do Técnico — NÃO DEVE afirmar que o status foi alterado automaticamente.

#### Scenario: Técnico recebe e-mail de resposta
- **WHEN** um Solicitante envia uma mensagem em um chamado "Pendente"
- **THEN** o Técnico responsável recebe e-mail com o conteúdo da mensagem, informando que o chamado segue Pendente até que ele retome o atendimento

#### Scenario: Aviso preservado após a remoção da transição automática
- **WHEN** o Solicitante responde em um chamado "Pendente" e o status não é alterado
- **THEN** o Técnico ainda assim é avisado por e-mail, de modo que a resposta não passe desapercebida
