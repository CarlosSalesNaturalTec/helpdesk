# Spec: Gestão de Usuários (user-management)

CRUD de usuários com escopo descentralizado, governado pela matriz de papéis gerenciáveis: o Administrador do Sistema gerencia todos os papéis em todas as Unidades; o Diretor gerencia Solicitantes, Técnicos e Gestores da própria Unidade; o Gestor gerencia Solicitantes da própria Unidade e Técnicos da própria Unidade e do próprio Tipo de Ocorrência.

## Purpose
TBD

## Requirements

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

No formulário de usuário, o campo SHALL ser rotulado **"Área de atuação"**, acompanhado de uma dica explicando que ele define o Tipo de Ocorrência atendido pelo usuário e, para Gestores, quais chamados, indicadores e técnicos ele gerencia. As mensagens de validação do campo SHALL usar o mesmo termo.

#### Scenario: Criar Gestor sem Tipo de Ocorrência é rejeitado
- **WHEN** um Administrador submete a criação de um usuário com papel `GESTOR` e sem `sectorId`
- **THEN** o sistema retorna erro de validação no campo `sectorId`, com a mensagem "Área de atuação é obrigatória para Técnicos e Gestores", e o usuário não é criado

#### Scenario: Campo aparece na interface para Gestor
- **WHEN** o operador seleciona o papel "Gestor" no formulário de usuário
- **THEN** o seletor "Área de atuação" é exibido, marcado como obrigatório e acompanhado da dica explicativa

#### Scenario: Campo é ocultado para Diretor
- **WHEN** o operador seleciona o papel "Diretor"
- **THEN** o seletor "Área de atuação" não é exibido e nenhum `sectorId` é enviado

#### Scenario: Alterar papel de Diretor para Gestor passa a exigir a área
- **WHEN** um Administrador edita um Diretor sem `sectorId` alterando seu papel para `GESTOR` sem informar a área de atuação
- **THEN** o sistema retorna erro de validação e a edição não é persistida

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

### Requirement: Reativação de usuário
O sistema SHALL permitir reativar um usuário inativo, respeitando o mesmo escopo aplicado à desativação. A reativação SHALL restaurar o acesso ao sistema e zerar o bloqueio por tentativas de login malsucedidas, sem alterar a senha.

#### Scenario: Admin reativa usuário desativado por engano
- **WHEN** o Administrador aciona "Reativar" em um usuário inativo e confirma
- **THEN** o usuário volta a constar como ativo e consegue fazer login com a senha que já possuía

#### Scenario: Reativação zera bloqueio de login
- **WHEN** um usuário inativo que estava bloqueado por tentativas malsucedidas é reativado
- **THEN** o contador de tentativas é zerado e o bloqueio é removido

#### Scenario: Reativar usuário fora do escopo
- **WHEN** um Gestor da "Unidade A" tenta reativar um usuário da "Unidade B" ou um usuário fora da sua matriz de papéis gerenciáveis
- **THEN** o sistema retorna HTTP 404 e o usuário permanece inativo

#### Scenario: Reativar usuário já ativo
- **WHEN** uma requisição de reativação é enviada para um usuário ativo
- **THEN** o sistema retorna HTTP 409 e nada é alterado

### Requirement: Exclusão de usuário inativo sem histórico
O sistema SHALL permitir excluir definitivamente um usuário, respeitando o mesmo escopo aplicado à desativação, somente quando ele estiver inativo e não possuir nenhum vínculo no sistema: chamados abertos por ele, chamados atribuídos a ele, registros de histórico de sua autoria ou notificações. Havendo vínculo, o sistema SHALL recusar a exclusão com HTTP 409 e uma mensagem orientando a manter o usuário inativo. Nenhum erro técnico de banco de dados SHALL ser exposto.

#### Scenario: Exclusão de cadastro feito por engano
- **WHEN** o Administrador desativa um usuário que nunca participou de nenhum chamado e em seguida aciona "Excluir" e confirma
- **THEN** o usuário é removido definitivamente e deixa de aparecer na listagem

#### Scenario: Exclusão de usuário com histórico é recusada
- **WHEN** um operador tenta excluir um usuário inativo que já abriu ou atendeu algum chamado
- **THEN** o sistema retorna HTTP 409 com a mensagem "Este usuário possui histórico no sistema e não pode ser excluído. Mantenha-o inativo."
- **AND** o usuário permanece cadastrado e inativo

#### Scenario: Exclusão de usuário ativo é recusada
- **WHEN** uma requisição de exclusão é enviada para um usuário ativo
- **THEN** o sistema retorna HTTP 409 indicando que o usuário deve ser desativado antes

#### Scenario: Excluir usuário fora do escopo
- **WHEN** um Gestor tenta excluir um usuário fora da sua Unidade ou da sua matriz de papéis gerenciáveis
- **THEN** o sistema retorna HTTP 404 e nada é removido

#### Scenario: Ações exibidas para usuários inativos
- **WHEN** o operador visualiza um usuário inativo gerenciável na listagem
- **THEN** são exibidas as ações "Reativar" e "Excluir", cada uma com confirmação, e a ação "Editar" permanece indisponível até a reativação

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

O telefone SHALL ser armazenado e trafegado na API com DDD, aceitando tanto linha fixa quanto celular, **apenas com dígitos**.

A interface SHALL aplicar máscara durante a digitação: o operador digita apenas números e o CPF é formatado como `000.000.000-00`; o telefone é formatado como `(00) 0000-0000` (fixo) ou `(00) 00000-0000` (celular) e enviado somente com dígitos. Colar um valor já formatado SHALL produzir o mesmo resultado. A listagem SHALL exibir o telefone formatado.

A mesma validação SHALL valer no cliente e no servidor, a partir do schema compartilhado.

#### Scenario: CPF digitado sem pontuação é formatado
- **WHEN** o operador digita `52998224725` no campo CPF
- **THEN** o campo exibe `529.982.247-25` e o valor é aceito

#### Scenario: CPF com dígitos verificadores inconsistentes é aceito
- **WHEN** um gestor informa um CPF no formato correto cujos dígitos verificadores não conferem
- **THEN** o sistema aceita o valor, pois a conferência de dígitos está fora do escopo desta validação

#### Scenario: Telefone celular digitado com máscara
- **WHEN** o operador digita ou cola `(71) 99965-5578` no campo telefone
- **THEN** o campo exibe `(71) 99965-5578`, o valor enviado à API é `71999655578` e o cadastro é salvo

#### Scenario: Telefone fixo é aceito
- **WHEN** o operador digita `7133334444`
- **THEN** o campo exibe `(71) 3333-4444` e o valor é aceito

#### Scenario: Listagem exibe telefone formatado
- **WHEN** a listagem de usuários exibe um telefone armazenado como `71999655578`
- **THEN** a célula mostra `(71) 99965-5578`

#### Scenario: Validação idêntica no servidor
- **WHEN** uma requisição de criação ou edição chega diretamente à API com CPF fora do formato ou telefone contendo caracteres que não sejam dígitos
- **THEN** o servidor rejeita a requisição, sem depender da validação do cliente

### Requirement: Usuários anteriores à introdução do CPF
O sistema SHALL permitir que usuários cadastrados antes da introdução de CPF e telefone permaneçam ativos e operantes com esses campos vazios, sem qualquer bloqueio de acesso.

#### Scenario: Usuário legado continua operando
- **WHEN** um usuário cadastrado antes da mudança, sem CPF nem telefone, realiza login
- **THEN** ele acessa o sistema normalmente, sem ser redirecionado para completar o cadastro

#### Scenario: Vários usuários legados coexistem sob a restrição de unicidade
- **WHEN** a base contém múltiplos usuários sem CPF preenchido
- **THEN** a restrição de unicidade do CPF não é violada e nenhuma operação falha por esse motivo
