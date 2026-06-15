# Product Requirements Document (PRD) — HelpDesk

## 1. Visão Geral e Problema

A organização necessita de um sistema centralizado para registro, acompanhamento e resolução de chamados de suporte de TI. Atualmente, as solicitações são tratadas de forma fragmentada (e-mails, mensagens informais, planilhas), resultando em: perda de rastreabilidade das solicitações, ausência de métricas de desempenho da equipe técnica, falta de visibilidade para gestores sobre gargalos operacionais e inexistência de um canal padronizado para o solicitante acompanhar o status da sua solicitação.

O objetivo do produto é fornecer uma plataforma única onde colaboradores possam abrir chamados de suporte, técnicos possam gerenciar e resolver essas solicitações de forma organizada, gestores tenham visibilidade operacional em tempo real, e a qualidade do atendimento possa ser mensurada via pesquisa de satisfação. O sistema operará de forma independente, com autenticação local, atendendo um volume médio de 50 a 300 chamados mensais para uma equipe de 5 a 15 técnicos.

## 2. Personas

* **Solicitante (Colaborador):** Profissional de qualquer departamento que enfrenta um problema de TI e precisa registrar uma solicitação de suporte. Sua principal dor é não saber para quem pedir ajuda nem acompanhar o andamento da solução. Seu objetivo no sistema é abrir chamados de forma simples e rápida, e ser informado sobre o progresso até a resolução. Não possui conhecimento técnico aprofundado — precisa de uma interface guiada e linguagem clara.

* **Técnico:** Profissional da equipe de suporte de TI responsável por diagnosticar e resolver os chamados. Sua principal dor é a desorganização das demandas — não saber quais chamados estão pendentes, quais são urgentes, ou ter que buscar informações em múltiplos canais. Seu objetivo é visualizar a fila de chamados do seu departamento, assumir responsabilidade por tickets, interagir com o solicitante, registrar as ações realizadas e concluir atendimentos com eficiência. Precisa de ferramentas de filtro, busca e priorização por urgência.

* **Gestor:** Líder da equipe de suporte ou gerente de departamento. Sua principal dor é a falta de visibilidade sobre a carga de trabalho da equipe e a qualidade do atendimento prestado. Seu objetivo é monitorar todos os chamados em tempo real, identificar gargalos (chamados parados, técnicos sobrecarregados), alterar atribuições quando necessário e acessar indicadores operacionais básicos. Possui poder de edição sobre qualquer chamado dentro do seu escopo de atuação.

* **Administrador do Sistema:** Responsável pela manutenção da estrutura organizacional no sistema. Sua principal dor é a necessidade de manter dados cadastrais atualizados manualmente em ferramentas paralelas. Seu objetivo é gerenciar o cadastro de Centros de Custo e Usuários (criação, edição, desativação), garantindo que a base de dados do sistema reflita a estrutura real da organização. Pode ser um papel acumulado pelo Gestor em organizações menores.

## 3. Escopo do MVP

* **Dentro do Escopo:**
  * Autenticação local de usuários (login e senha próprios do sistema)
  * Abertura de chamados com categorização (tipo de problema, urgência, centro de custo)
  * Workflow completo do chamado (Aberto → Em Andamento → Resolvido → Fechado, com desvios para Aguardando e Reaberto)
  * Reabertura de chamados fechados (com registro de reabertura e novo ciclo de atendimento)
  * Atribuição de chamados por auto-atribuição (técnico assume da fila comum)
  * Histórico completo de conversas e ações dentro de cada chamado
  * Notificações por e-mail e alertas visuais no sistema
  * Dashboard operacional com cards de total por status (Abertos, Em Andamento, Resolvidos, Críticos)
  * Gráfico de tendência no Dashboard (linha do tempo com evolução diária de aberturas e fechamentos nos últimos 30 dias)
  * Módulo de Relatórios gerenciais com gráficos de distribuição (por status, prioridade, categoria, departamento e satisfação) e exportação para PDF
  * Pesquisa de satisfação (1 a 5 estrelas) aplicada ao fechar o chamado
  * CRUD de Centros de Custo
  * CRUD de Usuários (com definição de tipo: Solicitante, Técnico, Gestor)
  * Busca e filtro de chamados na visão de gestão
  * Canal de abertura de chamados via chatbot (a ser implementado em etapa futura do MVP — a arquitetura deve prever o ponto de extensão para este canal, mas a entrega do chatbot em si será planejada em iteração posterior)

* **Fora de Escopo:**
  * SLAs formais com metas de tempo de atendimento por nível de urgência
  * Integração com diretório corporativo (Active Directory, Google Workspace, SSO)
  * Integração com servidor de e-mail corporativo para disparo de notificações (o envio de e-mails utilizará serviço próprio e independente)
  * Aplicativo mobile
  * Upload de anexos (screenshots, logs, documentos) nos chamados
  * Distribuição automática de chamados com base em carga de trabalho
  * Auditoria avançada (log de todas as alterações administrativas)

## 4. Histórias de Usuário e Critérios de Aceitação

### Épico 1: Autenticação e Controle de Acesso

* **US 1.1:** Como qualquer usuário do sistema, eu quero realizar login com minhas credenciais (e-mail e senha) para que eu possa acessar as funcionalidades correspondentes ao meu perfil.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Login bem-sucedido:*
      * **Dado** que eu possuo um cadastro ativo no sistema com e-mail e senha definidos
      * **Quando** eu informo o e-mail e a senha corretos e aciono "Entrar"
      * **Então** eu sou autenticado e redirecionado para a tela inicial correspondente ao meu tipo de usuário (Dashboard para Técnico e Gestor; Abrir Chamado para Solicitante)
    * *Cenário 2 — Credenciais inválidas:*
      * **Dado** que eu estou na tela de login
      * **Quando** eu informo um e-mail inexistente ou uma senha incorreta e aciono "Entrar"
      * **Então** o sistema exibe a mensagem "E-mail ou senha inválidos" e me mantém na tela de login, sem revelar qual dos dois campos está incorreto
    * *Cenário 3 — Usuário inativo:*
      * **Dado** que meu cadastro foi desativado por um Administrador
      * **Quando** eu tento realizar login com credenciais válidas
      * **Então** o sistema exibe a mensagem "Usuário desativado. Entre em contato com o administrador." e bloqueia o acesso

* **US 1.2:** Como Administrador do Sistema, eu quero criar, editar e desativar usuários com diferentes perfis (Solicitante, Técnico, Gestor) para que a base de usuários reflita a estrutura organizacional.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Criação de usuário:*
      * **Dado** que eu estou autenticado como Administrador e acesso a tela de Usuários
      * **Quando** eu aciono "Novo Usuário", preencho nome completo, e-mail, departamento, tipo de usuário, centro de custo e uma senha temporária, e confirmo a criação
      * **Então** o usuário é criado com status ativo e pode realizar login imediatamente com a senha temporária
    * *Cenário 2 — E-mail duplicado:*
      * **Dado** que já existe um usuário cadastrado com o e-mail "joao@empresa.com"
      * **Quando** eu tento criar outro usuário com o mesmo e-mail
      * **Então** o sistema exibe a mensagem "Já existe um usuário com este e-mail" e impede a criação
    * *Cenário 3 — Desativação de usuário:*
      * **Dado** que um Técnico possui chamados em andamento atribuídos a ele
      * **Quando** eu desativo o cadastro desse Técnico
      * **Então** o sistema exibe um alerta listando os chamados ativos sob sua responsabilidade e solicita confirmação antes de prosseguir com a desativação

### Épico 2: Abertura de Chamados

* **US 2.1:** Como Solicitante, eu quero abrir um chamado descrevendo meu problema com o máximo de detalhes para que a equipe técnica possa entender e resolver minha solicitação rapidamente.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Abertura de chamado completa:*
      * **Dado** que eu estou autenticado como Solicitante na tela "Abrir Chamado"
      * **Quando** eu preencho o título, a descrição, seleciono o tipo de problema, defino o nível de urgência e confirmo a abertura
      * **Então** o chamado é criado com status "Aberto", recebe um número único de identificação, e eu vejo uma tela de confirmação com o número do chamado e a mensagem "Chamado #XXX aberto com sucesso. A equipe técnica já pode visualizá-lo."
    * *Cenário 2 — Campos obrigatórios não preenchidos:*
      * **Dado** que eu estou na tela "Abrir Chamado"
      * **Quando** eu aciono "Abrir Chamado" sem preencher o título ou a descrição
      * **Então** o sistema destaca os campos obrigatórios não preenchidos com a mensagem "Este campo é obrigatório" e impede a abertura até que todos os campos obrigatórios sejam preenchidos
    * *Cenário 3 — Dados do solicitante preenchidos automaticamente:*
      * **Dado** que eu estou autenticado como Solicitante e meu cadastro contém nome, e-mail, departamento e centro de custo
      * **Quando** eu acesso a tela "Abrir Chamado"
      * **Então** os campos de dados do solicitante (nome, e-mail, departamento, centro de custo) aparecem preenchidos automaticamente e não são editáveis

### Épico 3: Gestão e Ciclo de Vida do Chamado

* **US 3.1:** Como Técnico, eu quero visualizar a fila de chamados abertos e assumir a responsabilidade por um chamado para que eu possa iniciar o atendimento.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Auto-atribuição de chamado:*
      * **Dado** que eu estou autenticado como Técnico e visualizo a lista de chamados com status "Aberto"
      * **Quando** eu seleciono um chamado específico e aciono "Assumir Chamado"
      * **Então** o chamado passa para o status "Em Andamento", eu sou registrado como técnico responsável, e o Solicitante recebe uma notificação informando que eu assumi o atendimento
    * *Cenário 2 — Técnico não vê chamados de outro departamento:*
      * **Dado** que eu sou Técnico do departamento de TI
      * **Quando** eu acesso a tela de Gestão de Chamados
      * **Então** eu vejo apenas os chamados cujo solicitante pertence ao mesmo departamento que o meu, e não visualizo chamados de outros departamentos

* **US 3.2:** Como Técnico ou Gestor, eu quero alterar o status de um chamado conforme ele avança no atendimento para que o ciclo de vida reflita a realidade do trabalho.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Progressão normal do chamado:*
      * **Dado** que um chamado está "Em Andamento" e eu sou o Técnico responsável ou Gestor
      * **Quando** eu concluo o atendimento e altero o status para "Resolvido", registrando a solução aplicada
      * **Então** o status é atualizado, a solução fica registrada no histórico, e o Solicitante é notificado de que o chamado foi resolvido
    * *Cenário 2 — Colocar chamado em Aguardando:*
      * **Dado** que eu preciso de mais informações do Solicitante para prosseguir com o diagnóstico
      * **Quando** eu altero o status do chamado para "Aguardando" e registro uma mensagem solicitando as informações
      * **Então** o status é atualizado, o Solicitante é notificado sobre a solicitação de informações, e o chamado permanece "Aguardando" até que o Solicitante responda ou o status seja alterado novamente
    * *Cenário 3 — Fechamento com pesquisa de satisfação:*
      * **Dado** que um chamado está com status "Resolvido" e eu sou o Solicitante do chamado
      * **Quando** eu acesso o chamado e confirmo que a solução atendeu minha necessidade, acionando "Fechar Chamado"
      * **Então** o sistema me apresenta a tela de pesquisa de satisfação (1 a 5 estrelas) antes de efetivar o fechamento. Após eu avaliar, o chamado passa para o status "Fechado" e não pode mais ser alterado diretamente (mudanças só são possíveis via ação explícita de "Reabrir Chamado")
    * *Cenário 4 — Reabertura de chamado fechado pelo Solicitante:*
      * **Dado** que um chamado está com status "Fechado" e eu sou o Solicitante original
      * **Quando** eu acesso o chamado e aciono "Reabrir Chamado", informando o motivo da reabertura
      * **Então** o chamado passa para o status "Reaberto", o motivo é registrado no histórico, e o chamado retorna à fila comum para que um Técnico possa assumi-lo novamente. O ciclo de vida recomeça a partir de "Reaberto" → "Em Andamento"
    * *Cenário 5 — Técnico ou Gestor reabre chamado fechado:*
      * **Dado** que um chamado está com status "Fechado" e eu sou Técnico ou Gestor com permissão sobre o chamado
      * **Quando** eu aciono "Reabrir Chamado" e informo o motivo
      * **Então** o chamado passa para "Reaberto" e eu posso assumi-lo diretamente ou ele fica disponível na fila comum, conforme a ação selecionada
    * *Cenário 6 — Chamado fechado sem reabertura:*
      * **Dado** que um chamado está com status "Fechado" e ninguém solicita a reabertura
      * **Quando** qualquer usuário tenta adicionar uma mensagem ou alterar o status sem usar a ação específica "Reabrir Chamado"
      * **Então** o sistema exibe a mensagem "Este chamado está fechado. Para continuar, utilize a opção 'Reabrir Chamado'."

* **US 3.3:** Como Técnico, eu quero buscar e filtrar chamados por diferentes critérios para localizar rapidamente tickets específicos em meio ao volume diário.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Busca textual:*
      * **Dado** que eu estou na tela de Gestão de Chamados
      * **Quando** eu digito um termo no campo de busca (título, nome do solicitante ou departamento) e aciono "Buscar"
      * **Então** o sistema exibe apenas os chamados cujo título, nome do solicitante ou departamento contenham o termo digitado, com um contador indicando "X chamados encontrados"
    * *Cenário 2 — Filtro por status:*
      * **Dado** que eu quero ver apenas chamados "Em Andamento"
      * **Quando** eu seleciono o filtro de status "Em Andamento"
      * **Então** apenas os chamados com este status são exibidos e o total é atualizado para refletir o resultado do filtro
    * *Cenário 3 — Combinação de filtros:*
      * **Dado** que eu aplico simultaneamente um filtro de status "Aberto" e uma busca por "impressora"
      * **Então** o sistema exibe apenas os chamados com status "Aberto" E que contenham "impressora" no título, solicitante ou departamento

### Épico 4: Comunicação e Notificações

* **US 4.1:** Como Técnico ou Solicitante, eu quero trocar mensagens dentro de um chamado para que eu possa solicitar esclarecimentos ou informar o andamento sem precisar recorrer a canais externos.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Técnico envia mensagem ao Solicitante:*
      * **Dado** que eu sou o Técnico responsável por um chamado "Em Andamento"
      * **Quando** eu adiciono uma mensagem no campo de texto do chamado e aciono "Enviar"
      * **Então** a mensagem é registrada no histórico do chamado com data, hora e autor, fica visível para o Solicitante, e o Solicitante recebe uma notificação sobre a nova mensagem
    * *Cenário 2 — Histórico completo:*
      * **Dado** que um chamado possui múltiplas interações (abertura, mensagens do técnico, respostas do solicitante, mudanças de status)
      * **Quando** qualquer participante do chamado acessa a tela de detalhes
      * **Então** todas as interações são exibidas em ordem cronológica (da mais antiga para a mais recente), formando uma linha do tempo completa e legível

* **US 4.2:** Como qualquer usuário do sistema, eu quero ser notificado sobre eventos relevantes nos chamados para que eu possa agir rapidamente sem precisar verificar o sistema manualmente.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Notificação de atribuição:*
      * **Dado** que um Técnico assume um chamado do Solicitante "Maria Silva"
      * **Quando** a atribuição é confirmada
      * **Então** Maria recebe um e-mail com o assunto "Chamado #XXX foi assumido" e, se estiver logada no sistema, vê um alerta visual na interface indicando a atualização
    * *Cenário 2 — Notificação de resolução:*
      * **Dado** que um chamado tem seu status alterado para "Resolvido"
      * **Quando** a transição de status é confirmada
      * **Então** o Solicitante recebe um e-mail informando que o chamado foi resolvido, com um link para acessar o chamado e confirmar o fechamento
    * *Cenário 3 — Agrupamento de notificações visuais:*
      * **Dado** que eu não estou logado no sistema e ocorreram 3 atualizações em meus chamados
      * **Quando** eu realizo login
      * **Então** eu vejo um indicador de notificações (ex.: ícone com o número "3") que, ao ser clicado, lista as atualizações pendentes

### Épico 5: Dashboard Operacional

* **US 5.1:** Como Gestor ou Técnico, eu quero visualizar um painel com os totais de chamados por status para que eu tenha uma visão imediata da situação operacional ao acessar o sistema.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Cards de status para Gestor:*
      * **Dado** que eu estou autenticado como Gestor e acesso o Dashboard
      * **Quando** a página carrega
      * **Então** eu vejo quatro cards com os totais de: "Abertos" (todos os chamados com este status), "Em Andamento" (todos em atendimento), "Resolvidos" (todos resolvidos mas ainda não fechados) e "Críticos" (todos com urgência Crítica, independentemente do status, exceto Fechado), considerando todo o escopo de chamados que meu perfil pode visualizar
    * *Cenário 2 — Cards de status para Técnico:*
      * **Dado** que eu estou autenticado como Técnico e acesso o Dashboard
      * **Quando** a página carrega
      * **Então** eu vejo os mesmos quatro cards (Abertos, Em Andamento, Resolvidos, Críticos), porém com os totais restritos aos chamados do meu departamento
    * *Cenário 3 — Atualização dos números:*
      * **Dado** que um novo chamado Crítico é aberto enquanto eu visualizo o Dashboard
      * **Quando** eu recarrego a página ou o sistema atualiza automaticamente
      * **Então** o card "Críticos" e o card "Abertos" refletem o incremento nos totais

* **US 5.2:** Como Gestor, eu quero visualizar um gráfico de tendência com a evolução diária de aberturas e fechamentos nos últimos 30 dias para que eu possa identificar padrões de demanda e avaliar a produtividade da equipe ao longo do tempo.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Gráfico de linha com duas séries:*
      * **Dado** que eu estou autenticado como Gestor e acesso o Dashboard
      * **Quando** a página carrega abaixo dos cards de status
      * **Então** eu vejo um gráfico de linha com duas séries: "Chamados Abertos" e "Chamados Fechados", exibindo a contagem diária para cada um dos últimos 30 dias corridos, com o eixo X representando as datas e o eixo Y representando a quantidade
    * *Cenário 2 — Período sem dados:*
      * **Dado** que o sistema foi implantado há menos de 30 dias
      * **Quando** eu acesso o Dashboard
      * **Então** o gráfico exibe apenas os dias desde a implantação, sem quebras visuais para os dias futuros ou ausentes
    * *Cenário 3 — Gráfico para Técnico restrito ao departamento:*
      * **Dado** que eu estou autenticado como Técnico
      * **Quando** eu visualizo o gráfico de tendência
      * **Então** os dados refletem apenas os chamados do meu departamento, assim como nos cards de status

### Épico 6: Pesquisa de Satisfação

* **US 6.1:** Como Solicitante, eu quero avaliar o atendimento recebido ao fechar um chamado para que eu possa contribuir com a melhoria contínua do suporte de TI.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Avaliação obrigatória no fechamento:*
      * **Dado** que meu chamado está com status "Resolvido"
      * **Quando** eu aciono "Fechar Chamado"
      * **Então** o sistema exibe uma tela com 5 estrelas e a pergunta "Como você avalia o atendimento recebido?" e me impede de concluir o fechamento até que eu selecione uma nota de 1 a 5 estrelas
    * *Cenário 2 — Registro da avaliação:*
      * **Dado** que eu selecionei 4 estrelas e confirmei o fechamento
      * **Quando** o chamado é fechado
      * **Então** a nota é registrada no chamado, associada ao Solicitante e à data de fechamento, e fica disponível para consulta nos relatórios gerenciais e nos gráficos de distribuição por satisfação
    * *Cenário 3 — Avaliação sem comentário textual:*
      * **Dado** que estou na tela de avaliação
      * **Quando** eu seleciono uma nota de 1 a 5 estrelas
      * **Então** o sistema registra apenas a nota numérica, sem exigir ou apresentar campo de comentário textual (o comentário qualitativo está fora do escopo do MVP)

### Épico 7: Administração do Sistema

* **US 7.1:** Como Administrador do Sistema, eu quero gerenciar os Centros de Custo (criar, editar, excluir) para que a estrutura organizacional do sistema reflita a realidade da empresa.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Criação de Centro de Custo:*
      * **Dado** que eu estou autenticado como Administrador e acesso a tela de Centro de Custo
      * **Quando** eu aciono "Novo Centro de Custo", preencho o nome/código e confirmo a criação
      * **Então** o Centro de Custo é criado e fica disponível para ser associado a usuários e chamados
    * *Cenário 2 — Exclusão de Centro de Custo em uso:*
      * **Dado** que um Centro de Custo está associado a pelo menos um usuário ou chamado
      * **Quando** eu tento excluí-lo
      * **Então** o sistema exibe a mensagem "Este Centro de Custo não pode ser excluído pois está vinculado a X usuários e/ou Y chamados" e impede a exclusão
    * *Cenário 3 — Edição de Centro de Custo:*
      * **Dado** que um Centro de Custo existe e eu edito seu nome
      * **Quando** eu confirmo a alteração
      * **Então** o novo nome é refletido em todos os registros vinculados (usuários, chamados existentes e futuros)

### Épico 8: Relatórios Gerenciais

* **US 8.1:** Como Gestor, eu quero acessar um módulo de relatórios com cards-resumo e gráficos de distribuição para que eu possa analisar o desempenho da operação de suporte por diferentes dimensões.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Cards-resumo do período:*
      * **Dado** que eu estou autenticado como Gestor e acesso a tela de Relatórios
      * **Quando** a página carrega
      * **Então** eu vejo quatro cards-resumo com: Total de Tickets, Taxa de Fechamento (percentual de chamados fechados em relação ao total), Tempo Médio de atendimento em horas e Satisfação Média (nota de 1 a 5 estrelas), calculados com base em todos os chamados do meu escopo de visão, sem filtro aplicado inicialmente
    * *Cenário 2 — Filtro por Centro de Custo:*
      * **Dado** que eu desejo analisar os dados de um Centro de Custo específico
      * **Quando** eu seleciono um Centro de Custo no filtro e aciono "Aplicar"
      * **Então** todos os cards-resumo e gráficos são recalculados considerando apenas os chamados cujos solicitantes pertencem ao Centro de Custo selecionado
    * *Cenário 3 — Seleção de dimensão do gráfico de distribuição:*
      * **Dado** que eu estou na tela de Relatórios
      * **Quando** eu seleciono uma dimensão no filtro "Distribuição por" (opções: Status, Prioridade, Categoria, Departamento, Satisfação)
      * **Então** o gráfico de barras ou pizza é atualizado para exibir a contagem de chamados agrupada pela dimensão selecionada

* **US 8.2:** Como Gestor, eu quero exportar os relatórios para o formato PDF para que eu possa compartilhar os indicadores com a diretoria e manter registros formais de desempenho.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Geração de PDF com os dados atuais:*
      * **Dado** que eu estou visualizando os relatórios com determinados filtros aplicados (Centro de Custo e dimensão de distribuição selecionados)
      * **Quando** eu aciono o botão "Gerar PDF"
      * **Então** o sistema gera um arquivo PDF contendo: os quatro cards-resumo com os valores atuais, o gráfico de distribuição da dimensão selecionada com sua legenda, a data e hora da geração, e o nome do usuário que gerou o relatório. O download do arquivo é iniciado automaticamente
    * *Cenário 2 — PDF sem dados:*
      * **Dado** que não há chamados registrados para os filtros aplicados
      * **Quando** eu aciono "Gerar PDF"
      * **Então** o sistema gera um PDF com os cards-resumo zerados e a mensagem "Não há dados disponíveis para os filtros selecionados" no lugar do gráfico, sem quebrar ou gerar erro

### Épico 9: Canal de Abertura via Chatbot (Etapa Futura)

* **US 9.1:** Como Solicitante, eu quero poder abrir um chamado por meio de um canal de chatbot para que eu possa registrar solicitações de suporte sem precisar acessar o sistema web.
  * **Critérios de Aceitação:**
    * *Cenário 1 — Abertura guiada por chatbot:*
      * **Dado** que o canal de chatbot está disponível e eu sou um usuário autenticado
      * **Quando** eu interajo com o chatbot e descrevo meu problema
      * **Então** o chatbot coleta as informações necessárias (título, descrição, tipo de problema, urgência) por meio de perguntas guiadas e cria o chamado no sistema com meus dados cadastrais, exibindo o número do chamado ao final
    * *Cenário 2 — Dados insuficientes:*
      * **Dado** que eu não forneço as informações mínimas obrigatórias durante a interação com o chatbot
      * **Quando** o chatbot detecta que título ou descrição estão ausentes
      * **Então** ele solicita novamente os campos faltantes antes de criar o chamado, sem gerar registros incompletos

> **Nota de Planejamento (Etapa Futura):** Este épico será implementado em uma iteração posterior do MVP. No entanto, a arquitetura do sistema deve prever e documentar o ponto de extensão para este canal (API de criação de chamados desacoplada da interface web), de modo que a adição futura do chatbot não exija retrabalho estrutural no núcleo do sistema. A interface web de abertura de chamados deve consumir a mesma API que o chatbot consumirá.

## 5. Requisitos Funcionais

**RF01 — Autenticação:** O sistema deve permitir login mediante e-mail e senha. Credenciais inválidas devem gerar mensagem genérica de erro, sem revelar qual campo está incorreto. Usuários desativados devem ser impedidos de acessar o sistema.

**RF02 — Controle de Acesso por Perfil:** O sistema deve garantir que cada perfil de usuário tenha visibilidade e permissões distintas:
- Solicitante: vê apenas seus próprios chamados; pode abrir chamados, interagir no histórico e fechar seus chamados resolvidos.
- Técnico: vê todos os chamados do seu departamento; pode assumir chamados abertos, alterar status (exceto Fechar), registrar mensagens no histórico e buscar/filtrar chamados.
- Gestor: vê e pode alterar todos os chamados do seu escopo, incluindo reatribuição e fechamento.
- Administrador: possui acesso aos CRUDs de Usuários e Centros de Custo; também pode alterar status de qualquer chamado.

**RF03 — Abertura de Chamado:** O sistema deve permitir que o Solicitante registre um chamado informando: título (obrigatório), descrição completa (obrigatório), tipo de problema (seleção entre Hardware, Software, Rede/Internet, E-mail, Impressora, Acesso/Senha, Sistema Interno, Outro) e nível de urgência (Baixa, Média, Alta, Crítica). Os dados cadastrais do solicitante (nome, e-mail, departamento, centro de custo) devem ser preenchidos automaticamente com base na sessão autenticada.

**RF04 — Identificação Única do Chamado:** Cada chamado criado deve receber um número único e sequencial de identificação, exibido na tela de confirmação e utilizado como referência em todas as comunicações.

**RF05 — Workflow do Chamado:** O sistema deve suportar o seguinte ciclo de vida: Aberto → Em Andamento → Resolvido → Fechado. O status "Aguardando" pode ser acionado a partir de "Em Andamento" como um desvio, retornando a "Em Andamento" quando houver atualização. Chamados "Fechados" podem ser reabertos pelo Solicitante, Técnico ou Gestor, transitando para o status "Reaberto" e retornando ao ciclo normal de atendimento (Reaberto → Em Andamento → Resolvido → Fechado). A reabertura exige o registro de um motivo e fica registrada no histórico do chamado.

**RF06 — Auto-atribuição:** Um chamado com status "Aberto" pode ser assumido por qualquer Técnico do departamento correspondente, passando automaticamente para "Em Andamento" e registrando o Técnico como responsável.

**RF07 — Histórico do Chamado:** Cada chamado deve registrar uma linha do tempo cronológica contendo: dados da abertura, todas as mensagens trocadas entre Solicitante e Técnico (com autor, data e hora), e todas as mudanças de status (com registro do status anterior, novo status, autor e data/hora).

**RF08 — Busca e Filtro na Gestão de Chamados:** O sistema deve permitir busca textual por título, nome do solicitante e departamento, e filtro por status. Busca e filtro devem ser combináveis, retornando a interseção dos critérios. O total de chamados encontrados deve ser exibido.

**RF09 — Notificações por E-mail:** O sistema deve enviar e-mail automaticamente para o Solicitante nos seguintes eventos: quando um Técnico assume seu chamado, quando o chamado muda para "Aguardando" (com a mensagem do Técnico), quando o chamado é resolvido. O sistema também deve notificar o Técnico responsável (ou a fila de técnicos do departamento) quando um chamado fechado for reaberto. Os e-mails devem conter o número do chamado e as informações relevantes da atualização.

**RF10 — Notificações Visuais no Sistema:** O sistema deve exibir um indicador visual de notificações não lidas para o usuário logado, com contador de atualizações pendentes. Ao clicar, deve listar as notificações com link direto para o chamado correspondente.

**RF11 — Dashboard Operacional:** O sistema deve exibir quatro cards numéricos com os totais de chamados: "Abertos" (status = Aberto), "Em Andamento" (status = Em Andamento), "Resolvidos" (status = Resolvido) e "Críticos" (urgência = Crítica E status ≠ Fechado). Para Técnicos, os números são restritos ao departamento; para Gestores, consideram todo o escopo visível.

**RF12 — Pesquisa de Satisfação:** Ao fechar um chamado (transição de "Resolvido" para "Fechado" pelo Solicitante), o sistema deve obrigatoriamente apresentar uma tela de avaliação com 5 estrelas. O fechamento só deve ser concluído após a seleção de uma nota. A nota deve ser registrada e vinculada ao chamado.

**RF13 — CRUD de Usuários:** O Administrador deve poder criar, editar e desativar usuários. Campos obrigatórios: nome completo, e-mail (deve ser único no sistema), tipo de usuário (Solicitante, Técnico, Gestor), departamento, centro de custo e senha inicial. A desativação de um Técnico com chamados ativos deve gerar alerta de confirmação.

**RF14 — CRUD de Centros de Custo:** O Administrador deve poder criar, editar e excluir Centros de Custo. A exclusão deve ser bloqueada se houver usuários ou chamados vinculados ao Centro de Custo.

**RF15 — Proteção de Dados entre Departamentos:** Um Técnico alocado a um departamento não deve visualizar chamados cujo Solicitante pertença a outro departamento. O Gestor possui visão irrestrita.

**RF16 — Gráfico de Tendência no Dashboard:** O Dashboard deve exibir, abaixo dos cards de status, um gráfico de linha com duas séries temporais: "Chamados Abertos" (contagem diária de novos chamados) e "Chamados Fechados" (contagem diária de chamados que transitaram para Fechado). O período coberto deve ser os últimos 30 dias corridos a partir da data atual. Para o perfil Técnico, os dados são restritos ao seu departamento; para o Gestor, consideram todo o escopo visível.

**RF17 — Módulo de Relatórios Gerenciais:** O sistema deve oferecer uma tela de Relatórios acessível ao Gestor contendo:
- Quatro cards-resumo numéricos: Total de Tickets, Taxa de Fechamento (%), Tempo Médio de atendimento (horas) e Satisfação Média (1 a 5 estrelas)
- Filtro opcional por Centro de Custo que recalcula todos os indicadores e gráficos
- Seletor de dimensão para o gráfico de distribuição com as opções: Status, Prioridade, Categoria, Departamento e Satisfação
- Gráfico de distribuição (barras ou pizza) que exibe a contagem de chamados agrupada pela dimensão selecionada

**RF18 — Exportação de Relatórios para PDF:** O sistema deve permitir que o Gestor gere um arquivo PDF a partir da tela de Relatórios. O PDF deve conter: os valores atuais dos quatro cards-resumo, o gráfico de distribuição com a dimensão selecionada e sua legenda, a data/hora de geração, e o nome do Gestor que gerou o documento. O download do arquivo deve iniciar automaticamente após a geração. Quando não houver dados para os filtros aplicados, o PDF deve ser gerado com valores zerados e mensagem informativa, sem erros.

**RF19 — Ponto de Extensão para Chatbot:** A arquitetura do sistema deve prever e documentar uma API de criação de chamados desacoplada da interface web, permitindo que canais alternativos (como chatbot) consumam a mesma lógica de negócio de abertura de chamados. A interface web de "Abrir Chamado" deve utilizar essa mesma API, garantindo que a adição futura de novos canais de entrada não exija retrabalho no núcleo do sistema. A implementação do chatbot em si é uma entrega de etapa futura do MVP.

## 6. Requisitos Não Funcionais

**RNF01 — Segurança na Autenticação:** As senhas dos usuários devem ser armazenadas de forma irreversível (hash criptográfico com salt). O mecanismo de login deve ser resistente a enumeração de usuários (a mensagem de erro para credenciais inválidas não deve distinguir entre e-mail inexistente e senha incorreta).

**RNF02 — Confidencialidade dos Dados:** O controle de acesso baseado em perfil (RF02) deve ser aplicado no servidor, e não apenas na interface. Nenhum usuário deve conseguir acessar dados de chamados fora do seu escopo de permissão via manipulação de parâmetros de requisição.

**RNF03 — Disponibilidade:** O sistema deve estar disponível durante o horário comercial (segunda a sexta, 08h às 18h), com tolerância a períodos de indisponibilidade fora desse horário para manutenções programadas.

**RNF04 — Desempenho sob Carga Típica:** Com 5 a 15 técnicos simultâneos e volume de 50 a 300 chamados por mês, as operações de abertura de chamado, listagem e busca devem responder em até 3 segundos em condições normais de uso (até 20 usuários simultâneos).

**RNF05 — Usabilidade para o Solicitante:** A tela de abertura de chamado deve ser intuitiva para usuários sem conhecimento técnico de TI, com linguagem clara nos campos (ex.: "Descreva o problema com o máximo de detalhes" em vez de termos técnicos). O formulário não deve exceder uma única tela (sem scroll excessivo ou múltiplas etapas).

**RNF06 — Consistência de Notificações:** As notificações por e-mail e os alertas no sistema devem ser disparados no mesmo momento em que a ação geradora é confirmada no sistema, sem atraso perceptível. Em caso de falha no envio de e-mail, o alerta no sistema não deve ser prejudicado.

**RNF07 — Conformidade com LGPD:** O sistema deve tratar os dados pessoais (nome, e-mail, departamento) em conformidade com a Lei Geral de Proteção de Dados Pessoais. Deve ser possível, em versão futura ou mediante solicitação, exportar ou excluir os dados de um usuário específico. O banco de dados não deve armazenar logs de autenticação com senhas em texto plano.

**RNF08 — Independência de Infraestrutura:** O sistema deve operar de forma independente, sem dependência de serviços externos corporativos (diretório de usuários, servidor de e-mail da empresa). O envio de e-mails utilizará um serviço próprio e autônomo de disparo de mensagens.

**RNF09 — Responsividade Básica:** A interface deve ser utilizável em desktops e notebooks com resolução mínima de 1366x768 pixels, que é o equipamento padrão corporativo. Não há requisito de responsividade para tablets ou smartphones no MVP.

**RNF10 — Desempenho na Geração de PDF:** A geração e o download do arquivo PDF de relatórios devem ser concluídos em até 10 segundos para volumes de até 300 chamados no escopo do filtro aplicado. O sistema deve exibir um indicador de progresso durante a geração para que o Gestor saiba que o processamento está em andamento.

## 7. Métricas de Sucesso

As seguintes métricas serão acompanhadas após o lançamento do MVP para avaliar se o produto está entregando valor ao negócio:

* **Taxa de Adoção por Solicitantes:** Pelo menos 70% dos chamados de suporte de TI devem ser registrados via sistema em até 60 dias após o lançamento, em substituição aos canais informais atuais (e-mails diretos, mensagens, contatos verbais).

* **Tempo Médio até Primeira Atribuição:** O intervalo entre a abertura de um chamado e o momento em que um Técnico o assume deve ser monitorado. A meta qualitativa é redução contínua, mas sem SLA formal no MVP — a medição servirá como linha de base para definição de metas na Fase 2.

* **Satisfação Média dos Solicitantes:** A nota média das pesquisas de satisfação (1 a 5 estrelas) deve ser igual ou superior a 4,0 ao final do primeiro trimestre de operação, considerando todos os chamados fechados no período.

* **Taxa de Fechamento no Prazo de 7 Dias:** Pelo menos 60% dos chamados abertos devem ser fechados em até 7 dias corridos. Esta métrica serve como indicador de eficiência operacional da equipe, sem configurar SLA contratual.

* **Engajamento dos Técnicos:** 100% dos Técnicos cadastrados devem ter realizado ao menos uma ação no sistema (assumir chamado, enviar mensagem, alterar status) nos primeiros 15 dias após o lançamento. Esta métrica valida se a ferramenta está sendo incorporada à rotina diária da equipe.

* **Cobertura de Notificações:** Menos de 5% dos chamados devem passar mais de 24 horas sem nenhuma interação (mensagem ou mudança de status) após serem abertos. Esta métrica indica se as notificações estão gerando o engajamento esperado entre Solicitante e Técnico.
