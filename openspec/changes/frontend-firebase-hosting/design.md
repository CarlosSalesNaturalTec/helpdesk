# Design — Frontend no Firebase Hosting

## O problema em uma linha

O endpoint que serve o frontend não sabe o que é um SPA.

```
   navegador                 XML API do Cloud Storage
   ─────────                 ────────────────────────
   GET /login        ───►    procura a chave "login" no bucket
                             não existe  ───►  404 NoSuchKey

   (MainPageSuffix e NotFoundPage, configurados no Passo 8 do guia,
    valem SOMENTE no website endpoint c.storage.googleapis.com,
    que exige domínio customizado e não oferece HTTPS.)
```

Toda rota do React Router é uma chave inexistente. O app só funciona porque `/index.html` existe e o roteamento acontece depois, dentro do navegador — a barra de endereço passa a exibir `/login`, mas essa URL nunca foi carregável pelo servidor.

## Por que Firebase Hosting

Sem domínio próprio, três candidatos sobraram:

| | URL final | Cold start na 1ª pintura | CORS | Custo |
|---|---|---|---|---|
| **Firebase Hosting** | `helpdesk-499614.web.app/login` | não (CDN) | permanece | R$ 0 |
| Cloud Run serve o SPA | `helpdesk-backend-….run.app/login` | **sim, ~5s** | eliminado | R$ 0 |
| HashRouter | `…storage.googleapis.com/index.html#/login` | não | permanece | R$ 0 |

Load Balancer HTTPS foi descartado antes: certificado gerenciado do Google exige domínio, e não haverá domínio próprio.

**Cloud Run servindo o SPA** é tecnicamente a opção mais limpa — mesma origem elimina o CORS por completo. Foi recusada pelo `min-instances=0`: o cold start de ~5s deixaria de atrasar só a API e passaria a atrasar a **primeira pintura da tela**, num sistema que as pessoas abrem várias vezes ao dia. Corrigir isso exigiria `min-instances=1`, custo recorrente que a opção escolhida não tem.

**HashRouter** resolve com uma linha, mas fixa a URL em 81 caracteres com um `#` no meio e obriga a mudar `email.ts`. Como o favorito do usuário tem de mudar de qualquer forma, o ganho de "não mexer na infra" não compensa a URL.

## A armadilha do `base: './'`

O `index.html` publicado hoje referencia `./assets/index-CXZWQ2z8.js`. Com fallback de SPA ativo, o caminho relativo é resolvido **contra o diretório da rota**:

```
rota servida            ./assets/x.js resolve para
────────────            ──────────────────────────
/login            ───►  /assets/x.js          ✅
/chamados/123     ───►  /chamados/assets/x.js ❌  tela branca
```

Esse é o modo de falha perverso da change: `/login` passa no teste, a equipe considera resolvido, e o deep link do e-mail — o caso que motivou tudo — quebra em silêncio. **`base: '/'` não é ajuste opcional; é condição para o fallback funcionar.**

## Ordem das reescritas no `firebase.json`

O Firebase serve arquivo estático existente **antes** de avaliar reescritas, e avalia as reescritas **em ordem**. Isso dá o comportamento desejado sem regra de exclusão:

```
/manual/perfis/tecnico.html  → arquivo existe        → servido direto
/manual/                     → índice de diretório   → manual/index.html
/manual/inexistente          → rewrite 1             → manual/404.html
/chamados/123                → rewrite 2 (catch-all) → index.html  → SPA roteia
```

```json
"rewrites": [
  { "source": "/manual/**", "destination": "/manual/404.html" },
  { "source": "**",         "destination": "/index.html" }
]
```

Contraste com o Load Balancer, onde esquecer de excluir `/manual/**` faz o SPA capturar as rotas do manual — erro que o `Deploy_GCP.md:385` já antecipava. Aqui a precedência natural do produto resolve.

Efeito colateral positivo: `/manual/` (URL terminada em `/`) passa a funcionar, o que hoje é 404 documentado como aceito.

**Limitação verificada em produção:** toda `rewrite` do Firebase Hosting responde com status HTTP **200**, independentemente do conteúdo do destino — inclusive quando o destino é uma página de erro. `/manual/pagina-que-nao-existe` serve o conteúdo correto (`404.html` do MkDocs, confirmado pelo `<h1>404 - Not found</h1>` no corpo — não a casca do React), mas com status 200 em vez de 404. É comportamento documentado da plataforma, não um defeito desta configuração: uma `rewrite` estática não pode alterar o código de status sem uma função (Cloud Functions), fora do escopo desta change. O conteúdo certo, sem a SPA vazando para dentro do manual, é o que importa aqui — o status HTTP incorreto é aceito como limitação conhecida.

## Redirecionamento na expiração de sessão

Um interceptor do Axios vive fora da árvore React e não pode usar `useNavigate`. Duas saídas:

| | Como | Avaliação |
|---|---|---|
| **Evento no `window`** | interceptor dispara `auth:unauthorized`; `AuthContext` escuta e chama `logout()`; `user` vira `null` e o `ProtectedRoute` já renderiza `<Navigate to="/login">` | **escolhida** — usa o fluxo de guarda que já existe |
| Referência mutável de `navigate` | um componente dentro do `BrowserRouter` grava `navigate` num módulo que o interceptor lê | funciona, mas cria estado global implícito e acopla o cliente HTTP ao roteador |

Detalhe importante: o `refreshUser()` do `AuthContext` **já** trata o 401 do `/api/auth/me` — ele limpa o token e zera o usuário no `catch`. Nesse caminho o `window.location.href` do interceptor é redundante *e* nocivo. A correção o remove; o restante do fluxo já estava certo.

## Cache

Os assets são versionados por hash no nome (`index-CXZWQ2z8.js`). `max-age=3600` neste caso é desperdício puro: o navegador revalida de hora em hora um arquivo cujo nome muda sempre que o conteúdo muda.

| Alvo | Hoje | Depois |
|---|---|---|
| `/assets/**` | `max-age=3600` | `max-age=31536000, immutable` |
| `**/*.html` (app e manual) | `no-cache` | `no-cache` (mantém) |

Isso deixa de ser só performance no Firebase: o plano Spark tem cota de **360 MB/dia de transferência**, e o bundle é ~850 KB. Com revalidação horária, algumas dezenas de usuários ativos chegam perto do teto; com cache imutável, o custo por usuário vira uma carga por deploy.

## Autenticação do deploy

`firebase-tools` usa Application Default Credentials quando não recebe token. No Cloud Build isso é a service account do build, via metadata server — nada de `FIREBASE_TOKEN` em Secret Manager.

Pré-requisitos de infra (uma vez):
1. Habilitar Firebase no projeto GCP existente (`firebase projects:addfirebase helpdesk-499614`).
2. Ativar a API `firebasehosting.googleapis.com`.
3. Conceder `roles/firebasehosting.admin` à service account do Cloud Build.

Se o passo 3 for esquecido, o `firebase deploy` falha com 403 no estágio 5 — o backend já terá subido no estágio 2, e o frontend fica na versão anterior. Falha visível, sem estado inconsistente.

## Risco adjacente observado (não corrigido aqui)

O `gcloud run deploy` do estágio 2 usa **quatro** flags `--set-env-vars` no mesmo comando. Flag repetida no `gcloud` normalmente segue "a última vence", em vez de acumular — o que apagaria `GCS_BUCKET_NAME`, `EMAIL_FROM`, `FRONTEND_URL`, `APP_NAME` e `CLIENT_NAME`, mantendo só `ALLOWED_ORIGIN`. Como esta change altera justamente `ALLOWED_ORIGIN`, entra uma **tarefa de verificação** (5.6) para inspecionar as variáveis do serviço após o deploy. Consolidar as flags é correção separada, fora do escopo.

## Descomissionamento do bucket

O bucket `helpdesk-frontend-helpdesk-499614` permite `storage.objects.list` anônimo — hoje qualquer um enumera seu conteúdo. São apenas assets públicos, então não há vazamento, mas o bucket fica sem função após a migração. Removê-lo é a última tarefa, **depois** da validação em produção, para preservar o rollback: enquanto ele existir, reverter é voltar o `cloudbuild.yaml`.
