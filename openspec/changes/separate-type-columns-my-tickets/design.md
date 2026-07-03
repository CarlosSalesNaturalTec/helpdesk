## Context

A listagem de chamados ("Meus Chamados") atualmente concatena as informações de "Tipo de Ocorrência" (Setor) e "Tipo de Problema" ao título do chamado. Esta apresentação visual torna difícil para os usuários examinarem os tickets rapidamente e visualizarem a qual área eles pertencem. Esta mudança visa separar essas informações em colunas distintas, melhorando a experiência do usuário. O backend já fornece essas informações na resposta da API (`sector` e `problemType`).

## Goals / Non-Goals

**Goals:**
- Separar visualmente o "Tipo de Ocorrência" e o "Tipo de Problema" em colunas dedicadas na tabela de chamados.
- Manter o Título do chamado isolado em sua própria coluna.
- Reutilizar os dados já retornados pela API (nenhuma mudança no backend necessária).

**Non-Goals:**
- Não haverá alteração no backend ou nas queries do banco de dados (a API já atende a necessidade).
- Não adicionaremos novos filtros complexos ou ordenação customizada nestas colunas neste momento, apenas a exibição estática.

## Decisions

- **Frontend Table Component Update**: O componente que renderiza os chamados no frontend (tabela) terá a definição de suas colunas ajustada.
  - A renderização da coluna Título será simplificada para exibir apenas o título do chamado.
  - Duas novas colunas serão adicionadas à configuração da tabela: uma para "Tipo de Ocorrência" (usando o dado `sector`) e outra para "Tipo de Problema" (usando o dado `problemType`).

## Risks / Trade-offs

- **Risk**: Telas pequenas (mobile) podem ficar muito densas ou necessitar de scroll excessivo com a adição de duas novas colunas.
  - **Mitigation**: Utilizar os padrões responsivos já estabelecidos pelo design system do projeto (como permitir scroll horizontal em tabelas largas ou colapso de colunas em breakpoints menores).
