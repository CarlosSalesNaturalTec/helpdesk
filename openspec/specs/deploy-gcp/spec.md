# Deploy GCP

## Purpose
TBD

## Requirements

### Requirement: Dockerfile multi-stage para backend
O projeto DEVE conter um `Dockerfile` na raiz do repositório que produza uma imagem Docker otimizada para o backend, resolvendo corretamente a dependência do workspace `@helpdesk/shared`.

#### Scenario: Build da imagem Docker
- **WHEN** o comando `docker build -t helpdesk-backend .` é executado na raiz do repositório
- **THEN** a imagem é construída com sucesso em dois estágios (build com TypeScript + runtime Alpine enxuto), o tamanho final da imagem é inferior a 300MB, e o container expõe a porta 3001

#### Scenario: Container inicia e responde
- **WHEN** o container é executado com as variáveis de ambiente corretas (`DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGIN`)
- **THEN** o backend responde a `GET /api/health` com `{ "status": "ok" }` em menos de 5 segundos

### Requirement: .dockerignore
O projeto DEVE conter um `.dockerignore` na raiz que exclua diretórios e arquivos desnecessários do build context Docker, incluindo `frontend/`, `docs/`, `.git/`, `node_modules/`, arquivos de ambiente local e configurações de IDE.

#### Scenario: Build context não inclui frontend
- **WHEN** o build Docker é executado
- **THEN** o diretório `frontend/` não é copiado para nenhum estágio da imagem, e a imagem final não contém código do frontend

### Requirement: .env.example com todas as variáveis de ambiente
O projeto DEVE conter um arquivo `.env.example` na raiz documentando todas as variáveis de ambiente necessárias para desenvolvimento e produção, com exemplos de valores e indicação de quais são obrigatórias.

#### Scenario: Desenvolvedor configura ambiente a partir do .env.example
- **WHEN** um desenvolvedor copia `.env.example` para `.env` e preenche as variáveis
- **THEN** todas as variáveis necessárias estão documentadas com comentários explicativos, incluindo: `DATABASE_URL`, `JWT_SECRET`, `SENDGRID_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`, `ALLOWED_ORIGIN`, `PORT`, `HOST`, `GCS_BUCKET_NAME`, `VITE_API_URL`
- **THEN** os nomes documentados correspondem exatamente aos lidos pelo backend, já que uma variável com nome divergente não gera erro e o serviço passa a usar silenciosamente o valor padrão do código

### Requirement: CORS parametrizável no backend
O backend SHALL ler a origem permitida para CORS da variável de ambiente `ALLOWED_ORIGIN`, com fallback para `*` quando a variável não estiver definida, mantendo compatibilidade com desenvolvimento local.

O valor de `ALLOWED_ORIGIN` SHALL ser a origem do frontend publicado, derivada da mesma fonte que `FRONTEND_URL`, para que as duas não divirjam.

#### Scenario: CORS em produção com origem específica
- **WHEN** `ALLOWED_ORIGIN=https://helpdesk-499614.web.app` está definida
- **THEN** o header `Access-Control-Allow-Origin` nas respostas é exatamente `https://helpdesk-499614.web.app` (origem exata, não wildcard)

#### Scenario: Origem divergente da hospedagem
- **WHEN** o frontend é servido em uma origem diferente da configurada em `ALLOWED_ORIGIN`
- **THEN** o navegador bloqueia as chamadas de API e a aplicação não consegue autenticar — motivo pelo qual `ALLOWED_ORIGIN` e `FRONTEND_URL` são derivadas do mesmo valor no pipeline

#### Scenario: CORS em desenvolvimento local sem variável definida
- **WHEN** `ALLOWED_ORIGIN` não está definida no ambiente
- **THEN** o header `Access-Control-Allow-Origin` é `*` (fallback), mantendo o comportamento atual

### Requirement: URL da API configurável no frontend
O frontend DEVE ler a URL da API da variável de ambiente `VITE_API_URL` em tempo de build, com fallback para `http://localhost:3001` quando não definida.

#### Scenario: Build de produção com API remota
- **WHEN** o frontend é buildado com `VITE_API_URL=https://helpdesk-api-xxxxx-uc.a.run.app`
- **THEN** todas as chamadas de API do frontend usam `https://helpdesk-api-xxxxx-uc.a.run.app` como base URL

#### Scenario: Dev local sem variável definida
- **WHEN** o frontend roda em modo dev (`npm run dev`) sem `VITE_API_URL` definida
- **THEN** as chamadas de API usam `http://localhost:3001` como base URL (fallback)

### Requirement: Toda rota do SPA carregável diretamente por URL
A hospedagem do frontend SHALL servir `index.html` para qualquer caminho que não corresponda a um arquivo estático existente, de modo que toda rota do React Router seja alcançável por acesso direto — URL digitada, favorito, recarga (F5), link externo ou link de e-mail.

A reescrita para `/manual/**` SHALL ter precedência sobre a reescrita geral, apontando para a página 404 do próprio manual, para que o SPA não capture rotas inexistentes do manual.

#### Scenario: Rota do SPA digitada na barra de endereço
- **WHEN** um usuário acessa `https://<url-do-frontend>/login` diretamente
- **THEN** a hospedagem responde 200 servindo `index.html`, e o roteador do cliente renderiza a tela de Login

#### Scenario: Recarga em rota autenticada
- **WHEN** um usuário autenticado pressiona F5 em `/dashboard`, `/chamados` ou `/relatorios`
- **THEN** a página recarrega e renderiza a mesma tela, sem erro do servidor

#### Scenario: Deep link aninhado vindo de e-mail de notificação
- **WHEN** um usuário clica em `${FRONTEND_URL}/chamados/{id}` no corpo de um e-mail de notificação
- **THEN** a aplicação carrega e exibe a tela de detalhes daquele chamado

#### Scenario: Arquivo estático existente não é reescrito
- **WHEN** o navegador requisita `/assets/index-<hash>.js` ou `/manual/perfis/tecnico.html`
- **THEN** o arquivo real é servido, sem passar pela reescrita para `index.html`

#### Scenario: Rota inexistente sob o prefixo do manual
- **WHEN** alguém acessa `/manual/pagina-que-nao-existe`
- **THEN** a resposta é a página 404 do manual, não o `index.html` da aplicação

### Requirement: Base absoluta para os assets do frontend
O build do frontend SHALL gerar referências absolutas aos assets (`/assets/...`), e NÃO relativas (`./assets/...`).

Com base relativa, uma rota aninhada servida por reescrita resolveria os assets contra o diretório da rota — `/chamados/123` buscaria `/chamados/assets/...` e renderizaria uma página em branco. A base absoluta é condição para o fallback de SPA funcionar em qualquer profundidade de rota.

#### Scenario: Assets de uma rota de primeiro nível
- **WHEN** `/login` é servido pela reescrita
- **THEN** o `index.html` referencia `/assets/...` e os arquivos são carregados com status 200

#### Scenario: Assets de uma rota aninhada
- **WHEN** `/chamados/{id}` é servido pela reescrita
- **THEN** os assets são requisitados em `/assets/...` e NÃO em `/chamados/assets/...`, e a tela renderiza normalmente

### Requirement: Cache de longa duração para assets versionados por hash
Os assets gerados pelo build com hash de conteúdo no nome SHALL ser publicados com `Cache-Control: public, max-age=31536000, immutable`. Documentos HTML — da aplicação e do manual — SHALL continuar com `Cache-Control: no-cache`.

Como o nome do arquivo muda sempre que o conteúdo muda, revalidação periódica não oferece garantia adicional e apenas consome banda e latência.

#### Scenario: Asset versionado é servido
- **WHEN** o navegador requisita `/assets/index-<hash>.js`
- **THEN** a resposta traz `Cache-Control: public, max-age=31536000, immutable`

#### Scenario: HTML é servido
- **WHEN** o navegador requisita `/index.html` ou qualquer página do manual
- **THEN** a resposta traz `Cache-Control: no-cache`, e uma nova publicação aparece no carregamento seguinte sem purga manual

### Requirement: cloudbuild.yaml com pipeline CI/CD
O projeto SHALL conter um arquivo `cloudbuild.yaml` na raiz que defina uma pipeline CI/CD no Google Cloud Build com trigger automático no push para a branch `main`, executando 5 stages sequenciais: build e push da imagem Docker, deploy no Cloud Run, build do frontend, build do manual do usuário (MkDocs), e publicação do frontend (aplicação e manual juntos) no **Firebase Hosting**.

O estágio de publicação SHALL usar `firebase deploy --only hosting`, autenticado pelas Application Default Credentials da service account do Cloud Build — sem token de longa duração armazenado em segredo.

#### Scenario: Push na main dispara pipeline
- **WHEN** um commit é pushado para a branch `main`
- **THEN** o Cloud Build builda a imagem Docker, faz push para o Artifact Registry, implanta no Cloud Run, builda o frontend com `VITE_API_URL` apontando para a URL do Cloud Run, builda o manual com MkDocs dentro de `frontend/dist/manual/`, e publica `frontend/dist/` no Firebase Hosting

#### Scenario: Pipeline falha em stage intermediário
- **WHEN** o build do Docker falha no Stage 1
- **THEN** os stages subsequentes não são executados, e o Cloud Build reporta falha com o log do stage que quebrou

#### Scenario: Build do manual falha
- **WHEN** `mkdocs build --strict` falha (ex.: link interno quebrado no Markdown fonte)
- **THEN** a etapa `build-docs` falha e a pipeline é interrompida antes da publicação — o backend já está no ar, mas nem a aplicação nem o manual são atualizados, evitando publicar um manual desatualizado silenciosamente

#### Scenario: Service account sem permissão no Firebase Hosting
- **WHEN** a service account do Cloud Build não possui `roles/firebasehosting.admin`
- **THEN** o estágio de publicação falha com erro de autorização, e a versão anterior do frontend permanece publicada — sem estado parcial

### Requirement: Etapa `build-docs` gera o manual do usuário com MkDocs
A pipeline DEVE incluir uma etapa `build-docs`, executada com uma imagem Python (`python:3.12-slim`), que instala as dependências de `requirements-docs.txt` e roda `mkdocs build --strict`. Essa etapa DEVE rodar depois da etapa que builda o frontend com Vite (que limpa `frontend/dist/` no início do seu build) e antes da etapa de publicação, para que o manual sobreviva no mesmo diretório de saída publicado.

#### Scenario: Ordem das etapas no pipeline
- **WHEN** a pipeline executa `build-frontend`, depois `build-docs`, depois `deploy-frontend`
- **THEN** `frontend/dist/` contém tanto os artefatos do Vite quanto `frontend/dist/manual/` no momento em que `deploy-frontend` roda o `firebase deploy`

### Requirement: `SITE_URL` do MkDocs aponta para o prefixo publicado do manual
A etapa `build-docs` DEVE passar a variável `SITE_URL` para o `mkdocs build`, composta a partir da URL do frontend (`_FRONTEND_URL`) mais o prefixo `/manual/`, para que páginas geradas fora da navegação normal (como `404.html`) referenciem corretamente esse prefixo em vez da raiz da hospedagem.

#### Scenario: Build de produção
- **WHEN** a etapa `build-docs` roda com `SITE_URL="${_FRONTEND_URL}/manual/"`
- **THEN** os links absolutos gerados pelo tema (CSS, JS, navegação em `404.html`) apontam para `/manual/...`, não para `/...`

#### Scenario: Build local sem `SITE_URL`
- **WHEN** um desenvolvedor roda `mkdocs build` ou `mkdocs serve` localmente, sem definir `SITE_URL`
- **THEN** o build usa o valor default (`http://localhost:8000/manual/`) e continua funcionando, sem exigir a variável de ambiente para desenvolvimento local

### Requirement: Guia de deploy no GCP
O projeto DEVE conter um arquivo `docs/Deploy_GCP.md` com instruções passo-a-passo para realizar o deploy completo da aplicação no Google Cloud Platform, cobrindo desde a criação do projeto GCP até a verificação final.

#### Scenario: Desenvolvedor segue o guia do zero
- **WHEN** um desenvolvedor com acesso a um projeto GCP limpo segue o guia `Deploy_GCP.md` do início ao fim
- **THEN** ao final ele tem: Cloud SQL PostgreSQL 15 rodando, backend no Cloud Run respondendo, frontend servido no Firebase Hosting, e pipeline CI/CD configurada com Cloud Build trigger

### Requirement: Estrutura do Deploy_GCP.md
O guia de deploy SHALL conter as seguintes seções, nesta ordem:

1. Visão Geral da Arquitetura GCP (diagrama ASCII)
2. Pré-requisitos (gcloud CLI, Firebase CLI, Docker, projeto GCP com billing)
3. Serviços GCP e Custos Estimados (tabela com serviço, tier, custo mensal estimado)
4. Passo 1: Criar projeto GCP e habilitar APIs
5. Passo 2: Configurar Cloud SQL (PostgreSQL 15)
6. Passo 3: Criar Artifact Registry
7. Passo 4: Configurar Secret Manager
8. Passo 5: Build e Push da imagem Docker
9. Passo 6: Deploy no Cloud Run
10. Passo 7: Rodar migrations do Prisma
11. Passo 8: Build e Deploy do Frontend no Firebase Hosting
12. Passo 9: Configurar Cloud Build Trigger (CI/CD)
13. Passo 10: Verificação e Testes
14. Troubleshooting (problemas comuns e soluções)

O Passo 8 SHALL cobrir: habilitar o Firebase no projeto GCP existente, ativar `firebasehosting.googleapis.com`, conceder `roles/firebasehosting.admin` à service account do Cloud Build, e o conteúdo de `firebase.json` e `.firebaserc`.

#### Scenario: Guia contém todas as seções obrigatórias
- **WHEN** o arquivo `docs/Deploy_GCP.md` é gerado
- **THEN** ele contém exatamente as 14 seções listadas, nesta ordem, cada uma com comandos exatos e verificáveis

#### Scenario: Guia não instrui configuração de website no bucket
- **WHEN** um desenvolvedor segue o Passo 8
- **THEN** o guia NÃO instrui a criar bucket de frontend nem a configurar `--web-main-page-suffix` / `--web-error-page`, opções que não têm efeito no endpoint XML do Cloud Storage e cuja presença no guia induzia à conclusão errada de que o fallback de SPA estava configurado

### Requirement: Comandos gcloud copiáveis
Todos os comandos no guia de deploy DEVEM ser completos e copiáveis — incluindo placeholders entre `<>` com explicação do que substituir, nomes de recursos consistentes com prefixo `helpdesk-` ao longo de todo o guia.

#### Scenario: Desenvolvedor copia e cola comandos
- **WHEN** um desenvolvedor copia qualquer bloco de comando do guia e substitui apenas os placeholders `<>`
- **THEN** o comando executa com sucesso sem necessidade de ajustes adicionais

### Requirement: Tabela de custos estimados
O guia de deploy DEVE incluir uma tabela realista de custos mensais estimados para cada serviço GCP utilizado, assumindo volume baixo (50-300 chamados/mês), sem reserva de recursos, tier gratuito quando aplicável.

#### Scenario: Stakeholder avalia viabilidade financeira
- **WHEN** um gestor lê a seção de custos do guia de deploy
- **THEN** ele encontra uma estimativa mensal total entre $25-40 USD para operação em produção com o volume de uso descrito no PRD
