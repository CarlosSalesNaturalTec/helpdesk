## MODIFIED Requirements

### Requirement: Criação de usuário
O sistema SHALL permitir a criação de usuários com os campos obrigatórios: nome completo, e-mail (único no sistema), função (Solicitante, Técnico, Gestor de TI, Diretor), Unidade vinculada e senha inicial temporária. Adicionalmente, se a função selecionada for "Técnico", a seleção de um **Setor** passa a ser obrigatória. Para outras funções, o Setor é opcional ou não aplicável. O e-mail DEVE ser validado como único antes da criação.

#### Scenario: Admin cria usuário Técnico
- **WHEN** o Administrador do Sistema seleciona a função "Técnico" ao criar um usuário
- **THEN** o campo "Setor" se torna visível e obrigatório, e o usuário só pode ser salvo após a escolha de um Setor

#### Scenario: Admin cria usuário em qualquer Unidade
- **WHEN** o Administrador do Sistema acessa a tela de Usuários e aciona "Novo Usuário", preenche todos os campos, seleciona qualquer Unidade, e confirma
- **THEN** o usuário é criado com status ativo, vinculado à Unidade e função selecionadas, e pode realizar login com a senha temporária

#### Scenario: Diretor cria usuário restrito à sua Unidade
- **WHEN** um Diretor da "Unidade A" acessa a tela de Usuários, aciona "Novo Usuário", preenche los campos, e a Unidade é automaticamente preenchida como "Unidade A" e bloqueada para edição
- **THEN** o usuário é criado ativo, vinculado exclusivamente à "Unidade A"

#### Scenario: E-mail duplicado é rejeitado
- **WHEN** um gestor tenta criar um usuário com e-mail "joao@empresa.com" que já existe no sistema
- **THEN** o sistema exibe "Já existe um usuário com este e-mail" e impede a criação

#### Scenario: Gestor de TI não pode alterar a Unidade do usuário
- **WHEN** um Gestor de TI da "Unidade A" tenta cadastrar ou editar um usuário
- **THEN** o campo Unidade é bloqueado e não pode ser alterado para nenhuma Unidade que não seja a "Unidade A"

### Requirement: Edição de usuário
O sistema SHALL permitir a edição de nome, e-mail, função, status de usuários e Setor (caso aplicável), respeitando o escopo de Unidade do usuário logado. Se a função for alterada para "Técnico", o Setor DEVE se tornar obrigatório. O e-mail editado DEVE permanecer único no sistema.

#### Scenario: Admin edita qualquer usuário e altera função
- **WHEN** o Admin altera a função de um "Solicitante" para "Técnico"
- **THEN** o sistema passa a exigir o preenchimento do campo "Setor" antes de permitir salvar

#### Scenario: Admin edita qualquer usuário
- **WHEN** o Admin edita um usuário de qualquer Unidade e altera seus dados
- **THEN** as alterações são salvas e refletidas no sistema

#### Scenario: Diretor edita apenas usuários da sua Unidade
- **WHEN** um Diretor da "Unidade A" tenta acessar a rota de edição de um usuário da "Unidade B"
- **THEN** o sistema retorna HTTP 404
