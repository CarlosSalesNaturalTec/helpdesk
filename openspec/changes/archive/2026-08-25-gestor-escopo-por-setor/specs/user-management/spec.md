## MODIFIED Requirements

### Requirement: Tipo de Ocorrência obrigatório para papéis escopados
O sistema SHALL exigir a seleção de um Tipo de Ocorrência (`sectorId`) ao criar ou editar um usuário com papel `TECNICO` **ou `GESTOR`**. Para os papéis `SOLICITANTE`, `DIRETOR` e `ADMIN` o campo SHALL permanecer ausente e ser ignorado se enviado. A validação SHALL ocorrer no schema Zod compartilhado, garantindo paridade entre cliente e servidor.

#### Scenario: Criar Gestor sem Tipo de Ocorrência é rejeitado
- **WHEN** um Administrador submete a criação de um usuário com papel `GESTOR` e sem `sectorId`
- **THEN** o sistema retorna erro de validação no campo `sectorId` e o usuário não é criado

#### Scenario: Campo aparece na interface para Gestor
- **WHEN** o operador seleciona o papel "Gestor" no formulário de usuário
- **THEN** o seletor de Tipo de Ocorrência é exibido e marcado como obrigatório

#### Scenario: Campo é ocultado para Diretor
- **WHEN** o operador seleciona o papel "Diretor"
- **THEN** o seletor de Tipo de Ocorrência não é exibido e nenhum `sectorId` é enviado

#### Scenario: Alterar papel de Diretor para Gestor passa a exigir a área
- **WHEN** um Administrador edita um Diretor sem `sectorId` alterando seu papel para `GESTOR` sem informar o Tipo de Ocorrência
- **THEN** o sistema retorna erro de validação e a edição não é persistida

## ADDED Requirements

### Requirement: Rótulo do gestor derivado da sua área
O sistema SHALL exibir o papel do gestor na interface como "Gestor de {nome do Tipo de Ocorrência}", derivado do setor associado ao usuário, em vez do texto fixo "Gestor de TI". Quando o nome do setor não estiver disponível, o sistema SHALL exibir apenas "Gestor", sem falhar a renderização.

#### Scenario: Badge da navbar reflete a área
- **WHEN** um Gestor cujo Tipo de Ocorrência é "Manutenção" acessa qualquer tela
- **THEN** o badge de papel exibe "Gestor de Manutenção"

#### Scenario: Listagem de usuários reflete a área de cada gestor
- **WHEN** um Administrador consulta a lista de usuários contendo gestores de áreas distintas
- **THEN** cada linha exibe o rótulo correspondente à área daquele gestor

#### Scenario: Ausência do nome do setor não quebra a interface
- **WHEN** o payload do usuário não traz o nome do setor
- **THEN** a interface exibe "Gestor" e permanece funcional
