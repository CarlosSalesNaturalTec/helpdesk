## ADDED Requirements

### Requirement: Métricas de relatório escopadas por Tipo de Ocorrência
O sistema SHALL restringir as métricas de relatório — cards e distribuição por dimensão — ao Tipo de Ocorrência do usuário quando este for um Gestor. Diretor SHALL receber métricas de todos os Tipos de Ocorrência da sua Unidade. Administrador SHALL receber métricas globais, com filtro opcional.

Este escopo NÃO existia anteriormente: o endpoint filtrava apenas por Unidade, expondo a um gestor as métricas de áreas que não são a sua.

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
- **WHEN** um Diretor da "Unidade A" consulta as métricas
- **THEN** o resultado abrange todos os Tipos de Ocorrência da "Unidade A", como antes desta mudança
