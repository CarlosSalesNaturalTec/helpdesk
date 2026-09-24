## MODIFIED Requirements

### Requirement: Criação de usuário
O sistema SHALL permitir a criação de usuários com os campos obrigatórios: nome completo, **CPF (único no sistema)**, **telefone**, e-mail (único no sistema), função (Solicitante, Técnico, Gestor, Diretor), Unidade vinculada e senha inicial temporária. Adicionalmente, se a função selecionada for "Técnico" ou "Gestor", a seleção de um **Setor** passa a ser obrigatória. Para outras funções, o Setor é opcional ou não aplicável. O e-mail e o CPF DEVEM ser validados como únicos antes da criação.

#### Scenario: Admin cria usuário Técnico
- **WHEN** o Administrador do Sistema seleciona a função "Técnico" ao criar um usuário
- **THEN** o campo "Setor" se torna visível e obrigatório, e o usuário só pode ser salvo após a escolha de um Setor

#### Scenario: Admin cria usuário em qualquer Unidade
- **WHEN** o Administrador do Sistema acessa a tela de Usuários e aciona "Novo Usuário", preenche todos os campos, seleciona qualquer Unidade, e confirma
- **THEN** o usuário é criado com status ativo, vinculado à Unidade e função selecionadas, e pode realizar login com a senha temporária

#### Scenario: Diretor cria usuário restrito à sua Unidade
- **WHEN** um Diretor da "Unidade A" acessa a tela de Usuários, aciona "Novo Usuário", preenche os campos, e a Unidade é automaticamente preenchida como "Unidade A" e bloqueada para edição
- **THEN** o usuário é criado ativo, vinculado exclusivamente à "Unidade A"

#### Scenario: E-mail duplicado é rejeitado
- **WHEN** um gestor tenta criar um usuário com e-mail "joao@empresa.com" que já existe no sistema
- **THEN** o sistema exibe "Já existe um usuário com este e-mail" e impede a criação

#### Scenario: Gestor não pode alterar a Unidade do usuário
- **WHEN** um Gestor da "Unidade A" tenta cadastrar ou editar um usuário
- **THEN** o campo Unidade é bloqueado e não pode ser alterado para nenhuma Unidade que não seja a "Unidade A"

#### Scenario: Criação sem CPF ou telefone é rejeitada
- **WHEN** um gestor tenta criar um usuário deixando o CPF ou o telefone em branco
- **THEN** o sistema impede a criação e sinaliza o campo faltante

#### Scenario: CPF duplicado é rejeitado
- **WHEN** um gestor tenta criar um usuário com um CPF já cadastrado para outra pessoa
- **THEN** o sistema exibe uma mensagem indicando a duplicidade e impede a criação
- **AND** nenhum erro técnico de banco de dados é exposto ao usuário

### Requirement: Edição de usuário
O sistema SHALL permitir a edição de nome, **CPF**, **telefone**, e-mail, função, status de usuários e Setor (caso aplicável), respeitando o escopo de Unidade do usuário logado. Se a função for alterada para "Técnico" ou "Gestor", o Setor DEVE se tornar obrigatório. O e-mail e o CPF editados DEVEM permanecer únicos no sistema.

CPF e telefone SHALL ser exigidos ao salvar qualquer edição, inclusive de usuários cadastrados antes da introdução desses campos — é assim que a base se completa gradualmente.

#### Scenario: Admin edita qualquer usuário e altera função
- **WHEN** o Admin altera a função de um "Solicitante" para "Técnico"
- **THEN** o sistema passa a exigir o preenchimento do campo "Setor" antes de permitir salvar

#### Scenario: Admin edita qualquer usuário
- **WHEN** o Admin edita um usuário de qualquer Unidade e altera seus dados
- **THEN** as alterações são salvas e refletidas no sistema

#### Scenario: Diretor edita apenas usuários da sua Unidade
- **WHEN** um Diretor da "Unidade A" tenta acessar a rota de edição de um usuário da "Unidade B"
- **THEN** o sistema retorna HTTP 404

#### Scenario: Editar usuário legado exige completar o cadastro
- **WHEN** um Admin edita a Unidade de um usuário cadastrado antes da introdução do CPF, cujos campos CPF e telefone estão vazios
- **THEN** o sistema exige o preenchimento de ambos antes de salvar qualquer alteração

## ADDED Requirements

### Requirement: Formato de CPF e telefone
O sistema SHALL validar o CPF quanto ao **formato** `000.000.000-00`, sem conferir dígitos verificadores, e SHALL garantir sua unicidade entre os usuários.

O telefone SHALL ser informado com DDD, aceitando tanto linha fixa quanto celular, **sem máscara** — apenas dígitos.

A mesma validação SHALL valer no cliente e no servidor, a partir do schema compartilhado.

#### Scenario: CPF fora do formato é rejeitado
- **WHEN** um gestor informa um CPF sem a pontuação esperada
- **THEN** o sistema sinaliza o formato inválido e impede o salvamento

#### Scenario: CPF com dígitos verificadores inconsistentes é aceito
- **WHEN** um gestor informa um CPF no formato correto cujos dígitos verificadores não conferem
- **THEN** o sistema aceita o valor, pois a conferência de dígitos está fora do escopo desta validação

#### Scenario: Telefone fixo é aceito
- **WHEN** um gestor informa um telefone fixo com DDD, somente dígitos
- **THEN** o valor é aceito

#### Scenario: Telefone com máscara é rejeitado
- **WHEN** um gestor informa o telefone com parênteses, espaços ou hífen
- **THEN** o sistema sinaliza o formato inválido e impede o salvamento

#### Scenario: Validação idêntica no servidor
- **WHEN** uma requisição de criação ou edição chega diretamente à API com CPF ou telefone fora do formato
- **THEN** o servidor rejeita a requisição, sem depender da validação do cliente

### Requirement: Usuários anteriores à introdução do CPF
O sistema SHALL permitir que usuários cadastrados antes da introdução de CPF e telefone permaneçam ativos e operantes com esses campos vazios, sem qualquer bloqueio de acesso.

#### Scenario: Usuário legado continua operando
- **WHEN** um usuário cadastrado antes da mudança, sem CPF nem telefone, realiza login
- **THEN** ele acessa o sistema normalmente, sem ser redirecionado para completar o cadastro

#### Scenario: Vários usuários legados coexistem sob a restrição de unicidade
- **WHEN** a base contém múltiplos usuários sem CPF preenchido
- **THEN** a restrição de unicidade do CPF não é violada e nenhuma operação falha por esse motivo
