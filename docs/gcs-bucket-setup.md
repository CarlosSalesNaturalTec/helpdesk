# Configuração do Bucket GCS para Anexos

Para que o upload de anexos de chamados funcione no HelpDesk em produção, é necessário criar um bucket no Google Cloud Storage (GCS) e configurá-lo corretamente.

## Passo a Passo

### 1. Criar o Bucket

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Navegue até **Cloud Storage > Buckets**.
3. Clique em **Criar Bucket**.
4. **Nome**: escolha um nome único (ex: `helpdesk-attachments-seu-projeto`).
5. **Região**: escolha a mesma região do Cloud Run e do Cloud SQL (ex: `us-central1`).
6. **Controle de Acesso**: certifique-se de marcar a opção **Uniform bucket-level access** (Acesso uniforme no nível do bucket).
7. Clique em **Criar**.

### 2. Configurar Acesso Público de Leitura

Os arquivos upados precisam ser públicos para poderem ser exibidos no frontend.

1. Na lista de buckets, clique no nome do seu novo bucket.
2. Vá para a aba **Permissões**.
3. Clique em **Conceder Acesso** (Grant Access).
4. No campo "Novos principais", digite `allUsers`.
5. No campo "Selecionar um papel", escolha **Cloud Storage > Visualizador de objetos do Storage** (Storage Object Viewer).
6. Clique em **Salvar**. (Vai aparecer um aviso perguntando se deseja tornar público; confirme).

### 3. Configurar CORS (Cross-Origin Resource Sharing)

O frontend precisará fazer requisições para exibir imagens, etc.

1. Crie um arquivo local chamado `cors.json` com o seguinte conteúdo:
   ```json
   [
     {
       "origin": ["https://helpdesk-frontend-SEU-PROJETO.storage.googleapis.com", "http://localhost:5173"],
       "method": ["GET", "HEAD", "OPTIONS"],
       "responseHeader": ["Content-Type"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
   *Substitua a URL pela URL real do seu frontend no GCS/Cloud Run*.

2. Aplique a política usando a CLI do Google Cloud:
   ```bash
   gcloud storage buckets update gs://NOME_DO_SEU_BUCKET --cors-file=cors.json
   ```

### 4. Permissão para o Cloud Run

A API Node.js (rodando no Cloud Run) precisa de permissão de escrita/deleção (Storage Object Admin).

1. Identifique a Service Account do seu serviço Cloud Run (geralmente `SEU-PROJECT-NUMBER-compute@developer.gserviceaccount.com`).
2. Acesse **IAM e Administrador > IAM** no Google Cloud Console.
3. Edite as permissões da Service Account do Cloud Run.
4. Adicione o papel **Administrador de objetos do Storage** (Storage Object Admin).
5. (Alternativamente, adicione essa permissão apenas no nível do bucket específico na aba "Permissões" do bucket).

### 5. Atualizar Configurações do Projeto

1. Anote o nome do bucket criado.
2. Atualize a variável `_GCS_BUCKET_NAME` no arquivo `cloudbuild.yaml` na raiz do repositório.
3. Para testes locais, adicione o nome em `.env` local (`GCS_BUCKET_NAME=nome-do-bucket`).
