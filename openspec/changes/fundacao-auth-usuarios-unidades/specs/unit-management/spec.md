# Spec: Gestão de Unidades (unit-management)

CRUD de Unidades do Instituto, restrito ao Administrador do Sistema, com proteção contra exclusão de Unidades em uso.

## ADDED Requirements

### Requirement: Criação de Unidade
O sistema SHALL permitir que o Administrador do Sistema crie Unidades informando um nome/código. A Unidade criada DEVE ficar imediatamente disponível para associação a usuários e chamados.

#### Scenario: Admin cria Unidade com sucesso
- **WHEN** o Administrador do Sistema acessa a tela de Unidades, aciona "Nova Unidade", preenche o nome e confirma
- **THEN** a Unidade é criada e aparece na listagem de Unidades disponíveis

#### Scenario: Usuário não-admin tenta criar Unidade
- **WHEN** um Diretor, Gestor de TI, Técnico ou Solicitante tenta acessar o endpoint de criação de Unidade
- **THEN** o sistema retorna HTTP 403 (proibido)

### Requirement: Edição de Unidade
O sistema SHALL permitir que o Administrador do Sistema edite o nome de uma Unidade existente. A alteração DEVE ser refletida em todos os registros vinculados (usuários, chamados).

#### Scenario: Admin edita nome da Unidade
- **WHEN** o Admin edita o nome de uma Unidade de "TI-SP" para "TI-São Paulo" e confirma
- **THEN** o novo nome é salvo e aparece em todos os registros que referenciam essa Unidade

### Requirement: Exclusão de Unidade sem vínculos
O sistema SHALL permitir a exclusão de uma Unidade apenas quando não houver usuários nem chamados vinculados a ela.

#### Scenario: Admin exclui Unidade sem vínculos
- **WHEN** o Admin tenta excluir uma Unidade que não possui usuários nem chamados vinculados
- **THEN** a Unidade é removida do sistema

### Requirement: Bloqueio de exclusão de Unidade com vínculos
O sistema SHALL bloquear a exclusão de uma Unidade que possua ao menos um usuário ou chamado vinculado, exibindo mensagem informativa com as quantidades.

#### Scenario: Admin tenta excluir Unidade com vínculos
- **WHEN** o Admin tenta excluir uma Unidade que possui 5 usuários e 12 chamados vinculados
- **THEN** o sistema exibe "Esta Unidade não pode ser excluída pois está vinculada a 5 usuários e 12 chamados" e bloqueia a exclusão

### Requirement: Listagem de Unidades
O sistema SHALL listar todas as Unidades cadastradas. A listagem DEVE ser acessível por usuários autenticados para fins de consulta em filtros e cadastros.

#### Scenario: Admin lista todas as Unidades
- **WHEN** o Admin acessa a listagem de Unidades
- **THEN** o sistema retorna todas as Unidades cadastradas

#### Scenario: Diretor visualiza lista de Unidades para contexto
- **WHEN** um Diretor acessa a listagem de Unidades
- **THEN** o sistema retorna todas as Unidades (para uso em filtros e contexto), mas o Diretor não pode editar ou excluir nenhuma
