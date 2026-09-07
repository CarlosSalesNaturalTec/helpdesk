## ADDED Requirements

### Requirement: Expiração de sessão redireciona sem recarregar a página
Quando uma chamada de API autenticada retornar 401, o frontend SHALL encerrar a sessão local e conduzir o usuário à tela de Login por navegação do roteador do cliente, SEM provocar recarga completa da página pelo navegador.

A resposta 401 da própria rota de login SHALL ser excluída desse tratamento: credencial inválida é erro de formulário, exibido na tela, e não expiração de sessão.

#### Scenario: Token expira durante o uso
- **WHEN** o JWT de 15 minutos expira e o usuário dispara qualquer ação que chame a API
- **THEN** a sessão local é limpa e a aplicação exibe a tela de Login por navegação do cliente, preservando a aplicação carregada em memória

#### Scenario: Sessão expirada não depende da hospedagem
- **WHEN** a sessão expira em qualquer rota da aplicação
- **THEN** o redirecionamento NÃO emite uma requisição de documento ao servidor de hospedagem, e portanto não pode falhar por resolução de rota

#### Scenario: Credencial inválida no login
- **WHEN** o usuário submete e-mail ou senha incorretos e a API responde 401
- **THEN** a mensagem de erro é exibida no formulário de Login, sem limpeza de sessão nem redirecionamento

#### Scenario: Sessão ausente na abertura da aplicação
- **WHEN** a aplicação é aberta sem token válido armazenado
- **THEN** a verificação inicial de sessão falha silenciosamente, o usuário permanece deslogado, e a tela de Login é apresentada uma única vez — sem redirecionamento adicional disparado pelo tratamento de 401
