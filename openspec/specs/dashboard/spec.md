# Spec: Dashboard Operacional (dashboard)

## Purpose
Painel inicial com indicadores numéricos de status e gráfico de tendência, oferecendo visão imediata da situação operacional ao acessar o sistema.

## Requirements

### Requirement: Cards de status por Unidade e Setor
O sistema SHALL exibir quatro cards numéricos no Dashboard com as seguintes regras de contagem, restritas à Unidade do usuário logado (exceto Admin) e, no caso de Técnicos e Gestores, restritas ao seu **Setor**. Diretor não sofre essa restrição adicional, vendo todos os Setores da sua Unidade.

- **Abertos:** chamados com status "Aberto" ou "Reaberto"
- **Em Andamento:** chamados com status "Em Andamento" ou "Aguardando"
- **Resolvidos:** chamados com status "Resolvido"
- **Críticos:** chamados com urgência "Crítica" E status diferente de "Fechado"

#### Scenario: Cards para Diretor
- **WHEN** um Diretor da "Unidade A" acessa o Dashboard
- **THEN** os 4 cards exibem os totais contando apenas os chamados da "Unidade A" de todos os setores

#### Scenario: Cards para Técnico restrito a Setor
- **WHEN** um Técnico da "Unidade A" pertencente ao setor "Tecnologia" acessa o Dashboard
- **THEN** os 4 cards exibem os totais restritos aos chamados da "Unidade A" que pertencem ao setor "Tecnologia"

#### Scenario: Cards para Gestor restrito a Setor
- **WHEN** um Gestor de "Limpeza" da "Unidade A" acessa o Dashboard
- **THEN** os 4 cards exibem os totais restritos aos chamados da "Unidade A" que pertencem ao setor "Limpeza"

#### Scenario: Cards consolidados para Admin
- **WHEN** o Administrador do Sistema acessa o Dashboard sem filtro de Unidade
- **THEN** os 4 cards exibem a soma total de chamados de todas as Unidades e Setores

#### Scenario: Cards filtrados por Unidade para Admin
- **WHEN** o Admin seleciona uma Unidade específica no seletor do Dashboard
- **THEN** os 4 cards são recalculados exibindo apenas os dados da Unidade selecionada de todos os setores

#### Scenario: Cards filtrados por Unidade e Setor para Admin
- **WHEN** o Admin seleciona uma Unidade específica e um Setor específico nos seletores do Dashboard
- **THEN** os 4 cards são recalculados exibindo apenas os dados da Unidade e do Setor selecionados

### Requirement: Atualização dos cards
O sistema SHALL refletir mudanças nos totais dos cards quando a página é recarregada.

#### Scenario: Card reflete novo chamado
- **WHEN** um novo chamado Crítico é aberto na Unidade do usuário enquanto ele visualiza o Dashboard e a página é recarregada
- **THEN** os cards "Críticos" e "Abertos" refletem o incremento

### Requirement: Gráfico de tendência de 30 dias
O sistema SHALL exibir, abaixo dos cards, um gráfico de linha com duas séries temporais: "Chamados Abertos" (contagem diária de novos chamados) e "Chamados Fechados" (contagem diária de chamados que transitaram para Fechado). O período coberto DEVE ser os últimos 30 dias corridos a partir da data atual. Os dados DEVEM ser restritos à Unidade do usuário (exceto Admin com visão global) e, no caso de Técnicos e Gestores, restritos ao seu **Setor**. Diretor não sofre essa restrição adicional.

#### Scenario: Gráfico para Diretor
- **WHEN** um Diretor da "Unidade A" acessa o Dashboard
- **THEN** o gráfico exibe aberturas e fechamentos diários apenas da "Unidade A" nos últimos 30 dias de todos os setores

#### Scenario: Gráfico para Técnico restrito à Unidade e Setor
- **WHEN** um Técnico da "Unidade A" do setor "Manutenção" visualiza o gráfico de tendência
- **THEN** os dados refletem apenas os chamados da "Unidade A" que pertencem ao setor "Manutenção"

#### Scenario: Gráfico para Gestor restrito à Unidade e Setor
- **WHEN** um Gestor da "Unidade A" do setor "Manutenção" visualiza o gráfico de tendência
- **THEN** os dados refletem apenas os chamados da "Unidade A" que pertencem ao setor "Manutenção"

#### Scenario: Gráfico consolidado para Admin
- **WHEN** o Administrador do Sistema acessa o Dashboard geral
- **THEN** o gráfico exibe dados consolidados de todas as Unidades combinadas

#### Scenario: Gráfico filtrável por Unidade para Admin
- **WHEN** o Admin seleciona uma Unidade específica no seletor
- **THEN** o gráfico é atualizado para exibir apenas os dados da Unidade selecionada de todos os setores

#### Scenario: Gráfico filtrável por Unidade e Setor para Admin
- **WHEN** o Admin seleciona uma Unidade e um Setor específicos nos seletores
- **THEN** o gráfico é atualizado para exibir apenas os dados da Unidade e Setor selecionados

### Requirement: Período sem dados suficientes
O sistema SHALL exibir o gráfico apenas com os dias desde a implantação quando o sistema estiver em operação há menos de 30 dias. NÃO DEVE haver quebras visuais para dias futuros ou ausentes — dias sem chamados DEVEM aparecer com valor zero.

#### Scenario: Sistema recém-implantado
- **WHEN** o sistema opera há apenas 12 dias
- **THEN** o gráfico exibe 12 pontos no eixo X (um para cada dia desde a implantação), com valor zero para dias sem chamados

#### Scenario: Dia sem chamados abertos ou fechados
- **WHEN** em um determinado dia não houve abertura nem fechamento de chamados
- **THEN** o gráfico mostra zero para ambas as séries nesse dia

### Requirement: Cards do Dashboard navegam para a listagem filtrada
O sistema SHALL tornar cada um dos quatro cards de status um elemento navegável que leva à tela de Chamados já filtrada pelo **mesmo predicado** que o card contou, de modo que a quantidade de chamados listados seja idêntica ao número exibido no card.

Os recortes de Unidade e Tipo de Ocorrência ativos no Dashboard SHALL ser transportados junto. O predicado SHALL ser transportado pela URL, tornando o destino um endereço compartilhável.

Cards sem listagem correspondente — como os da tela de Relatórios, que reutilizam o mesmo componente — NÃO DEVEM ser navegáveis.

#### Scenario: Card "Críticos" leva aos chamados críticos não fechados
- **WHEN** um Diretor vê o card "Críticos" com o valor 7 e o aciona
- **THEN** o sistema navega para a tela de Chamados filtrada por urgência "Crítica" e por todos os status exceto "Fechado"
- **AND** a listagem informa 7 chamados encontrados

#### Scenario: Card "Abertos" preserva os dois status contados
- **WHEN** um Técnico aciona o card "Abertos", que conta chamados "Aberto" e "Reaberto"
- **THEN** a listagem exibe chamados de ambos os status, e não apenas os "Aberto"

#### Scenario: Admin transporta o recorte de Unidade e Tipo de Ocorrência
- **WHEN** o Admin seleciona a "Unidade A" e o Tipo de Ocorrência "Tecnologia" no Dashboard e aciona o card "Em Andamento"
- **THEN** a listagem vem restrita à "Unidade A" e a "Tecnologia", além do filtro de status
- **AND** a contagem da listagem coincide com o número exibido no card

#### Scenario: Destino é um endereço compartilhável
- **WHEN** um Gestor aciona um card e copia o endereço da página de destino
- **THEN** abrir esse endereço em outra sessão reproduz a mesma listagem filtrada, respeitado o escopo do usuário que a abre

#### Scenario: Cards de Relatórios permanecem estáticos
- **WHEN** um Gestor visualiza os cards "Total de Chamados", "Taxa de Fechamento", "TMA" e "Satisfação Média" na tela de Relatórios
- **THEN** nenhum deles é navegável nem recebe foco por teclado
