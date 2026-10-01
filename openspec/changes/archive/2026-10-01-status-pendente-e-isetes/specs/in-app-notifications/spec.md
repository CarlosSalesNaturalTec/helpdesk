# Spec Delta

## MODIFIED Requirements

### Requirement: Tipos de notificação visual
O sistema SHALL gerar notificações visuais para os mesmos eventos que disparam e-mails: chamado assumido, chamado em **Pendente**, chamado resolvido, fechamento administrativo, chamado reaberto, nova mensagem (em chamado Pendente ou normal) e reatribuição.

O texto apresentado ao usuário SHALL referir-se ao status como "Pendente". O identificador interno do tipo de notificação NÃO DEVE ser alterado, de modo que as notificações já gravadas continuem sendo apresentadas com rótulo e ícone corretos.

#### Scenario: Notificação visual espelha evento de e-mail
- **WHEN** um Técnico assume um chamado
- **THEN** além do e-mail, o Solicitante vê o badge de notificação incrementado com o evento "Chamado #XXX foi assumido por [Técnico]"

#### Scenario: Notificação de pendência menciona o novo rótulo
- **WHEN** um Técnico coloca um chamado em "Pendente"
- **THEN** o Solicitante recebe uma notificação visual que se refere ao chamado como Pendente

#### Scenario: Notificações anteriores seguem legíveis
- **WHEN** um usuário abre notificações geradas antes desta mudança para chamados colocados em pendência
- **THEN** elas continuam a ser exibidas com ícone e rótulo próprios, sem cair no tratamento de tipo desconhecido
