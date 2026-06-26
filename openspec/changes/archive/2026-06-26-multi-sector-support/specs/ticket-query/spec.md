## MODIFIED Requirements

### Requirement: Escopo de busca restrito por Unidade e Setor
O sistema SHALL restringir a busca e filtro ao escopo de visão do usuário logado. Gestores e Diretores DEVEM buscar apenas dentro dos chamados de sua Unidade, englobando todos os setores. Técnicos DEVEM buscar apenas dentro dos chamados de sua Unidade E pertencentes ao seu Setor de atuação. Solicitantes DEVEM buscar apenas entre seus próprios chamados. O Administrador do Sistema DEVE buscar em todas as Unidades e Setores.

#### Scenario: Técnico busca apenas na sua Unidade e Setor
- **WHEN** um Técnico da "Unidade A" do setor "Tecnologia" realiza qualquer busca ou filtro
- **THEN** o sistema aplica o critério de busca SOMENTE sobre os chamados da "Unidade A" que pertencem ao setor "Tecnologia"

#### Scenario: Gestor busca em todos os setores da Unidade
- **WHEN** um Gestor da "Unidade A" realiza uma busca
- **THEN** o sistema busca em chamados de qualquer setor dentro da "Unidade A"

#### Scenario: Admin busca em todas as Unidades e Setores
- **WHEN** o Administrador do Sistema realiza uma busca sem filtrar Unidade ou Setor
- **THEN** o sistema busca em chamados de todas as Unidades e todos os Setores
