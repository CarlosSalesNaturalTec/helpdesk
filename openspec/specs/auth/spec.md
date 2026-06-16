# Spec: Autenticação (auth)

Autenticação local de usuários com proteção contra acessos indevidos. Este módulo gerencia login, senhas e controle de sessão sem depender de serviços externos de diretório.

## Purpose
TBD

## Requirements

### Requirement: Login com e-mail e senha
O sistema SHALL autenticar usuários mediante e-mail e senha. Credenciais inválidas DEVEM gerar mensagem genérica "E-mail ou senha inválidos" sem distinguir entre e-mail inexistente e senha incorreta. Usuários desativados DEVEM ser bloqueados com a mensagem "Usuário desativado. Entre em contato com o administrador."

#### Scenario: Login bem-sucedido
- **WHEN** um usuário com cadastro ativo informa e-mail e senha corretos e aciona "Entrar"
- **THEN** o sistema retorna um token JWT, armazena a sessão e redireciona para a tela inicial correspondente ao perfil do usuário: Dashboard para Técnico, Gestor de TI, Diretor e Administrador; Abrir Chamado para Solicitante

#### Scenario: Credenciais inválidas
- **WHEN** um usuário informa e-mail inexistente ou senha incorreta e aciona "Entrar"
- **THEN** o sistema retorna HTTP 401 com a mensagem "E-mail ou senha inválidos" e NÃO revela qual campo está incorreto

#### Scenario: Usuário desativado tenta login
- **WHEN** um usuário com cadastro desativado informa credenciais válidas
- **THEN** o sistema retorna HTTP 403 com a mensagem "Usuário desativado. Entre em contato com o administrador." e bloqueia o acesso

### Requirement: Senha com hash criptográfico
O sistema SHALL armazenar senhas de forma irreversível utilizando bcrypt com salt. Nenhuma senha em texto plano DEVE ser armazenada no banco de dados ou em logs.

#### Scenario: Senha armazenada com hash
- **WHEN** um usuário é criado ou altera sua senha
- **THEN** o sistema armazena apenas o hash bcrypt da senha, nunca o texto plano

### Requirement: Proteção contra força bruta
O sistema SHALL bloquear temporariamente o acesso após 5 tentativas consecutivas de login com senha incorreta para o mesmo e-mail. O bloqueio DEVE durar 15 minutos. Durante o bloqueio, o sistema DEVE exibir a mensagem "Muitas tentativas falhas. Tente novamente em 15 minutos." e NÃO DEVE distinguir se o e-mail existe ou não.

#### Scenario: Bloqueio após 5 falhas
- **WHEN** um usuário erra a senha 5 vezes consecutivas para o mesmo e-mail
- **THEN** na 6ª tentativa, o sistema bloqueia o acesso por 15 minutos e exibe "Muitas tentativas falhas. Tente novamente em 15 minutos."

#### Scenario: Bloqueio expira
- **WHEN** o período de 15 minutos de bloqueio expira e o usuário informa a senha correta
- **THEN** o sistema permite o login normalmente e reseta o contador de tentativas

### Requirement: Primeiro login com senha temporária
O sistema SHALL forçar o usuário a alterar a senha no primeiro acesso realizado com senha temporária. O usuário NÃO DEVE conseguir acessar nenhuma outra funcionalidade do sistema até que defina uma nova senha pessoal.

#### Scenario: Login com senha temporária força alteração
- **WHEN** um usuário realiza login com senha temporária definida pelo gestor
- **THEN** o sistema retorna um token JWT com flag `mustChangePassword: true` e o frontend redireciona obrigatoriamente para a tela de "Alteração de Senha"

#### Scenario: Tentativa de acessar funcionalidades sem alterar senha
- **WHEN** um usuário autenticado com flag `mustChangePassword: true` tenta acessar qualquer rota que não seja a de alteração de senha
- **THEN** o sistema redireciona para a tela de "Alteração de Senha" e impede o acesso

#### Scenario: Senha alterada com sucesso
- **WHEN** o usuário define uma nova senha que atende aos critérios (mínimo 6 caracteres) e confirma
- **THEN** o sistema atualiza o hash da senha, remove a flag `mustChangePassword`, e redireciona o usuário para a tela inicial de seu perfil
