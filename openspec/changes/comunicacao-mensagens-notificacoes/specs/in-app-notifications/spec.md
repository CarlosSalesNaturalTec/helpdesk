# Spec: Notificações Visuais no Sistema (in-app-notifications)

Indicador visual de notificações não lidas com contador e listagem de atualizações pendentes, permitindo que o usuário veja rapidamente o que mudou desde seu último acesso.

## ADDED Requirements

### Requirement: Indicador visual de notificações não lidas
O sistema SHALL exibir um ícone de notificações (sino) no header da aplicação com um badge numérico indicando a quantidade de notificações não lidas do usuário logado.

#### Scenario: Badge exibe contagem de notificações pendentes
- **WHEN** um usuário não logado no sistema teve 3 atualizações em seus chamados e realiza login
- **THEN** o ícone de sino no header exibe o número "3"

#### Scenario: Badge oculto quando não há notificações
- **WHEN** o usuário não tem notificações não lidas
- **THEN** o badge numérico não é exibido

### Requirement: Listagem de notificações pendentes
Ao clicar no ícone de notificações, o sistema SHALL exibir um dropdown com a lista de notificações não lidas, ordenadas da mais recente para a mais antiga. Cada item DEVE conter: tipo de evento (ícone + texto descritivo), número do chamado e tempo decorrido.

#### Scenario: Dropdown lista notificações
- **WHEN** o usuário clica no ícone de notificações com 3 pendências
- **THEN** um dropdown exibe as 3 notificações, cada uma com descrição como "Chamado #150 foi assumido por João", número do chamado clicável e indicador de "há 10 minutos"

### Requirement: Link direto para o chamado
Cada notificação na lista DEVE conter um link que direciona o usuário diretamente para a tela de detalhes do chamado correspondente.

#### Scenario: Usuário clica na notificação
- **WHEN** o usuário clica em uma notificação "Chamado #150 foi resolvido"
- **THEN** o sistema redireciona para `/chamados/150`, a notificação é marcada como lida e o badge é atualizado

### Requirement: Marcar notificação como lida
O sistema SHALL permitir que o usuário marque notificações como lidas individualmente (ao clicar) ou em lote ("Marcar todas como lidas"). Ao marcar como lida, o contador do badge DEVE ser decrementado.

#### Scenario: Marcar todas como lidas
- **WHEN** o usuário clica em "Marcar todas como lidas" no dropdown de notificações
- **THEN** todas as notificações são marcadas como lidas e o badge desaparece

#### Scenario: Marcar individualmente ao clicar
- **WHEN** o usuário clica em uma notificação específica
- **THEN** essa notificação é marcada como lida e o badge decrementa em 1

### Requirement: Persistência das notificações
O sistema SHALL armazenar notificações no banco de dados, garantindo que sobrevivam a reinicializações do servidor (Cloud Run min-instances=0) e sejam associadas permanentemente ao usuário.

#### Scenario: Notificações persistem entre sessões
- **WHEN** um usuário fecha o navegador e retorna depois
- **THEN** as notificações não lidas ainda estão disponíveis e o badge reflete a contagem correta

### Requirement: Tipos de notificação visual
O sistema SHALL gerar notificações visuais para os mesmos eventos que disparam e-mails: chamado assumido, chamado em Aguardando, chamado resolvido, fechamento administrativo, chamado reaberto, nova mensagem (em Aguardando ou normal) e reatribuição.

#### Scenario: Notificação visual espelha evento de e-mail
- **WHEN** um Técnico assume um chamado
- **THEN** além do e-mail, o Solicitante vê o badge de notificação incrementado com o evento "Chamado #XXX foi assumido por [Técnico]"
