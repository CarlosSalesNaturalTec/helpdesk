# Design — Tema claro

## A tensão central: "vidro" com "fundo branco"

O efeito escolhido foi manter o glassmorphism em versão clara. Vale registrar o conflito, porque ele determina a paleta:

```
backdrop-filter: blur(12px) borra O QUE ESTÁ ATRÁS do elemento.
Sobre um #ffffff chapado, não há nada para borrar — o efeito
custa GPU e produz zero resultado visual.
```

**Resolução:** `--bg-main` não é branco puro. É um claro muito suave, com um gradiente discreto que dá substrato ao vidro. Os **cartões** são o branco translúcido. A percepção de "fundo branco" é preservada; o vidro continua existindo.

```
┌──────────────────────────────────────────────┐
│  --bg-main: gradiente #ffffff → #eef2f8      │
│  ┌────────────────────────────────────────┐  │
│  │ .glass-panel                           │  │
│  │   background rgba(255,255,255,0.72)    │  │
│  │   backdrop-filter blur(12px)           │  │
│  │   border 1px rgba(15,23,42,0.08)       │  │
│  │   box-shadow 0 4px 24px rgba(15,23,42,│  │
│  │              0.06)                     │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## Inversão dos tokens

| Token | Hoje | Depois | Nota |
|---|---|---|---|
| `--bg-main` | `#0b0f19` | gradiente `#ffffff`→`#eef2f8` | substrato do vidro |
| `--bg-card` | `rgba(22,28,45,.7)` | `rgba(255,255,255,.72)` | o vidro |
| `--bg-card-solid` | `#161c2d` | `#ffffff` | modais, dropdowns |
| `--text-main` | `#f8fafc` | `#0f172a` | ~16:1 sobre branco |
| `--text-muted` | `#94a3b8` | `#475569` | **ver contraste abaixo** |
| `--border` | `rgba(255,255,255,.08)` | `rgba(15,23,42,.10)` | inverte o alpha |
| `--shadow-card` | `0 4px 30px rgba(0,0,0,.4)` | `0 4px 24px rgba(15,23,42,.06)` | sombra escura pesa em claro |
| `--primary` | `#6366f1` | mantém | passa AA sobre branco |
| `--*-glow` | halos coloridos | reduzir alpha / usar como tint de fundo | glow em claro vira mancha |

`--primary`, `--success`, `--danger` e `--warning` **mantêm o matiz** — a identidade não muda. O que muda é o papel dos `*-glow`: em fundo escuro eles são halo luminoso; em fundo claro viram tint de superfície (fundo suave de badge/card), não sombra colorida.

## Contraste — o achado que obriga mudança de valor

`--text-muted: #94a3b8` sobre `#ffffff` dá ≈ **2.5:1**. WCAG AA exige 4.5:1 para texto normal. Esse token é usado em `.form-label` e em vários textos secundários — hoje passa porque o fundo é escuro. Em claro, reprova.

Por isso a tabela leva `#475569` (≈ 7:1). Não é ajuste estético; é requisito.

Mesma verificação necessária para: badges de papel, badges de status, texto sobre `--primary`, e estados `:disabled` (`opacity: .6` sobre claro apaga mais do que sobre escuro).

## A logomarca néon

`assets/brand/logo-horizontal.png` é néon ciano/roxo com glow, desenhado para fundo escuro. Em fundo claro perde contraste.

Três saídas, em ordem de preferência:

1. **Cápsula escura atrás da logo na navbar** — um bloco arredondado escuro contendo apenas a marca. Não exige ativo novo, resolve o contraste e vira um acento deliberado no layout.
2. **Variante clara da marca** — melhor resultado visual, mas depende de ativo externo que não existe no repositório.
3. **Manter como está** — não recomendado; a marca fica lavada logo na primeira tela.

A change adota a **opção 1** e mantém a 2 possível: `BrandLogo.tsx` já resolve variantes por um mapa (`VARIANTS`), então acrescentar um par claro depois é aditivo.

## Ordem de execução

Tokens primeiro, componentes depois. Ao inverter o `:root` antes de tokenizar os literais, a interface fica temporariamente quebrada de um jeito **útil**: cada resquício de cor escura hardcoded salta à vista e vira um item da lista. É o modo mais barato de encontrar os 27 inline sem caçá-los um a um.

## Efeito colateral positivo

`POST /api/reports/pdf` recebe o gráfico renderizado no cliente por `html-to-image` e o insere numa página branca do PDFKit. Hoje o resultado é um gráfico escuro numa folha branca. Com o `TrendChart` recalibrado, o PDF fica coerente sem tocar no backend. Entra como verificação, não como tarefa de implementação.
