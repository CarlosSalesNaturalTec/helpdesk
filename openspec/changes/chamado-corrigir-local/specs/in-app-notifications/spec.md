# Delta Spec: in-app-notifications

## ADDED Requirements

### Requirement: Notificação ao Técnico quando a localidade é corrigida
O sistema SHALL notificar o Técnico atribuído a um chamado quando a localidade desse chamado for corrigida por outra pessoa. A notificação SHALL identificar o chamado, informar a localidade anterior e a nova, e permitir o acesso direto ao chamado.

Quando não houver Técnico atribuído, ou quando a correção partir do próprio Técnico atribuído, nenhuma notificação SHALL ser gerada. O Solicitante NÃO DEVE ser notificado de correções de localidade.

A geração da notificação SHALL seguir a tolerância a falhas já estabelecida: uma falha ao notificar não impede nem desfaz a correção.

#### Scenario: Técnico avisado de mudança de local
- **WHEN** o Solicitante ou um Gestor corrige a localidade de um chamado que já possui Técnico atribuído
- **THEN** o Técnico recebe uma notificação informando o chamado, a localidade anterior e a nova

#### Scenario: Correção feita pelo próprio Técnico
- **WHEN** o Técnico atribuído corrige a localidade do chamado
- **THEN** nenhuma notificação é gerada para ele

#### Scenario: Chamado sem Técnico atribuído
- **WHEN** a localidade de um chamado ainda não atribuído é corrigida
- **THEN** nenhuma notificação de correção é gerada

#### Scenario: Acesso direto pela notificação
- **WHEN** o Técnico aciona a notificação de correção de localidade
- **THEN** o sistema abre os detalhes do chamado correspondente

#### Scenario: Falha ao notificar não desfaz a correção
- **WHEN** a geração da notificação falha
- **THEN** a correção da localidade permanece aplicada e o erro é apenas registrado nos logs
