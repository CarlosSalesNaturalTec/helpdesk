## Context

A aplicação possui "Setor" como uma nomenclatura legada. Precisamos atualizá-la para "Tipo de Ocorrência". Além disso, precisamos garantir que o nome "HelpDesk Instituto SETES" apareça corretamente no título da página e nos cabeçalhos da aplicação, criando uma identidade única e correta.

## Goals / Non-Goals

**Goals:**
- Substituir consistentemente "Setor" por "Tipo de Ocorrência" nas telas, componentes e emails.
- Alterar o `document.title` ou tags `<title>` para "HelpDesk Instituto SETES".
- Alterar o nome/logo nos componentes de Layout ou Header.

**Non-Goals:**
- Refatorar completamente os nomes das tabelas de banco de dados (o modelo Prisma continuará sendo `Sector` ou `Setor` se já existir para evitar migrações de banco destrutivas e reescritas de código backend em larga escala, focando a mudança na camada de apresentação e internacionalização/textos hardcoded).

## Decisions

- **Preservação do Schema de Banco de Dados**: Foi decidido NÃO renomear os modelos e tabelas no Prisma (por ex., de `Sector` para `OccurrenceType`) neste momento. A mudança se restringirá à camada de visualização (Front-end e respostas em formato de strings). *Motivo*: Evita migrações complexas no banco de dados e bugs decorrentes de refatoração de código profundo, atingindo rapidamente o objetivo de negócio com baixo risco.
- **Substituição de Strings no Frontend**: Utilizar busca e substituição no código fonte React (por "Setor", "setor", "Setores", "setores") para atualizar labels, placeholders e textos em tela.
- **Atualização do Título e Branding**: O arquivo de template base (`index.html` ou semelhante) e o componente de Sidebar/Header terão o texto atualizado.

## Risks / Trade-offs

- **[Risco] Inconsistência de código vs UI:** Desenvolvedores futuros podem se confundir ao ver `Sector` no código e banco, mas "Tipo de Ocorrência" na tela.
  - **Mitigação**: Adicionar comentários no modelo do Prisma e no código indicando que `Sector` se refere a `Tipo de Ocorrência` na interface.
- **[Risco] Quebra de testes E2E/Unitários**: Testes que dependem de encontrar o texto "Setor" na tela vão falhar.
  - **Mitigação**: Atualizar os arquivos de testes que eventualmente quebrarem devido à alteração de strings.
