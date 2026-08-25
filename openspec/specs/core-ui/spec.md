# Capability: core-ui

## Purpose
TBD

## Requirements

### Requirement: System Identity
The system MUST be identified as "HelpDesk Instituto SETES" in all user-facing global identifiers, including the browser page title and application headers.

#### Scenario: User views the page
- **WHEN** user loads any page in the browser
- **THEN** the browser tab title MUST display "HelpDesk Instituto SETES"
- **THEN** the main header/logo area MUST display "HelpDesk Instituto SETES"

### Requirement: Link para o manual do usuário na navbar
A navbar DEVE exibir um link "Manual" que abre o manual do sistema em uma nova aba, visível a todas as personas. O link DEVE ser o **último** item da lista de navegação, depois dos itens administrativos (Usuários, Unidades, Tipos de Ocorrência, Tipos de Problema quando visíveis ao perfil do usuário) — o manual é referência auxiliar, não área de trabalho, e não deve interromper o agrupamento desses itens.

#### Scenario: Usuário clica em Manual
- **WHEN** qualquer usuário autenticado clica no link "Manual" na navbar
- **THEN** o manual abre em uma nova aba, em `/manual/index.html`, e a aba original permanece na tela atual da aplicação

#### Scenario: Posição do link para um Administrador
- **WHEN** um Administrador (que vê todos os itens da navbar, incluindo Usuários, Unidades, Tipos de Ocorrência e Tipos de Problema) visualiza a navbar
- **THEN** "Manual" aparece depois de "Tipos de Problema", como o último item da lista

#### Scenario: Posição do link para um Solicitante
- **WHEN** um Solicitante (que não vê os itens administrativos) visualiza a navbar
- **THEN** "Manual" ainda aparece como o último item, depois de "Abrir Chamado"

### Requirement: Paleta clara como tema único
O sistema SHALL apresentar toda a interface sobre superfícies claras, com texto escuro. O tema SHALL ser fixo: não há alternador, preferência persistida nem resposta a `prefers-color-scheme`.

O fundo da aplicação SHALL ser um claro suave capaz de servir de substrato ao efeito de vidro dos painéis, e NÃO um branco chapado — sem substrato, o `backdrop-filter` não produz efeito algum.

#### Scenario: Aplicação carrega em tema claro
- **WHEN** um usuário autenticado acessa qualquer tela do sistema
- **THEN** o fundo da página é claro e o texto principal é escuro
- **AND** nenhuma superfície escura remanescente aparece fora dos elementos deliberadamente escuros

#### Scenario: Preferência de sistema é ignorada
- **WHEN** um usuário com o sistema operacional configurado em modo escuro acessa a aplicação
- **THEN** a interface permanece clara

### Requirement: Efeito de vidro preservado em versão clara
O sistema SHALL manter o tratamento de vidro (`backdrop-filter`) nos painéis, com fundo branco translúcido, borda de baixo contraste e sombra suave.

#### Scenario: Painel exibe translucidez sobre o fundo
- **WHEN** um painel é renderizado sobre a área de conteúdo
- **THEN** o painel apresenta fundo branco translúcido com desfoque do que está atrás
- **AND** a borda e a sombra permanecem sutis, sem o peso de sombras escuras herdadas do tema anterior

### Requirement: Contraste conforme WCAG AA
O sistema SHALL garantir razão de contraste mínima de 4.5:1 para texto normal e 3:1 para texto grande e elementos de interface, sobre as superfícies claras.

O token de texto secundário SHALL ser escurecido: o valor atual reprova sobre fundo claro.

#### Scenario: Texto secundário é legível
- **WHEN** um rótulo de formulário ou texto auxiliar é exibido sobre um painel claro
- **THEN** a razão de contraste com o fundo é de no mínimo 4.5:1

#### Scenario: Badges de papel e status permanecem legíveis
- **WHEN** badges de papel de usuário e de status de chamado são exibidos
- **THEN** cada combinação de texto e fundo atinge no mínimo 4.5:1
- **AND** os matizes semânticos de status permanecem distinguíveis entre si

#### Scenario: Campo desabilitado continua perceptível
- **WHEN** um campo de formulário desabilitado é exibido
- **THEN** seu conteúdo permanece legível e seu estado desabilitado permanece visualmente distinto

### Requirement: Cores definidas exclusivamente por tokens
O sistema SHALL definir todas as cores da interface por meio de variáveis CSS no `:root`. Nenhum componente SHALL declarar cor por literal hexadecimal ou `rgba()` fora dessa camada, seja na folha de estilo, seja em estilo inline de componentes React.

#### Scenario: Componente não declara cor literal
- **WHEN** o código-fonte do frontend é inspecionado em busca de literais de cor fora das definições de token
- **THEN** nenhuma ocorrência é encontrada em estilos inline de componentes nem em regras da folha de estilo

### Requirement: Gráficos calibrados para fundo claro
O sistema SHALL renderizar os gráficos com grade, eixos, dica de contexto (tooltip) e preenchimento de pontos adequados a fundo claro, mantendo as séries distinguíveis entre si.

#### Scenario: Gráfico de tendência é legível
- **WHEN** o dashboard exibe a série temporal de 30 dias
- **THEN** a grade, os rótulos de eixo e o tooltip são legíveis sobre o fundo claro
- **AND** as séries permanecem distinguíveis uma da outra

#### Scenario: Gráfico embutido no PDF fica coerente
- **WHEN** um gestor gera o relatório em PDF, cuja imagem do gráfico é capturada do cliente e inserida numa página branca
- **THEN** o gráfico impresso é legível e coerente com a página, sem fundo escuro

### Requirement: Legibilidade da logomarca sobre fundo claro
O sistema SHALL exibir a logomarca com contraste adequado sobre a interface clara. Como o ativo atual é desenhado para fundo escuro, o sistema SHALL acomodá-lo numa superfície escura contida, sem alterar o ativo.

#### Scenario: Marca permanece legível na navbar
- **WHEN** a navbar é exibida no tema claro
- **THEN** a logomarca aparece sobre uma superfície que preserva seu contraste original

#### Scenario: Acomodação não impede uma variante clara futura
- **WHEN** um ativo claro da marca for adicionado ao mapa de variantes do componente de logomarca
- **THEN** passar a usá-lo é uma alteração aditiva, sem exigir mudança de layout
