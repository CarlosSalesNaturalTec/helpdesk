## ADDED Requirements

### Requirement: Link para o manual do usuário na navbar
A navbar DEVE exibir um link "Manual" que abre o manual do sistema em uma nova aba, visível a todas as personas. O link DEVE ser o **último** item da lista de navegação, depois dos itens administrativos (Usuários, Unidades, Tipos de Ocorrência, Tipos de Problema quando visíveis ao perfil do usuário) — o manual é referência auxiliar, não área de trabalho, e não deve interromper o agrupamento desses itens.

#### Scenario: Usuário clica em Manual
- **WHEN** qualquer usuário autenticado clica no link "Manual" na navbar
- **THEN** o manual abre em uma nova aba, em `/manual/index.html`, e a aba original permanece na tela atual da aplicação

#### Scenario: Posição do link para um Administrador
- **WHEN** um Administrador (que vê todos os itens da navbar, incluindo Usuários, Unidades, Tipos de Ocorrência e Tipos de Problema) visualiza a navbar
- **THEN** "Manual" aparece depois de "Tipos de Problema", como o último item da lista

#### Scenario: Posição do link para um Solicitante
- **WHEN** um Solicitante (que não vê os itens administrativos) visualiza a navbar
- **THEN** "Manual" ainda aparece como o último item, depois de "Abrir Chamado"
