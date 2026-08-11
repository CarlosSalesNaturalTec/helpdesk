## Context

Estado atual verificado no código:

| Elemento | Situação | Efeito em 375 px |
| --- | --- | --- |
| `index.css` (477 linhas) | 0 media queries | nenhuma adaptação |
| `App.css` | tem media queries, mas **não é importado** | código morto |
| `.navbar` | `height: 70px`, `padding: 0 40px`, flex em linha | transborda com 7 links |
| `.main-content` | `padding: 40px` | ~295 px úteis de conteúdo |
| `.data-table-container` | `overflow: hidden` | tabela cortada, sem rolagem |
| `Chamados.tsx:191-201` | `th` com `width` fixo (90/70/120 px) | tabela mais larga que a viewport |
| `DetalhesChamado.tsx:364` | `gridTemplateColumns: '2fr 1fr'` | duas colunas espremidas |
| `Login.tsx:65`, `ChangePassword.tsx:83` | `width: 420px` / `460px` | painel maior que a tela |
| `index.html:6` | `viewport` presente | único ponto já correto |

O maior obstáculo estrutural não é a falta de CSS, e sim que o layout vive majoritariamente em inline styles (112 em `DetalhesChamado.tsx`, 47 em `AbrirChamado.tsx`), que **media queries não alcançam**.

## Goals / Non-Goals

**Goals:**
- Nenhuma rolagem horizontal da página em 360 px de largura, em todas as telas.
- Navegação completa acessível em smartphone, para todos os 5 perfis.
- Alvos de toque de ao menos 44 px em elementos interativos.

**Non-Goals:**
- Extrair todos os inline styles; redesenho visual; PWA.

## Decisions

- **Mobile-first por adição, não por reescrita.** Os estilos de desktop atuais permanecem como base e os breakpoints refinam para baixo. Inverter para mobile-first de verdade exigiria reescrever as 477 linhas — risco desproporcional para um app já em produção.
- **Dois breakpoints, não uma escala completa.** `≤1024px` (tablet) e `≤640px` (smartphone) cobrem os casos reais; mais pontos multiplicam a superfície de teste sem ganho.
- **Migração cirúrgica de inline styles.** Só migram para classe os inline styles que **precisam** mudar por breakpoint: `gridTemplateColumns`, larguras fixas de painel, paddings de contêiner e larguras de `th`. Os demais (cores, gradientes, espaçamentos internos) ficam onde estão. Critério objetivo que evita que a change vire uma refatoração aberta.
- **Menu hambúrguer com estado local no `Layout`.** `useState` mais uma classe `.nav-open`; sem biblioteca de UI nova. O painel fecha em cada mudança de `location.pathname` — o `Layout` já observa `useLocation()`.
- **Tabelas: rolagem no tablet, cartões no smartphone.** Trocar `overflow: hidden` por `overflow-x: auto` resolve tablet com uma linha. Em `Chamados.tsx`, tela mais usada e com 7 colunas, rolagem horizontal ainda seria ruim em telefone — daí o layout de cartões abaixo de 640 px, renderizando os mesmos dados sem chamada de API adicional.
- **Remover `App.css`.** Não é importado; mantê-lo induz a editar o arquivo errado ao procurar as media queries existentes.

## Risks / Trade-offs

- **[Risco] Regressão visual no desktop** ao mover inline styles para classes.
  - *Mitigação*: migrar uma tela por vez, conferindo em 1440 px antes de aplicar o breakpoint; não há testes automatizados no repositório, então a verificação é manual e obrigatória.
- **[Risco] Duplicação de marcação** entre tabela e cartões em `Chamados.tsx`.
  - *Mitigação*: extrair um `TicketCard` reaproveitando os mesmos dados; alternar por CSS, não por JS, evitando *layout shift* na troca de orientação.
- **[Risco] `Dashboard` e `Relatorios` usam Recharts**, cujo dimensionamento pode não acompanhar o contêiner.
  - *Mitigação*: confirmar `ResponsiveContainer` e definir altura mínima; o snapshot do PDF continua em largura de desktop (fora do escopo).
- **[Risco] Sino de notificações e dropdown** posicionados de forma absoluta podem vazar da viewport.
  - *Mitigação*: incluir `NotificationBell` na verificação de cada breakpoint.
