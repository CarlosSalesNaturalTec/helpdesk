# Tarefas — Frontend no Firebase Hosting

Ordem deliberada: **`base: '/'` antes de qualquer coisa de hospedagem** (tarefa 2.1). Publicar o fallback com base relativa produz o pior resultado possível — `/login` funciona, `/chamados/123` serve tela branca, e a change parece pronta.

## 1. Infraestrutura (uma vez, manual)

- [x] 1.1 Habilitar Firebase no projeto GCP existente (`firebase projects:addfirebase helpdesk-499614`) e confirmar que o site padrão `helpdesk-499614.web.app` foi criado. (~1h)
- [x] 1.2 Ativar a API `firebasehosting.googleapis.com` e conceder `roles/firebasehosting.admin` à service account do Cloud Build. (~1h)
- [x] 1.3 Fazer um `firebase deploy --only hosting` manual, a partir de um `frontend/dist/` buildado localmente, só para validar credenciais e reescritas antes de tocar no pipeline. Feito via Cloud Shell; o primeiro deploy publicou só o app (o build do manual havia sido pulado), corrigido num segundo build+deploy que incluiu `mkdocs build --strict`. Uma tentativa de deploy também sofreu falha transitória de rede (`retries exhausted`) no meio do upload — sem publicar nada quebrado — resolvida ao repetir o comando. (~1h)

## 2. Frontend

- [x] 2.1 `frontend/vite.config.ts`: `base: './'` → `base: '/'`. Rebuildar e confirmar que o `index.html` gerado referencia `/assets/…` (barra inicial), não `./assets/…`. (~1h)
- [x] 2.2 Criar `firebase.json` na raiz: `public: "frontend/dist"`, reescritas na ordem `/manual/**` → `/manual/404.html` e depois `**` → `/index.html`, e headers de cache (`/assets/**` imutável por 1 ano; `**/*.html` `no-cache`). (~2h)
- [x] 2.3 Criar `.firebaserc` apontando para o projeto `helpdesk-499614`. (~30min)

## 3. Expiração de sessão sem recarregar a página

- [x] 3.1 `frontend/src/api/client.ts`: no interceptor de 401, remover `localStorage.removeItem` + `window.location.href` e disparar `window.dispatchEvent(new Event('auth:unauthorized'))`. Preservar a exceção que ignora `/api/auth/login`, para que credencial inválida continue exibindo o erro na tela em vez de deslogar. (~1h)
- [x] 3.2 `frontend/src/context/AuthContext.tsx`: registrar listener de `auth:unauthorized` num `useEffect` que chama `logout()`, com remoção do listener no cleanup. O `ProtectedRoute` já redireciona para `/login` quando `user` é `null` — nenhuma navegação explícita é necessária. (~2h)
- [x] 3.3 Verificar manualmente: com a aplicação aberta, apagar o token do `localStorage`, disparar uma ação que chame a API, e confirmar que a tela vai para `/login` **sem recarregar a página** (o spinner do React não deve piscar como recarga completa). (~1h)

## 4. Pipeline

- [x] 4.1 `cloudbuild.yaml`, estágio `deploy-frontend`: substituir o `gsutil rsync` + os três `gsutil setmeta` por `npm install -g firebase-tools` e `firebase deploy --only hosting --project ${PROJECT_ID} --non-interactive`, em imagem `node:20`. O cache passa a ser responsabilidade do `firebase.json`. (~2h)
- [x] 4.2 Atualizar as substituições: `_FRONTEND_URL: https://helpdesk-499614.web.app`. Trocar o `ALLOWED_ORIGIN` do `gcloud run deploy`, que hoje é montado a partir de `_FRONTEND_BUCKET`, para usar `${_FRONTEND_URL}`. (~1h)
- [x] 4.3 Remover a substituição `_FRONTEND_BUCKET`, agora sem uso. Manter `_VITE_API_URL` e `_GCS_BUCKET_NAME` (bucket de anexos) intactos. (~30min)
- [x] 4.4 Confirmar que `build-docs` segue rodando entre `build-frontend` e `deploy-frontend`, e que o `SITE_URL` passado ao MkDocs agora resolve para `https://helpdesk-499614.web.app/manual/`. (~1h)

## 5. Verificação em produção

Não há suíte automatizada; a verificação é manual, contra o ambiente publicado.

- [x] 5.1 Rotas do SPA carregadas **diretamente por URL**: `/login`, `/dashboard`, `/chamados`, `/relatorios`, `/usuarios` — todas 200 via `curl`. Renderização visual ainda não confirmada.
- [x] 5.2 **Deep link aninhado** confirmado em navegador real — o caso que a `base: './'` quebraria. Funcionou.
- [x] 5.3 F5 em tela autenticada confirmado em navegador real, sem erro de servidor.
- [x] 5.4 Manual: `/manual/index.html` (200), `/manual/` (200 — antes era 404), `/manual/perfis/tecnico.html` (200, arquivo real), e `/manual/pagina-que-nao-existe` (o **conteúdo** é o 404 do manual, confirmado pelo `<h1>404 - Not found</h1>`, sem vazamento da SPA — mas o **status HTTP vem 200, não 404**, porque toda `rewrite` do Firebase Hosting responde 200 independente do destino. Ver nota em `design.md`. Busca do MkDocs não testada nesta rodada — verificar visualmente.
- [x] 5.5 Login completo ponta a ponta confirmado em navegador real, a partir de `https://helpdesk-499614.web.app` — CORS aceito após a correção de `ALLOWED_ORIGIN` em 5.6.
- [x] 5.6 Conferido: as demais variáveis sobreviveram, mas `FRONTEND_URL` e `ALLOWED_ORIGIN` ainda apontavam para o bucket antigo — esperado, já que os deploys manuais via Cloud Shell só publicaram o Hosting, nunca rodaram `gcloud run deploy` com a config nova do `cloudbuild.yaml`. Corrigido manualmente com `gcloud run services update --update-env-vars` (revisão `helpdesk-backend-00037-f78`), adiantando o valor que o pipeline aplicará quando a branch for mergeada na `main`. Confirmado por `describe` após o update.
- [ ] 5.7 Disparar uma notificação por e-mail real e clicar no link do chamado — é o deep link que nunca funcionou; deve abrir a tela do chamado.
- [x] 5.8 Confirmado via `curl -I`: asset versionado retorna `Cache-Control: public, max-age=31536000, immutable`; `index.html` retorna `Cache-Control: no-cache`.
- [ ] 5.9 Expiração de sessão de ponta a ponta: deixar a aplicação aberta além dos 15 min do JWT, agir na tela e confirmar redirecionamento limpo para `/login`, sem `NoSuchKey` e sem recarga de página.

## 6. Documentação

- [x] 6.1 `docs/Deploy_GCP.md`: reescrever o Passo 8 ("Build e Deploy do Frontend no Cloud Storage" → "…no Firebase Hosting"), remover a criação do bucket de frontend e o `--web-main-page-suffix`/`--web-error-page` (que nunca tiveram efeito no endpoint usado), atualizar Passo 9 (trigger), Passo 10 (verificação) e a tabela de custos. (~3h)
- [x] 6.2 `docs/Deploy_GCP.md`: reescrever as duas notas de "Atenção" sobre `NoSuchKey` em URLs terminadas em `/` e sobre deep links do SPA — deixam de ser limitações aceitas e passam a ser comportamento resolvido. Ajustar também a nota sobre exclusão de `/manual/` em load balancer. (~1h)
- [x] 6.3 `docs/manual/operacao/deploy.md` e `docs/manual/operacao/arquitetura.md`: o frontend deixa de ser servido por Cloud Storage. Atualizar a descrição da arquitetura e do fluxo de publicação. (~2h)
- [x] 6.4 `CLAUDE.md`: tabela de serviços GCP (linha "Frontend"), descrição dos estágios do pipeline e a nota sobre `FRONTEND_URL` precisar de load balancer para deep links — que deixa de ser verdade. (~1h)
- [x] 6.5 `.env.example`: atualizar os exemplos de `FRONTEND_URL` e `ALLOWED_ORIGIN` para a nova origem. (~30min)
- [x] 6.6 `frontend/src/components/Layout.tsx:149`: o comentário explica que o link do manual aponta para `/manual/index.html` porque "o endpoint do bucket resolve apenas chaves exatas". Deixa de ser verdade; atualizar o comentário. O `href` pode permanecer como está — continua válido. (~30min)

## 7. Descomissionamento

- [ ] 7.1 **Depois** de 5.1–5.9 aprovadas, esvaziar e remover o bucket `helpdesk-frontend-helpdesk-499614`. Enquanto ele existir, o rollback é reverter o `cloudbuild.yaml`. Não tocar em `helpdesk-attachments-helpdesk-499614`. (~1h)
- [ ] 7.2 Comunicar a nova URL e substituir o favorito quebrado (`…storage.googleapis.com/login`) por `https://helpdesk-499614.web.app`. (~30min)
