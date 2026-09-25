# Delta Spec: email-notifications

## ADDED Requirements

### Requirement: E-mail ao corrigir a localidade do chamado
O sistema SHALL enviar um e-mail ao Técnico atribuído quando a localidade do chamado for corrigida por outra pessoa. A mensagem SHALL identificar o chamado pelo número e pelo título, informar a localidade anterior e a nova, e conter um link direto para o chamado.

Nenhum e-mail SHALL ser enviado quando não houver Técnico atribuído ou quando a correção partir do próprio Técnico atribuído.

O envio SHALL seguir a independência já estabelecida do serviço de e-mail: uma falha ou indisponibilidade no envio não impede nem desfaz a correção da localidade.

#### Scenario: E-mail de correção de localidade
- **WHEN** a localidade de um chamado com Técnico atribuído é corrigida por outra pessoa
- **THEN** o Técnico recebe um e-mail com o número e o título do chamado, a localidade anterior, a nova e o link direto para o chamado

#### Scenario: Correção pelo próprio Técnico não dispara e-mail
- **WHEN** o Técnico atribuído corrige a localidade
- **THEN** nenhum e-mail de correção é enviado

#### Scenario: Falha de envio não afeta a correção
- **WHEN** o serviço de e-mail está indisponível no momento da correção
- **THEN** a localidade permanece corrigida, a notificação em aplicação segue registrada e a falha de envio é apenas registrada nos logs
