# Spec: Métricas e Gráficos de Relatórios (reports-metrics)

Indicadores gerenciais calculados e gráficos de distribuição para análise de desempenho da operação de suporte, com visões local e global.

## ADDED Requirements

### Requirement: Cards-resumo para Diretor e Gestor de TI
O sistema SHALL exibir quatro cards-resumo numéricos na tela de Relatórios para Diretores e Gestores de TI, contendo dados estritamente da Unidade do usuário:

- **Total de Tickets:** contagem de chamados da Unidade no período
- **Taxa de Fechamento (%):** (chamados fechados no período / total de chamados no período) × 100
- **Tempo Médio de Atendimento (horas):** média do intervalo entre abertura e primeira transição para "Resolvido", descontando o tempo total em que o chamado permaneceu em "Aguardando"
- **Satisfação Média:** média das notas de satisfação (1-5) dos chamados fechados no período, excluindo fechamentos administrativos (sem nota)

#### Scenario: Diretor visualiza métricas locais
- **WHEN** um Diretor da "Unidade A" acessa a tela de Relatórios
- **THEN** os quatro cards exibem valores calculados exclusivamente com dados da "Unidade A"

#### Scenario: TMA desconta tempo Aguardando
- **WHEN** um chamado ficou 2h em "Aguardando" e o tempo total até resolução foi 10h
- **THEN** o TMA considera 8h para esse chamado (10h - 2h)

#### Scenario: Satisfação Média exclui fechamentos administrativos
- **WHEN** 3 chamados foram fechados no período (2 pelo Solicitante com notas 4 e 5; 1 por Gestor sem nota)
- **THEN** a Satisfação Média é 4,5 (média de 4 e 5, excluindo o fechamento administrativo)

### Requirement: Cards-resumo para Admin
O sistema SHALL exibir os mesmos quatro cards-resumo para o Administrador do Sistema de forma consolidada (todo o Instituto) e disponibilizar filtro de Unidade para recalcular os indicadores para uma Unidade específica.

#### Scenario: Admin vê métricas consolidadas
- **WHEN** o Admin acessa a tela de Relatórios sem selecionar Unidade
- **THEN** os quatro cards exibem valores calculados com dados de todas as Unidades

#### Scenario: Admin filtra por Unidade
- **WHEN** o Admin seleciona uma Unidade específica no filtro
- **THEN** os quatro cards são recalculados instantaneamente para refletir apenas a Unidade selecionada

### Requirement: Gráfico de distribuição local
O sistema SHALL exibir um gráfico de distribuição (barras ou pizza) para Diretores e Gestores de TI com dimensões selecionáveis: Status, Prioridade, Categoria e Satisfação. O gráfico DEVE exibir a contagem de chamados da Unidade agrupada pela dimensão selecionada.

#### Scenario: Distribuição por Categoria
- **WHEN** um Gestor de TI seleciona a dimensão "Categoria" no filtro de distribuição
- **THEN** o gráfico exibe barras com a contagem de chamados agrupados por Hardware, Software, Rede, E-mail, Impressora, Acesso/Senha, Sistema Interno, Outro

#### Scenario: Distribuição por Status
- **WHEN** um Diretor seleciona "Status" como dimensão
- **THEN** o gráfico exibe a contagem de chamados agrupados por Aberto, Em Andamento, Aguardando, Resolvido, Fechado, Reaberto

### Requirement: Gráfico comparativo entre Unidades para Admin
O sistema SHALL disponibilizar a dimensão "Unidade" no gráfico de distribuição para o Administrador do Sistema, exibindo um gráfico de barras comparando totais de chamados, tipos de chamado e satisfação média entre as Unidades cadastradas.

#### Scenario: Admin compara Unidades
- **WHEN** o Admin seleciona a dimensão "Unidade"
- **THEN** o sistema gera um gráfico de barras com uma barra por Unidade, permitindo comparar volumetria entre elas

### Requirement: Filtro de período
O sistema SHALL permitir filtrar os dados dos relatórios por período: últimos 30 dias, 60 dias, 90 dias ou período customizado (data inicial e final). Todos os cards e gráficos DEVEM se atualizar conforme o período selecionado.

#### Scenario: Período de 90 dias
- **WHEN** o usuário seleciona "Últimos 90 dias" no filtro de período
- **THEN** todos os cards-resumo e gráficos são recalculados considerando apenas os chamados dos últimos 90 dias
