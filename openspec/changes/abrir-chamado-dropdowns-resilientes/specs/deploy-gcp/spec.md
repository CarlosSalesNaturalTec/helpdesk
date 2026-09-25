# Delta Spec: deploy-gcp

## MODIFIED Requirements

### Requirement: cloudbuild.yaml com pipeline CI/CD
O projeto SHALL conter um arquivo `cloudbuild.yaml` na raiz que defina uma pipeline CI/CD no Google Cloud Build com trigger automático no push para a branch `main`, executando 5 stages sequenciais: build e push da imagem Docker, deploy no Cloud Run, build do frontend, build do manual do usuário (MkDocs), e publicação do frontend (aplicação e manual juntos) no **Firebase Hosting**.

O estágio de publicação SHALL usar `firebase deploy --only hosting`, autenticado pelas Application Default Credentials da service account do Cloud Build — sem token de longa duração armazenado em segredo.

O deploy no Cloud Run SHALL incluir `--cpu-boost`, que concede CPU adicional durante a inicialização do container. Como o container executa `prisma migrate deploy` antes de atender a primeira requisição e o serviço roda com `--min-instances=0`, toda instância nova paga esse custo de inicialização; a flag encurta essa janela sem gerar custo de instância ociosa.

#### Scenario: Push na main dispara pipeline
- **WHEN** um commit é pushado para a branch `main`
- **THEN** o Cloud Build builda a imagem Docker, faz push para o Artifact Registry, implanta no Cloud Run, builda o frontend com `VITE_API_URL` apontando para a URL do Cloud Run, builda o manual com MkDocs dentro de `frontend/dist/manual/`, e publica `frontend/dist/` no Firebase Hosting

#### Scenario: Deploy aplica aceleração de inicialização
- **WHEN** a etapa de deploy executa `gcloud run deploy`
- **THEN** o comando inclui `--cpu-boost` e o serviço publicado apresenta a aceleração de CPU na inicialização

#### Scenario: Pipeline falha em stage intermediário
- **WHEN** o build do Docker falha no Stage 1
- **THEN** os stages subsequentes não são executados, e o Cloud Build reporta falha com o log do stage que quebrou

#### Scenario: Build do manual falha
- **WHEN** `mkdocs build --strict` falha (ex.: link interno quebrado no Markdown fonte)
- **THEN** a etapa `build-docs` falha e a pipeline é interrompida antes da publicação — o backend já está no ar, mas nem a aplicação nem o manual são atualizados, evitando publicar um manual desatualizado silenciosamente

#### Scenario: Service account sem permissão no Firebase Hosting
- **WHEN** a service account do Cloud Build não possui `roles/firebasehosting.admin`
- **THEN** o estágio de publicação falha com erro de autorização, e a versão anterior do frontend permanece publicada — sem estado parcial
