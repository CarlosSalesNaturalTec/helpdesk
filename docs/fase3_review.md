# Relatório de Revisão de PRD — Controle de Qualidade

## 1. Veredito e Score de Prontidão
* **Score de Prontidão:** 9.0
* **Status:** APROVADO PARA ENGENHARIA (Score 8+)
* **Resumo:** O PRD está excepcionalmente bem estruturado, com personas claras, escopo bem delimitado e Critérios de Aceitação em formato BDD que cobrem a maioria dos fluxos felizes e de exceção. O documento protege bem a engenharia ao definir o que *não* será feito. No entanto, foram identificadas pequenas lacunas em métricas de desempenho (definição de cálculo) e segurança (proteção contra força bruta) que, se não ajustadas, podem gerar dúvidas durante a implementação da lógica de backend.

## 2. Pontos Críticos Identificados
* **Ambiguidade na Métrica de Tempo Médio:** O RF17 cita "Tempo Médio de Atendimento", mas não define se o cálculo ignora finais de semana, feriados ou o tempo em que o chamado ficou no status "Aguardando" (o que distorceria a produtividade da equipe).
* **Vulnerabilidade de Segurança no Login:** A US 1.1 não prevê o comportamento do sistema após sucessivas tentativas de login falhas (ex: 5 tentativas), abrindo brecha para ataques de força bruta.
* **Ausência de Limites de Entrada (Constraints):** Em nenhum momento (US 2.1 ou US 4.1) são definidos limites de caracteres para títulos, descrições ou mensagens, o que pode causar erros de estouro de banco de dados ou problemas de layout na interface.
* **Vazamento de Arquitetura (Technical Leak):** O RF19 prescreve que a arquitetura deve ser "desacoplada via API", o que é uma decisão técnica e não um requisito funcional de negócio.

## 3. Propostas de Correção Direta

### Correção 1: Definição do Tempo Médio de Atendimento (RF17)
* **Como está no PRD original:** 
  > "Tempo Médio de atendimento em horas [...] calculado com base em todos os chamados do meu escopo de visão"
* **Como deve ficar (Sugestão de Reescrita):**
  > "Tempo Médio de Atendimento (TMA): Calculado em horas corridas a partir da data/hora de abertura até a data/hora da primeira transição para 'Resolvido'. Nota: O tempo em que o chamado permanecer no status 'Aguardando' deve ser subtraído do cálculo final para não penalizar a métrica da equipe técnica por demora do solicitante."

### Correção 2: Segurança e Brute Force (US 1.1)
* **Como está no PRD original:** 
  > "Cenário 2 — Credenciais inválidas: [...] o sistema exibe a mensagem 'E-mail ou senha inválidos' e me mantém na tela de login"
* **Como deve ficar (Sugestão de Reescrita):**
  > "Cenário 4 — Proteção contra Força Bruta: 
  > **Dado** que eu errei a senha por 5 vezes consecutivas para o mesmo e-mail
  > **Quando** eu tento a 6ª tentativa
  > **Então** o sistema bloqueia meu acesso por 15 minutos e exibe a mensagem 'Muitas tentativas falhas. Tente novamente em 15 minutos', visando proteger a conta contra acessos não autorizados."

### Correção 3: Limites de Dados (US 2.1 e 4.1)
* **Como está no PRD original:** 
  > "O sistema deve permitir que o Solicitante registre um chamado informando: título (obrigatório), descrição completa (obrigatório)..."
* **Como deve ficar (Sugestão de Reescrita):**
  > "O sistema deve validar os campos de entrada: Título (mínimo 5, máximo 100 caracteres), Descrição/Mensagens (mínimo 10, máximo 2000 caracteres). Caso o limite seja excedido ou não atingido, exibir mensagem de erro: 'O campo [nome] deve ter entre X e Y caracteres'."

## 4. Próximos Passos
* O documento está maduro o suficiente para seguir para a etapa de **SDD (System Design Document)** ou ser processado por ferramentas de **OpenSpec**.
* Recomenda-se que o usuário aplique as correções sugeridas no item 3 diretamente no arquivo `docs/fase2_prd.md` antes de compartilhá-lo com a equipe de desenvolvimento para garantir 100% de clareza.
