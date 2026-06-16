# Spec: Notificações por E-mail (email-notifications)

Disparo automático de e-mails transacionais em eventos do ciclo de vida do ticket, utilizando serviço próprio e independente de infraestrutura corporativa.

## Purpose
TBD

## Requirements

### Requirement: E-mail ao assumir chamado
O sistema SHALL enviar e-mail ao Solicitante quando um Técnico assumir seu chamado. O e-mail DEVE conter o número do chamado, nome do Técnico e link para acesso.

#### Scenario: Solicitante recebe e-mail de atribuição
- **WHEN** um Técnico assume um chamado do Solicitante "Maria Silva"
- **THEN** Maria recebe um e-mail com assunto "Chamado #XXX foi assumido" informando o nome do Técnico responsável

### Requirement: E-mail ao colocar chamado em Aguardando
O sistema SHALL enviar e-mail ao Solicitante quando um chamado for colocado em "Aguardando", incluindo a mensagem do Técnico solicitando informações.

#### Scenario: Solicitante recebe e-mail de Aguardando
- **WHEN** um Técnico altera o status para "Aguardando" e registra "Preciso do número de série do equipamento"
- **THEN** o Solicitante recebe e-mail com a mensagem do Técnico e instrução para responder no sistema

### Requirement: E-mail ao resolver chamado
O sistema SHALL enviar e-mail ao Solicitante quando seu chamado for resolvido, com link para acessar, verificar a solução e fechar o chamado.

#### Scenario: Solicitante recebe e-mail de resolução
- **WHEN** um chamado transita para "Resolvido"
- **THEN** o Solicitante recebe e-mail informando que o chamado foi resolvido, com link para acessar e confirmar o fechamento

### Requirement: E-mail no fechamento administrativo
O sistema SHALL enviar e-mail ao Solicitante quando um Gestor de TI ou Diretor realizar o fechamento administrativo do chamado.

#### Scenario: Solicitante recebe e-mail de encerramento
- **WHEN** um Gestor de TI fecha administrativamente um chamado "Resolvido"
- **THEN** o Solicitante recebe e-mail informando o encerramento do chamado, sem exigência de avaliação

### Requirement: E-mail ao reabrir chamado
O sistema SHALL notificar o Técnico responsável (ou, se não houver, a fila de Técnicos da Unidade) quando um chamado fechado for reaberto.

#### Scenario: Técnico recebe e-mail de reabertura
- **WHEN** um Solicitante reabre um chamado "Fechado"
- **THEN** o Técnico que estava responsável recebe e-mail informando a reabertura com o motivo registrado

### Requirement: E-mail quando Solicitante responde em Aguardando
O sistema SHALL notificar o Técnico responsável quando o Solicitante enviar uma mensagem em um chamado com status "Aguardando".

#### Scenario: Técnico recebe e-mail de resposta
- **WHEN** um Solicitante envia uma mensagem em um chamado "Aguardando"
- **THEN** o Técnico responsável recebe e-mail informando que o Solicitante respondeu, com o conteúdo da mensagem

### Requirement: E-mail na reatribuição
O sistema SHALL notificar o novo Técnico responsável e o Solicitante quando um Gestor ou Diretor reatribuir um chamado.

#### Scenario: Novo Técnico e Solicitante recebem e-mail de reatribuição
- **WHEN** um Gestor de TI reatribui um chamado do Técnico "João" para o Técnico "Pedro"
- **THEN** Pedro recebe e-mail informando a atribuição e o Solicitante recebe e-mail informando a mudança de Técnico responsável

### Requirement: Independência do serviço de e-mail
O sistema SHALL utilizar serviço próprio de disparo de e-mail (SendGrid ou Resend), sem dependência de servidor de e-mail corporativo. Falhas no envio de e-mail NÃO DEVEM bloquear a ação principal nem impedir o registro da notificação visual correspondente.

#### Scenario: Falha no envio de e-mail não bloqueia ação
- **WHEN** uma transição de status ocorre mas o serviço de e-mail está indisponível
- **THEN** a transição é concluída normalmente, a notificação visual é registrada, e o erro de e-mail é logado para diagnóstico
