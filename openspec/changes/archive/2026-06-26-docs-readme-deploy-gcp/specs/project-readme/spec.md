## ADDED Requirements

### Requirement: README de apresentação do projeto
O projeto DEVE conter um arquivo `docs/Readme.md` que sirva como porta de entrada para desenvolvedores e stakeholders, apresentando visão do produto, stack tecnológica, arquitetura e instruções de setup local.

#### Scenario: Novo desenvolvedor consulta o README para entender o projeto
- **WHEN** um desenvolvedor abre o arquivo `docs/Readme.md` pela primeira vez
- **THEN** ele encontra o nome e descrição do projeto na primeira seção, seguido de badges de tecnologia, stack completa, arquitetura em alto nível com diagrama ASCII, e personas do sistema

#### Scenario: Desenvolvedor faz setup local seguindo o README
- **WHEN** um desenvolvedor segue a seção de setup local do README
- **THEN** ele consegue clonar o repositório, instalar dependências, subir o banco com Docker, rodar migrations, seed, e iniciar o ambiente de desenvolvimento com um único comando

#### Scenario: Stakeholder consulta o README para entender as funcionalidades
- **WHEN** um stakeholder não-técnico lê o README
- **THEN** ele encontra a lista de funcionalidades do sistema (abertura de chamados, workflow, dashboard, relatórios, notificações) em linguagem acessível, com os perfis de usuário descritos

### Requirement: Estrutura do README
O README DEVE conter as seguintes seções, nesta ordem:

1. Título e descrição curta (1-2 frases)
2. Badges (tecnologias principais)
3. Funcionalidades (lista em bullets)
4. Stack Tecnológica (tabela front/back/banco/infra)
5. Arquitetura (diagrama ASCII monorepo + fluxo de dados)
6. Personas (tabela com 5 personas)
7. Estrutura do Repositório (árvore de diretórios)
8. Pré-requisitos (Node.js, Docker, npm)
9. Setup Local (passo-a-passo numerado)
10. Usuários de Teste (tabela com credenciais padrão)
11. Comandos Úteis (tabela de scripts npm)
12. Workflow de Desenvolvimento (git flow, branches, commits)
13. Licença (MIT)

#### Scenario: README contém todas as seções obrigatórias
- **WHEN** o arquivo `docs/Readme.md` é gerado
- **THEN** ele contém exatamente as 13 seções listadas, nesta ordem, sem seções vazias

### Requirement: Instruções de setup local funcionais
As instruções de setup local no README DEVEM ser verificáveis — qualquer desenvolvedor seguindo os passos em uma máquina limpa (com Node.js 20+ e Docker) DEVE conseguir rodar o sistema localmente.

#### Scenario: Setup local completo em máquina limpa
- **WHEN** um desenvolvedor executa `git clone`, `npm install`, `docker-compose up -d`, `npx prisma migrate dev`, `npx prisma db seed`, `npm run dev`
- **THEN** o backend responde em `http://localhost:3001/api/health`, o frontend carrega em `http://localhost:5173`, e é possível fazer login com `admin@helpdesk.com` / `admin123`

### Requirement: Usuários de teste documentados
O README DEVE listar todos os usuários de teste criados pelo seed, com e-mail, senha, role e unidade.

#### Scenario: Desenvolvedor consulta credenciais de teste
- **WHEN** um desenvolvedor precisa de uma credencial para testar um perfil específico
- **THEN** ele encontra na seção "Usuários de Teste" uma tabela com e-mail, senha, role e unidade para cada usuário do seed (admin, solicitante, tecnico, gestor)
