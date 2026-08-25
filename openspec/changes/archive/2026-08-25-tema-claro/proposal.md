## Why

A interface é escura por padrão e não há alternativa: `frontend/src/index.css` é a única folha de estilo carregada (`main.tsx:3`) e define um `:root` escuro fixo — `--bg-main: #0b0f19`, `--text-main: #f8fafc`. O pedido é inverter para um tema claro.

Não é uma troca de variáveis. A camada de tokens existe e ajuda, mas o problema está fora dela:

- **~59 literais de cor** em `index.css` fora de `var(--)`, embutidos direto nos componentes.
- **27 usos inline** de hex/rgba espalhados por **13 arquivos `.tsx`**, incluindo o gradiente radial escuro de `Login.tsx:63`, o texto em gradiente de `Login.tsx:74`, e o `TrendChart` calibrado para fundo escuro (tooltip escuro, grade branca a 5%, `fill: '#0b0f19'` nos pontos).
- A **logomarca é néon sobre escuro** (`assets/brand/logo-horizontal.png`): em fundo claro o glow desaparece e o contraste cai.

## What Changes

- Inverter a paleta de tokens em `:root` para claro, mantendo o vocabulário de nomes existente (`--bg-main`, `--bg-card`, `--text-main`, `--text-muted`, `--border`, glows).
- **Preservar o glassmorphism em versão clara:** `.glass-panel` mantém `backdrop-filter: blur(12px)` com fundo `rgba(255,255,255,~.7)`. Para o vidro existir é preciso algo atrás dele, então `--bg-main` passa a ser um claro muito suave com gradiente discreto, não um branco chapado — é a condição para o efeito escolhido continuar legível.
- Tokenizar os ~59 literais de `index.css` e os 27 inline dos `.tsx`, para que nenhuma cor fique fora do sistema.
- Recalibrar `TrendChart` para fundo claro: grade, tooltip, eixos e preenchimento dos pontos.
- Redesenhar o fundo e o texto em gradiente do `Login`.
- Resolver a legibilidade da logomarca néon sobre fundo claro.
- Auditar contraste segundo WCAG AA — `--text-muted` (#94a3b8) sobre branco fica em ~2.5:1 e reprova; precisa escurecer.

## Capabilities

### Modified Capabilities
- `core-ui`: paleta, superfícies e contraste da interface passam a ser claros.

## Impact

- **`frontend/src/index.css`** (757 linhas) — tokens, `.glass-panel`, `.navbar`, `.input-field`, `.btn`, `.data-table`, badges, sombras.
- **13 arquivos `.tsx`** com cor inline: `Guards`, `NotificationBell`, `SectorSelector`, `StarRating`, `StatusCard`, `TrendChart`, `UnitSelector`, `AbrirChamado`, `ChangePassword`, `DetalhesChamado`, `Login`, `Relatorios`, `Usuarios`.
- **Relatório em PDF melhora sem alteração de código:** `POST /api/reports/pdf` recebe o gráfico renderizado no cliente via `html-to-image` e o cola numa página branca do PDFKit. Hoje entra um gráfico escuro numa folha branca; com o tema claro passa a ficar coerente. Vale verificar, não alterar.
- **Nenhuma mudança de backend, schema ou API.**

## Non-goals

- Alternador claro/escuro ou persistência de preferência. O tema claro é fixo; a disciplina de tokens mantém um toggle viável no futuro sem refazer o trabalho.
- Suporte a `prefers-color-scheme`.
- Redesenho de layout, tipografia, espaçamento ou hierarquia de informação — só cor e superfície mudam.
- Redesenho da logomarca. Se for preciso um ativo claro da marca, ele é insumo externo; a change entrega a acomodação no layout.
- Alterar o gerador de PDF do backend.
- Adotar biblioteca de UI ou framework de CSS.
