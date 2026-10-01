# Spec Delta

## REMOVED Requirements

### Requirement: Mensagem retorna chamado de Aguardando para Em Andamento
**Reason**: O status passa a chamar-se "Pendente" e a representar bloqueios de terceiros (material, equipamento, fornecedor), não apenas falta de informação do Solicitante. Uma mensagem do Solicitante não desfaz esse tipo de bloqueio — e, por retomar o chamado, reiniciava a contagem do Tempo Médio de Atendimento, que desconta justamente o tempo em pendência. A retomada passa a ser decisão explícita do Técnico.

**Migration**: Nenhuma migração de dados é necessária — nenhum chamado muda de status pela remoção. O aviso ao Técnico permanece: o requisito "E-mail quando Solicitante responde em chamado Pendente" (`email-notifications`) e a notificação visual correspondente continuam sendo disparados, de modo que o Técnico segue sabendo da resposta e decide se o chamado está desbloqueado. Chamados que estavam "Aguardando" permanecem no mesmo status, agora exibido como "Pendente", e aguardam a ação "Retomar Atendimento".

## MODIFIED Requirements

### Requirement: Timeline unificada
O sistema SHALL exibir o histórico completo do chamado em ordem cronológica (da mais antiga para a mais recente), incluindo: abertura do chamado, mensagens trocadas, mudanças de status, atribuições e reatribuições.

Os status apresentados na timeline SHALL usar os mesmos rótulos exibidos no restante do sistema — nunca o identificador interno do status.

#### Scenario: Timeline com múltiplos tipos de evento
- **WHEN** um chamado possui eventos de abertura, 3 mensagens, 2 mudanças de status e 1 atribuição
- **THEN** a timeline exibe todos os 7 eventos em ordem cronológica, cada um com seu tipo, autor e data/hora

#### Scenario: Mudança de status apresentada com rótulo
- **WHEN** a timeline exibe a transição de um chamado para o desvio de pendência
- **THEN** o evento apresenta "Em Andamento" e "Pendente" como rótulos legíveis, e não os identificadores internos
