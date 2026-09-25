# Delta Spec: core-ui

## ADDED Requirements

### Requirement: Política de repetição das requisições de leitura
O sistema SHALL repetir automaticamente as requisições de leitura que falharem, com no mínimo 3 tentativas e intervalo exponencial entre elas, de modo a absorver a janela de inicialização de uma instância fria do backend sem expor erro ao usuário.

Operações de escrita NÃO DEVEM ser repetidas automaticamente, para não produzir efeitos duplicados.

#### Scenario: Leitura durante inicialização do backend
- **WHEN** uma tela consulta o backend enquanto uma instância está subindo e a primeira tentativa falha
- **THEN** o sistema repete a requisição com intervalo crescente e apresenta os dados assim que uma tentativa tiver sucesso

#### Scenario: Criação de chamado não é repetida
- **WHEN** o envio de um novo chamado falha
- **THEN** o sistema não reenvia a requisição automaticamente e nenhum chamado duplicado é criado

### Requirement: Chave de cache distinta por recorte de dados
Quando duas telas consomem o mesmo recurso com recortes diferentes, o sistema SHALL usar chaves de cache distintas, de modo que o resultado de um recorte nunca seja servido no lugar do outro.

#### Scenario: Filtro de listagem e seletor de abertura não compartilham cache
- **WHEN** o filtro por Tipo de Ocorrência da listagem (que apresenta todos os tipos, inclusive inativos) e um seletor que apresenta apenas os tipos ativos são usados na mesma sessão
- **THEN** cada um exibe o seu próprio recorte, independentemente de qual tela foi aberta primeiro
