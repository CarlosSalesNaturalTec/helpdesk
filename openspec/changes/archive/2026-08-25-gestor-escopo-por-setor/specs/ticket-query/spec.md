## MODIFIED Requirements

### Requirement: Escopo de busca restrito por Unidade e Setor
O sistema SHALL restringir a busca e filtro ao escopo de visão do usuário logado. Diretores DEVEM buscar apenas dentro dos chamados de sua Unidade, englobando todos os setores. **Gestores e Técnicos DEVEM buscar apenas dentro dos chamados de sua Unidade E pertencentes ao seu setor de atuação.** Solicitantes DEVEM buscar apenas entre seus próprios chamados. O Administrador do Sistema DEVE buscar em todas as Unidades e Setores.

#### Scenario: Técnico busca apenas na sua Unidade e Setor
- **WHEN** um Técnico da "Unidade A" do setor "Tecnologia" realiza qualquer busca ou filtro
- **THEN** o sistema aplica o critério de busca SOMENTE sobre os chamados da "Unidade A" que pertencem ao setor "Tecnologia"

#### Scenario: Gestor busca apenas na sua Unidade e Setor
- **WHEN** um Gestor da "Unidade A" do setor "Manutenção" realiza uma busca
- **THEN** o sistema aplica o critério SOMENTE sobre chamados da "Unidade A" pertencentes ao setor "Manutenção"
- **AND** a contagem de paginação reflete apenas esse subconjunto

#### Scenario: Diretor busca em todos os setores da Unidade
- **WHEN** um Diretor da "Unidade A" realiza uma busca
- **THEN** o sistema busca em chamados de qualquer setor dentro da "Unidade A"

#### Scenario: Admin busca em todas as Unidades e Setores
- **WHEN** o Administrador do Sistema realiza uma busca sem filtrar Unidade ou Setor
- **THEN** o sistema busca em chamados de todas as Unidades e todos os Setores

## ADDED Requirements

### Requirement: Acesso a chamado individual respeita o escopo de área
O sistema SHALL negar a um Gestor ou Técnico o acesso a um chamado de outro Tipo de Ocorrência, mesmo dentro da sua própria Unidade, em todas as rotas que operam sobre um chamado específico — detalhe, histórico, mensagens, transições de status e operações de anexo.

#### Scenario: Gestor tenta ler o histórico de um chamado de outra área
- **WHEN** um Gestor de "Limpeza" requisita `GET /api/tickets/:id/history` de um chamado de "Tecnologia" da sua Unidade
- **THEN** o sistema retorna HTTP 404

#### Scenario: Gestor tenta postar mensagem em chamado de outra área
- **WHEN** um Gestor de "Limpeza" requisita `POST /api/tickets/:id/messages` em um chamado de "Tecnologia"
- **THEN** o sistema retorna HTTP 404 e nenhuma mensagem é registrada

#### Scenario: Gestor tenta substituir o anexo de um chamado de outra área
- **WHEN** um Gestor de "Limpeza" requisita `PATCH /api/tickets/:id/anexo` em um chamado de "Tecnologia"
- **THEN** o sistema retorna HTTP 404 e nenhum arquivo é enviado ao Cloud Storage
