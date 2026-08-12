# Spec: Documentação do Sistema (system-documentation)

Manual do usuário versionado junto ao código-fonte, publicado como site estático junto com a aplicação, com regra de atualização por feature e publicação restrita ao trigger de `main`.

## Purpose

Dar às 5 personas (Solicitante, Técnico, Gestor de TI, Diretor, Administrador do Sistema) e a quem mantém o sistema um manual navegável e sempre atualizado, sem introduzir hospedagem ou pipeline de publicação adicionais.

## Requirements

### Requirement: Manual do usuário em Markdown, organizado por persona e funcionalidade
O sistema DEVE manter um manual de uso em `docs/manual/`, escrito em Markdown, organizado por persona (Solicitante, Técnico, Gestor de TI e Diretor, Administrador) e por funcionalidade (ciclo de vida do chamado, anexos, notificações, relatórios e dashboard), mais uma seção de operação (arquitetura, deploy, acesso e segurança) para quem mantém o sistema.

#### Scenario: Nova feature ou mudança de comportamento
- **WHEN** uma change adiciona uma feature ou altera comportamento visível ao usuário
- **THEN** `docs/manual/` é atualizado no mesmo PR da mudança de código, não como item posterior

### Requirement: Publicação do manual como site estático, junto com o frontend
O manual DEVE ser publicado como site navegável e com busca, construído com MkDocs, gerado dentro de `frontend/dist/manual/` e enviado ao bucket do frontend na mesma operação `gsutil rsync` que publica a aplicação — sem bucket ou pipeline de publicação separados.

#### Scenario: Deploy em produção
- **WHEN** a etapa `deploy-frontend` do Cloud Build roda `gsutil rsync -r -d frontend/dist/ gs://<bucket>/`
- **THEN** tanto os arquivos da aplicação quanto os do manual são publicados nessa mesma operação, e nenhum arquivo do manual publicado anteriormente é perdido

### Requirement: Publicação exclusiva pelo trigger de `main`
O manual publicado DEVE refletir sempre o conteúdo de `main` — a publicação NÃO DEVE ocorrer a partir de uma branch nem por upload manual ao bucket, já que não existe caminho de deploy separado do pipeline.

#### Scenario: Tentativa de publicação manual a partir de uma branch
- **WHEN** alguém considera publicar o manual manualmente a partir de uma branch fora de `main`
- **THEN** a ação NÃO DEVE ser realizada — o próximo `gsutil rsync -d` disparado pelo trigger de `main` apagaria esse conteúdo, por não fazer parte de `frontend/dist/` gerado a partir de `main`

### Requirement: URLs do manual resolvem como chaves de objeto exatas no bucket
O site do manual DEVE ser gerado de forma que toda URL alcançável (a partir da navegação, busca ou links internos) corresponda a uma chave de objeto existente no bucket, sem depender de resolução de índice de diretório (`MainPageSuffix`) — recurso que o endpoint direto do Cloud Storage (`<bucket>.storage.googleapis.com`, XML API) não fornece.

#### Scenario: Acesso à página inicial do manual
- **WHEN** um usuário acessa `<url-do-frontend>/manual/index.html`
- **THEN** a página carrega com status 200

#### Scenario: Navegação para uma página interna do manual
- **WHEN** um usuário clica em um link interno do manual (ex.: de "Início" para o perfil "Solicitante")
- **THEN** o destino é uma chave de objeto real (ex.: `/manual/perfis/solicitante.html`) e carrega com status 200, sem depender de uma URL terminada em `/`

#### Scenario: URL de diretório sem sufixo
- **WHEN** um usuário ou link acessa uma URL do manual terminada em `/` (ex.: `/manual/` ou `/manual/perfis/solicitante/`)
- **THEN** o endpoint retorna 404 — comportamento aceito, já que nenhum link gerado pelo manual ou pela aplicação usa esse formato

### Requirement: Regra de cache para páginas HTML do manual
As páginas HTML do manual DEVEM ser publicadas com `Cache-Control: no-cache`, incluindo a página inicial (`manual/index.html`), para que atualizações de conteúdo apareçam no próximo carregamento sem exigir purga manual de cache.

#### Scenario: Deploy publica uma nova versão do manual
- **WHEN** o pipeline aplica `Cache-Control: no-cache` aos objetos HTML do manual após o `rsync`
- **THEN** a regra alcança tanto as páginas em subdiretórios quanto `manual/index.html`
