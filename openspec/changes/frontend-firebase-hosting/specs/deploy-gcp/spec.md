## ADDED Requirements

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

## MODIFIED Requirements

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
