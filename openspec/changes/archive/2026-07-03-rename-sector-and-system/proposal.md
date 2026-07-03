## Why

A nomenclatura atual do sistema ("Setor") não reflete adequadamente a natureza das demandas abertas, sendo mais apropriado o termo "Tipo de Ocorrência". Além disso, o sistema carece da identificação institucional correta ("HelpDesk Instituto SETES"), o que é essencial para adoção e reconhecimento pelos usuários.

## What Changes

- Renomear o termo "Setor" para "Tipo de Ocorrência" em toda a interface do usuário, mensagens de erro, e templates de email.
- Alterar o nome do sistema, título da página (`<title>`) e logotipos/textos de cabeçalho para "HelpDesk Instituto SETES".

## Capabilities

### New Capabilities
- Nenhuma.

### Modified Capabilities
- `core-ui`: Atualização do nome e branding do sistema para "HelpDesk Instituto SETES".
- `ticket-management`: Substituição do termo "Setor" por "Tipo de Ocorrência" na classificação de chamados.

## Impact

- Frontend: Textos, componentes de interface, título da página.
- Backend: Templates de email e mensagens de retorno das APIs.
- Banco de dados/ORM: (A definir no design) Avaliar se o modelo do Prisma de "Sector" será renomeado para "OccurrenceType" ou equivalente, ou se será apenas uma mudança na camada de visualização.

## Non-goals

- Alterar regras de negócio de triagem e roteamento de chamados.
- Mudar a estrutura de isolamento de dados por Unidade.
