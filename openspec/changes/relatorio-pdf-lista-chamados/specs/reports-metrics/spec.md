## MODIFIED Requirements

### Requirement: Métricas de relatório escopadas por Tipo de Ocorrência
O sistema SHALL restringir as métricas de relatório — cards e distribuição por dimensão — ao Tipo de Ocorrência do usuário quando este for um Gestor. Diretor SHALL receber métricas de todos os Tipos de Ocorrência da sua Unidade, **podendo opcionalmente estreitá-las a um Tipo de Ocorrência específico**. Administrador SHALL receber métricas globais, com filtro opcional.

O filtro por Tipo de Ocorrência SHALL estar disponível na tela de Relatórios para Administrador e Diretor. Para o Gestor o filtro NÃO DEVE ser oferecido, por ser inerte: sua área já é fixada pelo escopo.

Filtrar NUNCA amplia o alcance de um papel — para o Diretor é estreitamento do que ele já enxerga dentro da sua Unidade.

#### Scenario: Métricas do Gestor cobrem apenas a sua área
- **WHEN** um Gestor de "Manutenção" da "Unidade A" consulta `GET /api/reports/metrics`
- **THEN** os cards (total, resolvidos, TMA, satisfação) consideram apenas chamados de "Manutenção" da "Unidade A"

#### Scenario: Distribuição por dimensão respeita a área
- **WHEN** um Gestor de "Manutenção" consulta a distribuição por qualquer `dimensao`
- **THEN** apenas chamados do seu Tipo de Ocorrência compõem a distribuição

#### Scenario: PDF herda o escopo das métricas
- **WHEN** um Gestor de "Manutenção" gera o relatório em PDF
- **THEN** os valores impressos correspondem ao mesmo conjunto restrito exibido na tela

#### Scenario: Diretor não é afetado pelo novo escopo
- **WHEN** um Diretor da "Unidade A" consulta as métricas sem informar Tipo de Ocorrência
- **THEN** o resultado abrange todos os Tipos de Ocorrência da "Unidade A", como antes desta mudança

#### Scenario: Diretor estreita as métricas a um Tipo de Ocorrência
- **WHEN** um Diretor da "Unidade A" seleciona o Tipo de Ocorrência "Tecnologia" na tela de Relatórios
- **THEN** cards e distribuição passam a considerar apenas chamados de "Tecnologia" da "Unidade A"

#### Scenario: Gestor não recebe o seletor
- **WHEN** um Gestor acessa a tela de Relatórios
- **THEN** nenhum seletor de Tipo de Ocorrência é exibido

#### Scenario: Filtro não amplia o escopo do Diretor
- **WHEN** um Diretor da "Unidade A" requisita métricas informando um Tipo de Ocorrência que só existe na "Unidade B"
- **THEN** o resultado permanece restrito à "Unidade A" e nenhum dado da "Unidade B" é exposto
