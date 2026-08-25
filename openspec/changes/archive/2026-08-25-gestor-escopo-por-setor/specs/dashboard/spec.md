## MODIFIED Requirements

### Requirement: Escopo do dashboard por papel
O sistema SHALL calcular os cards de status e a série temporal de 30 dias sobre o conjunto de chamados visível ao usuário. Técnico e **Gestor** SHALL ter as métricas restritas à sua Unidade E ao seu Tipo de Ocorrência. Diretor SHALL ter as métricas restritas à sua Unidade, em todos os Tipos de Ocorrência. Administrador SHALL ver métricas globais, com filtros opcionais de `unidadeId` e `sectorId`.

#### Scenario: Dashboard do Gestor cobre apenas a sua área
- **WHEN** um Gestor de "Limpeza" da "Unidade A" abre o dashboard
- **THEN** os cards de status e a série temporal contabilizam apenas chamados da "Unidade A" com `sectorId` de "Limpeza"

#### Scenario: Dashboard do Diretor cobre todas as áreas da Unidade
- **WHEN** um Diretor da "Unidade A" abre o dashboard
- **THEN** as métricas contabilizam chamados de todos os Tipos de Ocorrência da "Unidade A"

#### Scenario: Admin filtra por área opcionalmente
- **WHEN** o Administrador consulta o dashboard passando `sectorId`
- **THEN** as métricas são restritas àquele Tipo de Ocorrência em todas as Unidades

#### Scenario: Gestores de áreas distintas veem números distintos
- **WHEN** dois Gestores da mesma Unidade, de Tipos de Ocorrência diferentes, abrem o dashboard
- **THEN** cada um recebe contagens calculadas apenas sobre a sua própria área, e a soma das duas não excede o total da Unidade visto pelo Diretor
