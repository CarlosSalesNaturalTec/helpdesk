# Spec Delta

## MODIFIED Requirements

### Requirement: System Identity
O sistema SHALL derivar sua identidade visível da composição de `APP_NAME` e `CLIENT_NAME` (e seus equivalentes `VITE_` no frontend), definidos em tempo de build/deploy, em todos os identificadores globais voltados ao usuário — título da aba do navegador, cabeçalho da aplicação, assinatura dos e-mails, cabeçalho e nome do arquivo dos PDFs.

O nome composto SHALL ser `"{APP_NAME} — {CLIENT_NAME}"` quando `CLIENT_NAME` estiver preenchido, e `"{APP_NAME}"` sozinho quando `CLIENT_NAME` for **vazio ou não definido**. Uma `CLIENT_NAME` vazia é uma configuração válida e intencional, não ausência de configuração: o sistema NÃO DEVE substituí-la por um valor padrão.

Nenhum nome de produto ou de cliente SHALL ser fixado em código.

#### Scenario: User views the page
- **WHEN** user loads any page in the browser
- **THEN** the browser tab title MUST display the configured composed name
- **THEN** the main header/logo area MUST display the configured composed name
- **AND** no product or client name is hardcoded in the application

#### Scenario: Cliente preenchido
- **WHEN** o sistema é publicado com `APP_NAME="SOLUTUS"` e `CLIENT_NAME="Instituto Setes"`
- **THEN** o título da aba e o cabeçalho exibem "SOLUTUS — Instituto Setes"

#### Scenario: Cliente vazio exibe apenas o nome da aplicação
- **WHEN** o sistema é publicado com `APP_NAME="ISETES"` e `CLIENT_NAME=""`
- **THEN** o título da aba exibe "ISETES", sem travessão residual nem espaço à direita
- **AND** o cabeçalho da aplicação exibe "ISETES", sem elemento vazio na navbar
- **AND** nenhum valor padrão como "Instituto Setes" é reintroduzido

#### Scenario: Identidade propagada aos artefatos gerados
- **WHEN** o sistema está publicado com `APP_NAME="ISETES"` e `CLIENT_NAME=""`
- **THEN** o cabeçalho do PDF de relatório exibe "Relatório ISETES"
- **AND** o arquivo baixado é nomeado a partir do slug "isetes"
- **AND** a assinatura dos e-mails de notificação exibe "ISETES"
- **AND** o título do manual publicado exibe "ISETES"

## ADDED Requirements

### Requirement: Rótulos de status derivados de fonte única
O sistema SHALL apresentar o status de um chamado por um rótulo legível em português, nunca pelo identificador interno do status. Essa correspondência entre identificador e rótulo SHALL ter uma única definição compartilhada entre frontend e backend, de modo que o rótulo exibido seja idêntico em todas as superfícies: etiquetas na listagem, nos cartões de chamado e na tela de detalhes, eventos de mudança de status na linha do tempo, filtro de status da listagem e relatório em PDF.

Um rótulo novo ou alterado SHALL exigir uma única edição para valer em todas essas superfícies.

#### Scenario: Mesmo rótulo em todas as superfícies
- **WHEN** um usuário vê um chamado no desvio de pendência na listagem, no cartão, na tela de detalhes, na linha do tempo, no filtro de status e no relatório em PDF
- **THEN** todas as seis superfícies exibem "Pendente"

#### Scenario: Identificador interno nunca aparece
- **WHEN** qualquer status é apresentado ao usuário
- **THEN** o texto exibido é o rótulo em português, sem os identificadores internos em maiúsculas e sem sublinhados

#### Scenario: Alteração de rótulo em um único ponto
- **WHEN** o rótulo de um status é alterado na definição compartilhada
- **THEN** todas as superfícies passam a exibir o novo rótulo, sem edição adicional em cada tela
