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
- **WHEN** o sistema é publicado com `APP_NAME="ISETS"` e `CLIENT_NAME=""`
- **THEN** o título da aba exibe "ISETS", sem travessão residual nem espaço à direita
- **AND** o cabeçalho da aplicação exibe "ISETS", sem elemento vazio na navbar
- **AND** nenhum valor padrão como "Instituto Setes" é reintroduzido

#### Scenario: Identidade propagada aos artefatos gerados
- **WHEN** o sistema está publicado com `APP_NAME="ISETS"` e `CLIENT_NAME=""`
- **THEN** o cabeçalho do PDF de relatório exibe "Relatório ISETS"
- **AND** o arquivo baixado é nomeado a partir do slug "isets"
- **AND** a assinatura dos e-mails de notificação exibe "ISETS"
