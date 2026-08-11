## Context

O arquivo de origem é `docs/images/logo_solutos.jpg`: JPEG progressivo, **725 × 1280 px**, 69 KB. É uma imagem em **orientação retrato** (proporção ≈ 0,57), o que é inadequado para uso direto numa navbar de 70 px de altura — esticada ali, ficaria com ~40 px de largura ou estouraria o cabeçalho.

Os pontos de aplicação previstos têm formatos muito diferentes:

| Ponto | Espaço disponível | Formato adequado |
| --- | --- | --- |
| Navbar (`.navbar`, `height: 70px`) | ~40 px de altura | marca horizontal ou ícone |
| Login / Troca de Senha (painel de 420 px) | ~120 px de altura | marca vertical (a original) |
| Favicon / apple-touch-icon | 32–180 px quadrado | ícone recortado |
| Cabeçalho do PDF (PDFKit) | ~80 pt de largura | PNG, fundo branco |

## Goals / Non-Goals

**Goals:**
- Ativos derivados, dimensionados e otimizados para cada contexto, entrando no bundle do Vite.
- Um único componente controlando o uso da marca no frontend.
- Nenhuma degradação perceptível no tempo de carregamento do login.

**Non-Goals:**
- Redesenhar a logomarca ou produzir uma versão vetorial a partir do JPEG (é uma imagem rasterizada; a vetorização é trabalho de design, não de implementação).
- Branding dinâmico por cliente.

## Decisions

- **Derivar ativos em vez de usar o JPEG original.** Servir 725 × 1280 px para um slot de 40 px desperdiça banda e fica borrado por *downscale* do navegador. Serão gerados: `logo-vertical` (360 px de largura, login), `logo-horizontal`/`mark` (altura 80 px, navbar), `favicon` (32/180 px) e `logo-print.png` (para o PDF).
- **WebP com fallback PNG**, via `<picture>` dentro do `BrandLogo`. O JPEG progressivo original não tem canal alfa; o fundo escuro da aplicação (`--bg-main`) exige transparência ou um recorte com fundo compatível — resolvido na geração dos ativos.
- **O original permanece em `docs/images/`** como arquivo-mestre, e os derivados vão para `frontend/src/assets/brand/`. Importar direto de `docs/` colocaria a pasta de documentação dentro do grafo de build do Vite.
- **`BrandLogo` com variantes `mark | horizontal | vertical` e prop `height`.** Componentizar evita repetir `<picture>`/`srcSet` em quatro telas e concentra num só lugar o `alt` (derivado de `APP_NAME`, da change de branding) e o `loading`/`decoding`.
- **PDF: PNG embarcado, não a mesma importação do frontend.** O backend roda em Node e não tem o pipeline do Vite; o ativo fica em `backend/src/assets/` e é lido do disco com `doc.image()`. É preciso incluir a pasta no `COPY` da etapa de runtime do `Dockerfile`, senão o PDF quebra em produção mas funciona localmente.
- **Falha do logo não pode quebrar o relatório.** A inserção da imagem no PDFKit fica em `try/catch`, caindo para o cabeçalho apenas textual — mesma postura *fail-soft* já adotada em notificações.

## Risks / Trade-offs

- **[Risco] O PDF quebra em produção por ativo ausente na imagem do container** (o `Dockerfile` copia apenas `dist/` e `node_modules`).
  - *Mitigação*: `COPY` explícito da pasta de ativos + o `try/catch` acima; validar num deploy de teste, não só localmente.
- **[Risco] Contraste ruim da marca sobre o fundo escuro**, caso o original tenha fundo claro embutido.
  - *Mitigação*: gerar os derivados com fundo transparente e conferir visualmente em navbar e login antes de fechar a change.
- **[Risco] Peso do bundle.** Se somados os derivados passarem de ~150 KB, revisar as dimensões antes de mesclar.
- **[Dependência]** O `alt` e o texto ao lado da marca dependem de `APP_NAME`; implementar após `2026-08-11-branding-configuravel-solutus`.
