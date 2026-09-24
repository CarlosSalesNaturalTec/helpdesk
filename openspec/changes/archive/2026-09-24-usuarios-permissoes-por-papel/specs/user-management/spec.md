## ADDED Requirements

### Requirement: Matriz de papéis gerenciáveis
O sistema SHALL restringir, no servidor, quais papéis cada perfil pode listar, criar, editar e desativar:

- **Administrador:** todos os papéis, em qualquer Unidade.
- **Diretor:** Solicitante, Técnico e Gestor da própria Unidade.
- **Gestor:** Solicitante da própria Unidade, e Técnico da própria Unidade **e** do próprio Tipo de Ocorrência.

Na edição, a regra SHALL valer tanto para o estado atual do usuário alvo quanto para o estado resultante após a edição. Um alvo cujo estado atual está fora do escopo SHALL ser tratado como inexistente (HTTP 404). Um payload que atribua papel, Unidade ou Tipo de Ocorrência fora do escopo SHALL ser rejeitado com HTTP 403, sem persistir nada. A mesma matriz SHALL ser usada pela interface para oferecer apenas as opções permitidas.

#### Scenario: Gestor tenta criar um Administrador via API
- **WHEN** um Gestor envia `POST /api/usuarios` com `role: "ADMIN"`
- **THEN** o sistema retorna HTTP 403 e nenhum usuário é criado

#### Scenario: Diretor tenta criar outro Diretor
- **WHEN** um Diretor envia `POST /api/usuarios` com `role: "DIRETOR"`
- **THEN** o sistema retorna HTTP 403 e nenhum usuário é criado

#### Scenario: Diretor cria Gestor
- **WHEN** um Diretor da "Unidade A" cria um usuário com papel "Gestor" e Tipo de Ocorrência "Manutenção"
- **THEN** o usuário é criado na "Unidade A"

#### Scenario: Gestor cria Técnico da própria área
- **WHEN** um Gestor de "Manutenção" da "Unidade A" cria um Técnico de "Manutenção"
- **THEN** o usuário é criado na "Unidade A" com Tipo de Ocorrência "Manutenção"

#### Scenario: Gestor tenta criar Técnico de outra área
- **WHEN** um Gestor de "Manutenção" envia a criação de um Técnico de "Tecnologia"
- **THEN** o sistema retorna HTTP 403 e nenhum usuário é criado

#### Scenario: Gestor tenta editar o Diretor da Unidade
- **WHEN** um Gestor da "Unidade A" envia `PUT /api/usuarios/:id` para o Diretor da "Unidade A"
- **THEN** o sistema retorna HTTP 404 e nenhuma alteração é feita

#### Scenario: Gestor tenta editar Técnico de outra área
- **WHEN** um Gestor de "Manutenção" envia `PUT` para um Técnico de "Tecnologia" da mesma Unidade
- **THEN** o sistema retorna HTTP 404

#### Scenario: Gestor tenta promover Solicitante a Gestor
- **WHEN** um Gestor edita um Solicitante da própria Unidade alterando o papel para "Gestor"
- **THEN** o sistema retorna HTTP 403 e o papel permanece "Solicitante"

#### Scenario: Diretor tenta editar ou desativar um Admin vinculado à sua Unidade
- **WHEN** um Diretor da "Unidade A" envia `PUT` ou `PATCH /deactivate` para um Administrador cuja Unidade é "Unidade A"
- **THEN** o sistema retorna HTTP 404

#### Scenario: Interface oferece apenas papéis permitidos
- **WHEN** um Gestor abre o formulário de novo usuário
- **THEN** o seletor de papel exibe apenas "Solicitante" e "Técnico"
- **AND** ao escolher "Técnico", o Tipo de Ocorrência vem preenchido com a área do Gestor e não pode ser alterado

### Requirement: Auto-edição restrita a dados pessoais
O sistema SHALL permitir que o usuário logado edite, pela gestão de usuários, os próprios dados pessoais (nome, CPF, telefone, e-mail e senha temporária). O sistema SHALL rejeitar com HTTP 403 qualquer tentativa de alterar o próprio papel, a própria Unidade ou o próprio Tipo de Ocorrência, inclusive quando o operador for Administrador.

#### Scenario: Gestor tenta se promover
- **WHEN** um Gestor envia `PUT /api/usuarios/{seu próprio id}` com `role: "DIRETOR"`
- **THEN** o sistema retorna HTTP 403 e o papel permanece "Gestor"

#### Scenario: Gestor corrige o próprio telefone
- **WHEN** um Gestor edita o próprio cadastro alterando apenas o telefone
- **THEN** a alteração é salva

#### Scenario: Interface trava campos de escopo na auto-edição
- **WHEN** o usuário abre a edição do próprio cadastro
- **THEN** os campos de papel, Unidade e Tipo de Ocorrência aparecem desabilitados

## MODIFIED Requirements

### Requirement: Listagem de usuários com escopo
O sistema SHALL listar usuários respeitando o escopo do papel logado, conforme a matriz de papéis gerenciáveis, sempre incluindo o próprio usuário logado. Admin vê todos os usuários; Diretor vê Solicitantes, Técnicos e Gestores de sua Unidade; Gestor vê Solicitantes de sua Unidade e Técnicos de sua Unidade e do seu Tipo de Ocorrência.

#### Scenario: Admin lista todos os usuários
- **WHEN** o Admin acessa a listagem de usuários
- **THEN** o sistema retorna todos os usuários de todas as Unidades

#### Scenario: Diretor lista usuários de sua Unidade
- **WHEN** um Diretor da "Unidade A" acessa a listagem de usuários
- **THEN** o sistema retorna os Solicitantes, Técnicos e Gestores vinculados à "Unidade A", além do próprio Diretor
- **AND** outros Diretores e Administradores NÃO são retornados

#### Scenario: Gestor lista usuários da sua área
- **WHEN** um Gestor de "Manutenção" da "Unidade A" acessa a listagem de usuários
- **THEN** o sistema retorna os Solicitantes da "Unidade A", os Técnicos de "Manutenção" da "Unidade A" e o próprio Gestor
- **AND** Técnicos de outras áreas, outros Gestores, Diretores e Administradores NÃO são retornados

### Requirement: Desativação de usuário
O sistema SHALL permitir a desativação de usuários (soft delete), impedindo seu login sem remover seus registros históricos, respeitando a matriz de papéis gerenciáveis. Ao desativar um Técnico com chamados ativos, o sistema DEVE exibir um alerta com a lista de chamados sob sua responsabilidade e solicitar confirmação.

#### Scenario: Desativação de Técnico com chamados ativos
- **WHEN** um gestor desativa um Técnico que possui X chamados em andamento atribuídos a ele
- **THEN** o sistema exibe um alerta listando os números dos chamados ativos e solicita confirmação antes de prosseguir

#### Scenario: Usuário desativado não consegue logar
- **WHEN** um usuário desativado tenta login com credenciais válidas
- **THEN** o sistema retorna HTTP 403 "Usuário desativado. Entre em contato com o administrador."

#### Scenario: Gestor desativa Solicitante de sua própria Unidade
- **WHEN** um Gestor da "Unidade A" desativa um Solicitante da "Unidade A"
- **THEN** a desativação é concluída com sucesso

#### Scenario: Gestor não pode desativar usuário de outra Unidade
- **WHEN** um Gestor da "Unidade A" tenta desativar um usuário da "Unidade B"
- **THEN** o sistema retorna HTTP 404 e a desativação não ocorre

#### Scenario: Gestor não pode desativar usuário fora da matriz
- **WHEN** um Gestor da "Unidade A" tenta desativar o Diretor ou outro Gestor da "Unidade A"
- **THEN** o sistema retorna HTTP 404 e a desativação não ocorre
