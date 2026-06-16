# Spec: Dashboard Operacional (dashboard)

Painel inicial com indicadores numéricos de status e gráfico de tendência, oferecendo visão imediata da situação operacional ao acessar o sistema.

## ADDED Requirements

### Requirement: Cards de status por Unidade
O sistema SHALL exibir quatro cards numéricos no Dashboard com as seguintes regras de contagem, restritas à Unidade do usuário logado (exceto Admin):

- **Abertos:** chamados com status "Aberto" ou "Reaberto"
- **Em Andamento:** chamados com status "Em Andamento" ou "Aguardando"
- **Resolvidos:** chamados com status "Resolvido"
- **Críticos:** chamados com urgência "Crítica" E status diferente de "Fechado"

#### Scenario: Cards para Diretor ou Gestor de TI
- **WHEN** um Diretor ou Gestor de TI da "Unidade A" acessa o Dashboard
- **THEN** os 4 cards exibem os totais contando apenas os chamados da "Unidade A"

#### Scenario: Cards para Técnico
- **WHEN** um Técnico da "Unidade A" acessa o Dashboard
- **THEN** os 4 cards exibem os totais restritos aos chamados da "Unidade A"

#### Scenario: Cards consolidados para Admin
- **WHEN** o Administrador do Sistema acessa o Dashboard sem filtro de Unidade
- **THEN** os 4 cards exibem a soma total de chamados de todas as Unidades

#### Scenario: Cards filtrados por Unidade para Admin
- **WHEN** o Admin seleciona uma Unidade específica no seletor do Dashboard
- **THEN** os 4 cards são recalculados exibindo apenas os dados da Unidade selecionada

### Requirement: Atualização dos cards
O sistema SHALL refletir mudanças nos totais dos cards quando a página é recarregada.

#### Scenario: Card reflete novo chamado
- **WHEN** um novo chamado Crítico é aberto na Unidade do usuário enquanto ele visualiza o Dashboard e a página é recarregada
- **THEN** os cards "Críticos" e "Abertos" refletem o incremento

### Requirement: Gráfico de tendência de 30 dias
O sistema SHALL exibir, abaixo dos cards, um gráfico de linha com duas séries temporais: "Chamados Abertos" (contagem diária de novos chamados) e "Chamados Fechados" (contagem diária de chamados que transitaram para Fechado). O período coberto DEVE ser os últimos 30 dias corridos a partir da data atual. Os dados DEVEM ser restritos à Unidade do usuário (exceto Admin com visão global).

#### Scenario: Gráfico para Diretor ou Gestor de TI
- **WHEN** um Diretor da "Unidade A" acessa o Dashboard
- **THEN** o gráfico exibe aberturas e fechamentos diários apenas da "Unidade A" nos últimos 30 dias

#### Scenario: Gráfico para Técnico restrito à Unidade
- **WHEN** um Técnico da "Unidade A" visualiza o gráfico de tendência
- **THEN** os dados refletem apenas os chamados da "Unidade A"

#### Scenario: Gráfico consolidado para Admin
- **WHEN** o Administrador do Sistema acessa o Dashboard geral
- **THEN** o gráfico exibe dados consolidados de todas as Unidades combinadas

#### Scenario: Gráfico filtrável para Admin
- **WHEN** o Admin seleciona uma Unidade específica no seletor
- **THEN** o gráfico é atualizado para exibir apenas os dados da Unidade selecionada

### Requirement: Período sem dados suficientes
O sistema SHALL exibir o gráfico apenas com os dias desde a implantação quando o sistema estiver em operação há menos de 30 dias. NÃO DEVE haver quebras visuais para dias futuros ou ausentes — dias sem chamados DEVEM aparecer com valor zero.

#### Scenario: Sistema recém-implantado
- **WHEN** o sistema opera há apenas 12 dias
- **THEN** o gráfico exibe 12 pontos no eixo X (um para cada dia desde a implantação), com valor zero para dias sem chamados

#### Scenario: Dia sem chamados abertos ou fechados
- **WHEN** em um determinado dia não houve abertura nem fechamento de chamados
- **THEN** o gráfico mostra zero para ambas as séries nesse dia
