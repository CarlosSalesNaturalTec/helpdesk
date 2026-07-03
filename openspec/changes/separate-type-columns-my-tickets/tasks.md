## 1. Frontend Implementation

- [ ] 1.1 Localizar o componente de listagem de chamados/tabela de "Meus Chamados" (provavelmente `TicketList.tsx` ou similar).
- [ ] 1.2 Modificar a definição de colunas da tabela adicionando uma nova coluna para "Tipo de Ocorrência", mapeada para exibir `ticket.sector.name`.
- [ ] 1.3 Modificar a definição de colunas da tabela adicionando uma nova coluna para "Tipo de Problema", mapeada para exibir `ticket.problemType.name`.
- [ ] 1.4 Atualizar a renderização da coluna de "Título" para remover a concatenação do setor/tipo de problema, exibindo unicamente o `ticket.title`.
- [ ] 1.5 Garantir que a responsividade da tabela seja mantida (ex: scroll horizontal em telas menores) após a adição das novas colunas.

## 2. Testes e Validação

- [ ] 2.1 Acessar a aplicação localmente com um usuário e visualizar a tela "Meus Chamados" ou "Chamados".
- [ ] 2.2 Validar se as duas novas colunas estão sendo exibidas corretamente com os dados de setor e tipo de problema.
- [ ] 2.3 Validar se a coluna Título exibe apenas o título do chamado, sem dados concatenados.
- [ ] 2.4 Testar o layout e a leitura em diferentes tamanhos de tela.
