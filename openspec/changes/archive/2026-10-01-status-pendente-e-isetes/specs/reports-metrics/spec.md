# Spec Delta

## REMOVED Requirements

### Requirement: Cards-resumo para Diretor e Gestor
**Reason**: O status descontado do Tempo Médio de Atendimento passa a chamar-se "Pendente". O requisito é reescrito abaixo como "Cards-resumo de desempenho para Diretor e Gestor", com o cenário do TMA renomeado e um cenário novo que fixa a consequência da remoção da retomada automática: o desconto não é mais interrompido por mensagens do Solicitante.

**Migration**: Nenhuma. O cálculo das quatro métricas não muda — apenas o nome do status descontado. O requisito substituto preserva integralmente os cenários de visão local do Diretor e de exclusão de fechamentos administrativos da Satisfação Média.

## ADDED Requirements

### Requirement: Cards-resumo de desempenho para Diretor e Gestor
O sistema SHALL exibir quatro cards-resumo numéricos na tela de Relatórios para Diretores e Gestores, contendo dados estritamente da Unidade do usuário:

- **Total de Tickets:** contagem de chamados da Unidade no período
- **Taxa de Fechamento (%):** (chamados fechados no período / total de chamados no período) × 100
- **Tempo Médio de Atendimento (horas):** média do intervalo entre abertura e primeira transição para "Resolvido", descontando o tempo total em que o chamado permaneceu em "Pendente"
- **Satisfação Média:** média das notas de satisfação (1-5) dos chamados fechados no período, excluindo fechamentos administrativos (sem nota)

#### Scenario: Diretor visualiza métricas locais
- **WHEN** um Diretor da "Unidade A" acessa a tela de Relatórios
- **THEN** os quatro cards exibem valores calculados exclusivamente com dados da "Unidade A"

#### Scenario: TMA desconta tempo Pendente
- **WHEN** um chamado ficou 2h em "Pendente" e o tempo total até resolução foi 10h
- **THEN** o TMA considera 8h para esse chamado (10h - 2h)

#### Scenario: TMA não é reiniciado por mensagem do Solicitante
- **WHEN** um chamado permanece 5 dias em "Pendente" e o Solicitante envia mensagens nesse intervalo
- **THEN** os 5 dias seguem integralmente descontados do TMA, porque o chamado não saiu de "Pendente"

#### Scenario: Satisfação Média exclui fechamentos administrativos
- **WHEN** 3 chamados foram fechados no período (2 pelo Solicitante com notas 4 e 5; 1 por Gestor sem nota)
- **THEN** a Satisfação Média é 4,5 (média de 4 e 5, excluindo o fechamento administrativo)
