## ADDED Requirements

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
