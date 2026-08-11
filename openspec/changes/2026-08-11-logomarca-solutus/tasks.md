## 1. Geração dos ativos

- [x] 1.1 A partir de `docs/images/logo_solutos.jpg`, gerar os derivados com fundo transparente: `logo-vertical` (largura 360 px), `logo-horizontal` e `mark` (altura 80 px), cada um em WebP e PNG.
- [x] 1.2 Gerar `favicon.png` (32 px), `apple-touch-icon.png` (180 px) e salvar em `frontend/public/`.
- [x] 1.3 Versionar os derivados em `frontend/src/assets/brand/` e conferir que o total dos ativos fica abaixo de ~150 KB.
- [x] 1.4 Gerar `logo-print.png` (fundo branco, ~240 px de largura) em `backend/src/assets/`.

## 2. Componente BrandLogo

- [x] 2.1 Criar `frontend/src/components/BrandLogo.tsx` com props `variant: 'mark' | 'horizontal' | 'vertical'` e `height`, renderizando `<picture>` com fonte WebP e fallback PNG.
- [x] 2.2 Derivar o `alt` de `APP_NAME` (`frontend/src/config.ts`) e definir `decoding="async"`.

## 3. Aplicação nas telas

- [x] 3.1 Inserir `<BrandLogo variant="horizontal" height={40} />` no `.nav-brand` do `Layout.tsx`, à esquerda do nome, sem alterar a altura de 70 px da navbar.
- [x] 3.2 Inserir `<BrandLogo variant="vertical" height={120} />` acima do título em `Login.tsx`, ajustando o espaçamento do bloco de cabeçalho.
- [x] 3.3 Inserir a variante `mark` em `ChangePassword.tsx`, mantendo o painel de 460 px equilibrado.
- [x] 3.4 Substituir o favicon do Vite em `frontend/index.html` e adicionar `apple-touch-icon` e `theme-color`.
- [x] 3.5 Remover `frontend/public/favicon.svg` (ativo do template) se não houver mais referências.

## 4. Logomarca no PDF de relatórios

- [x] 4.1 Inserir `doc.image()` com `logo-print.png` no cabeçalho gerado em `backend/src/routes/reports.ts:32`, envolvido em `try/catch` que cai para o cabeçalho textual em caso de falha.
- [x] 4.2 Adicionar o `COPY` de `backend/src/assets/` na etapa de runtime do `Dockerfile` e confirmar que o caminho resolve a partir de `backend/dist/`.

## 5. Verificação

- [x] 5.1 Buildar o frontend e conferir que os ativos entram em `frontend/dist/` com hash e que o `<title>`/favicon carregam.
- [x] 5.2 Conferir visualmente navbar, login e troca de senha — contraste da marca sobre o fundo escuro e alinhamento vertical.
- [x] 5.3 Gerar um PDF de relatório localmente e confirmar a logomarca no cabeçalho.
- [x] 5.4 Buildar a imagem Docker, subir o container e gerar um PDF confirmando que o ativo do backend está presente na etapa de runtime. Validado com `docker build` (Docker Desktop local): a etapa `RUN apk add --no-cache openssl` precisou de um mirror HTTP temporário no `Dockerfile` (não commitado) só para contornar a inspeção TLS corporativa (proxy Fortinet) desta rede — o `Dockerfile` do repositório não foi alterado. Dentro da imagem gerada, `backend/src/assets/logo-print.png` está presente em `/app/backend/src/assets/` e o caminho relativo calculado por `LOGO_PRINT_PATH` a partir de `backend/dist/routes/` resolve corretamente. Um PDF de teste gerado dentro do container via `doc.image(LOGO_PRINT_PATH, ...)` produziu um PDF válido de 1 página (28.637 bytes) com a logo embutida.
