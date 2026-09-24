# Spec: Gestão de Usuários (user-management)

CRUD de usuários com escopo descentralizado: o Administrador do Sistema gerencia usuários de todas as Unidades; Diretor e Gestor gerenciam apenas usuários de sua própria Unidade.

## Purpose
TBD

## Requirements

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

### Requirement: Tipo de Ocorrência obrigatório para papéis escopados
O sistema SHALL exigir a seleção de um Tipo de Ocorrência (`sectorId`) ao criar ou editar um usuário com papel `TECNICO` ou `GESTOR`. Para os papéis `SOLICITANTE`, `DIRETOR` e `ADMIN` o campo SHALL permanecer ausente e ser ignorado se enviado. A validação SHALL ocorrer no schema Zod compartilhado, garantindo paridade entre cliente e servidor.

#### Scenario: Criar Gestor sem Tipo de Ocorrência é rejeitado
- **WHEN** um Administrador submete a criação de um usuário com papel `GESTOR` e sem `sectorId`
- **THEN** o sistema retorna erro de validação no campo `sectorId` e o usuário não é criado

#### Scenario: Campo aparece na interface para Gestor
- **WHEN** o operador seleciona o papel "Gestor" no formulário de usuário
- **THEN** o seletor de Tipo de Ocorrência é exibido e marcado como obrigatório

#### Scenario: Campo é ocultado para Diretor
- **WHEN** o operador seleciona o papel "Diretor"
- **THEN** o seletor de Tipo de Ocorrência não é exibido e nenhum `sectorId` é enviado

#### Scenario: Alterar papel de Diretor para Gestor passa a exigir a área
- **WHEN** um Administrador edita um Diretor sem `sectorId` alterando seu papel para `GESTOR` sem informar o Tipo de Ocorrência
- **THEN** o sistema retorna erro de validação e a edição não é persistida

### Requirement: Desativação de usuário
O sistema SHALL permitir a desativação de usuários (soft delete), impedindo seu login sem remover seus registros históricos. Ao desativar um Técnico com chamados ativos, o sistema DEVE exibir um alerta com a lista de chamados sob sua responsabilidade e solicitar confirmação.

#### Scenario: Desativação de Técnico com chamados ativos
- **WHEN** um gestor desativa um Técnico que possui X chamados em andamento atribuídos a ele
- **THEN** o sistema exibe um alerta listando os números dos chamados ativos e solicita confirmação antes de prosseguir

#### Scenario: Usuário desativado não consegue logar
- **WHEN** um usuário desativado tenta login com credenciais válidas
- **THEN** o sistema retorna HTTP 403 "Usuário desativado. Entre em contato com o administrador."

#### Scenario: Gestor desativa usuário de sua própria Unidade
- **WHEN** um Gestor da "Unidade A" desativa um usuário da "Unidade A"
- **THEN** a desativação é concluída com sucesso

#### Scenario: Gestor não pode desativar usuário de outra Unidade
- **WHEN** um Gestor da "Unidade A" tenta desativar um usuário da "Unidade B"
- **THEN** o sistema retorna HTTP 404 e a desativação não ocorre

### Requirement: Listagem de usuários com escopo
O sistema SHALL listar usuários respeitando o escopo do papel logado. Admin vê todos os usuários; Diretor e Gestor veem apenas usuários de sua Unidade.

#### Scenario: Admin lista todos os usuários
- **WHEN** o Admin acessa a listagem de usuários
- **THEN** o sistema retorna todos os usuários de todas as Unidades

#### Scenario: Diretor lista usuários de sua Unidade
- **WHEN** um Diretor da "Unidade A" acessa a listagem de usuários
- **THEN** o sistema retorna apenas usuários vinculados à "Unidade A"

### Requirement: Rótulo do gestor derivado da sua área
O sistema SHALL exibir o papel do gestor na interface como "Gestor de {nome do Tipo de Ocorrência}", derivado do setor associado ao usuário, em vez do texto fixo "Gestor de TI". Quando o nome do setor não estiver disponível, o sistema SHALL exibir apenas "Gestor", sem falhar a renderização.

#### Scenario: Badge da navbar reflete a área
- **WHEN** um Gestor cujo Tipo de Ocorrência é "Manutenção" acessa qualquer tela
- **THEN** o badge de papel exibe "Gestor de Manutenção"

#### Scenario: Listagem de usuários reflete a área de cada gestor
- **WHEN** um Administrador consulta a lista de usuários contendo gestores de áreas distintas
- **THEN** cada linha exibe o rótulo correspondente à área daquele gestor

#### Scenario: Ausência do nome do setor não quebra a interface
- **WHEN** o payload do usuário não traz o nome do setor
- **THEN** a interface exibe "Gestor" e permanece funcional

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
