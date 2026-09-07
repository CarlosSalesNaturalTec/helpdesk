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
O manual SHALL ser publicado como site navegável e com busca, construído com MkDocs, gerado dentro de `frontend/dist/manual/` e publicado no **Firebase Hosting** na mesma operação `firebase deploy` que publica a aplicação — sem site, bucket ou pipeline de publicação separados.

#### Scenario: Deploy em produção
- **WHEN** a etapa `deploy-frontend` do Cloud Build roda `firebase deploy --only hosting` sobre `frontend/dist/`
- **THEN** tanto os arquivos da aplicação quanto os do manual são publicados nessa mesma operação

#### Scenario: Manual alcançável a partir da aplicação
- **WHEN** um usuário autenticado clica no link "Manual" da navbar
- **THEN** o manual abre em nova aba, sob o mesmo domínio da aplicação

### Requirement: Publicação exclusiva pelo trigger de `main`
O manual publicado SHALL refletir sempre o conteúdo de `main` — a publicação NÃO DEVE ocorrer a partir de uma branch nem por publicação manual, já que não existe caminho de deploy separado do pipeline.

#### Scenario: Tentativa de publicação manual a partir de uma branch
- **WHEN** alguém considera publicar o manual manualmente a partir de uma branch fora de `main`
- **THEN** a ação NÃO DEVE ser realizada — cada `firebase deploy` substitui integralmente o conteúdo publicado, então o próximo deploy disparado pelo trigger de `main` descartaria esse conteúdo por não fazer parte de `frontend/dist/` gerado a partir de `main`

### Requirement: URLs do manual resolvem sob a hospedagem do frontend
Toda URL do manual alcançável a partir da navegação, da busca ou de links internos SHALL resolver com status 200 na hospedagem do frontend, incluindo URLs terminadas em `/`.

O manual SHALL continuar sendo gerado com `use_directory_urls: false`, produzindo páginas como chaves `.html` explícitas. Essa escolha permanece por estabilidade das URLs já publicadas, e não mais por limitação do endpoint de hospedagem.

#### Scenario: Acesso à página inicial do manual
- **WHEN** um usuário acessa `<url-do-frontend>/manual/index.html`
- **THEN** a página carrega com status 200

#### Scenario: Navegação para uma página interna do manual
- **WHEN** um usuário clica em um link interno do manual (ex.: de "Início" para o perfil "Solicitante")
- **THEN** o destino (`/manual/perfis/solicitante.html`) carrega com status 200

#### Scenario: URL de diretório terminada em barra
- **WHEN** um usuário ou link acessa `/manual/`
- **THEN** a hospedagem serve `/manual/index.html` com status 200 — comportamento que o endpoint anterior não oferecia e que retornava 404

#### Scenario: Página inexistente sob o prefixo do manual
- **WHEN** alguém acessa uma URL inexistente sob `/manual/`
- **THEN** a resposta é a página 404 gerada pelo próprio MkDocs, e NÃO o `index.html` da aplicação

### Requirement: Regra de cache para páginas HTML do manual
As páginas HTML do manual SHALL ser publicadas com `Cache-Control: no-cache`, incluindo a página inicial (`manual/index.html`), para que atualizações de conteúdo apareçam no próximo carregamento sem exigir purga manual de cache.

A regra SHALL ser declarada na configuração da hospedagem (`firebase.json`), aplicada por padrão de caminho a todo documento HTML publicado — e não por comandos de metadados executados após o upload, que exigiam globs específicos para alcançar tanto a raiz do manual quanto seus subdiretórios.

#### Scenario: Deploy publica uma nova versão do manual
- **WHEN** o pipeline publica uma nova versão do manual
- **THEN** todas as páginas HTML, em qualquer profundidade, são servidas com `Cache-Control: no-cache`
