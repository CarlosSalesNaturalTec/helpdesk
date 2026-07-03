## Why

Atualmente, na listagem "Meus Chamados", as informações de "Tipo de Ocorrência" (antigo Setor) e "Tipo de Problema" estão sendo exibidas concatenadas ao título do chamado. Isso dificulta a visualização, a leitura rápida e a organização da lista para os usuários. Adicionar colunas explícitas para esses dados melhora a usabilidade e a clareza da interface para todos os perfis.

## What Changes

- Adição explícita da coluna "Tipo de Ocorrência" na tabela de listagem de chamados ("Meus Chamados") para todos os perfis.
- Adição explícita da coluna "Tipo de Problema" na tabela de listagem de chamados.
- Remoção da concatenação dessas informações junto ao título do chamado na exibição da listagem.

## Capabilities

### New Capabilities

### Modified Capabilities
- `ticket-management`: A tabela de listagem de chamados passa a exigir colunas separadas para Tipo de Ocorrência e Tipo de Problema em vez de mostrá-los concatenados ao título.

## Impact

- Frontend: O componente de tabela/listagem de chamados será atualizado para incluir as novas colunas e alterar a renderização da coluna de título.
- Não há impacto no Backend ou Banco de Dados, visto que as queries já retornam os objetos relacionais de Setor (Tipo de Ocorrência) e Tipo de Problema.
