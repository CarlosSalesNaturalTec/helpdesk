## Why

A aplicação não possui nenhum ativo visual de marca: o login e a navbar exibem apenas texto com gradiente CSS, e o favicon (`frontend/public/favicon.svg`) ainda é o do template do Vite. A logomarca já existe no repositório (`docs/images/logo_solutos.jpg`), mas está numa pasta de documentação — não é servida pelo frontend nem entra no build.

Com a adoção do nome SOLUTUS, a marca precisa aparecer nos pontos de contato visuais do produto.

## What Changes

- Derivar da logomarca original um conjunto de ativos web otimizados e versioná-los em `frontend/src/assets/brand/` (formato WebP com fallback PNG, além do favicon).
- Criar o componente `frontend/src/components/BrandLogo.tsx`, com variantes de tamanho, que centraliza a exibição da marca.
- Aplicar o componente em: tela de Login (acima do título), navbar do `Layout` (à esquerda do nome), tela de Troca de Senha e página de erro/carregamento inicial.
- Substituir o favicon do Vite pelo ícone da marca e adicionar `apple-touch-icon` e `manifest` mínimo em `frontend/index.html`.
- Incluir a logomarca no cabeçalho do PDF de relatórios (`backend/src/routes/reports.ts`), hoje apenas textual.

## Capabilities

### New Capabilities
- Nenhuma.

### Modified Capabilities
- `core-ui`: a identidade do sistema passa a incluir a logomarca, além do nome textual, na navbar, no login e no favicon.
- `reports-pdf`: o PDF gerado passa a exibir a logomarca no cabeçalho.

## Impact

- **Frontend:** novos ativos em `src/assets/brand/`, novo componente `BrandLogo.tsx`, alterações em `Layout.tsx`, `Login.tsx`, `ChangePassword.tsx`, `index.html`, `public/`.
- **Backend:** `routes/reports.ts` (PDFKit `doc.image()`) e um ativo PNG embarcado na imagem do container.
- **Build:** o `Dockerfile` precisa copiar o diretório de ativos do backend para a etapa de runtime.
- **Banco de dados:** nenhum impacto.

## Non-goals

- Upload de logomarca por cliente via interface administrativa — a marca é um ativo versionado, coerente com a decisão de branding em tempo de build.
- Redesenhar a paleta de cores, a tipografia ou o tema escuro atual da aplicação.
- Inserir a logomarca em e-mails: os templates em `services/email.ts` são texto puro (`text:`), e convertê-los para HTML é escopo próprio.
- Criar uma tela institucional ("sobre") ou splash screen.
- Ajustes de responsividade da navbar — tratados na change `2026-08-11-responsividade-mobile`.
