## Context

- `frontend/src/pages/AbrirChamado.tsx` monta três `useQuery` no carregamento: `['sectors']`, `['problemTypes']` e `['niveisUrgencia']`. Nenhuma delas lê `isError`.
- `frontend/src/App.tsx` configura o QueryClient com `refetchOnWindowFocus: false` e `retry: 1`.
- `cloudbuild.yaml` implanta com `--min-instances=0 --max-instances=3 --timeout=300`, sem `--cpu-boost`.
- `Dockerfile` usa `CMD ["sh","-c","npx prisma migrate deploy && node backend/dist/index.js"]`, então cada instância nova roda a verificação de migrações antes de servir.
- `frontend/src/api/client.ts` não define `timeout` no Axios.

## Goals / Non-Goals

**Goals:** nenhuma falha de carregamento silenciosa no formulário de abertura; o usuário consegue se recuperar sem recarregar a página; reduzir a chance de a falha acontecer; produzir evidência para a próxima investigação.

**Non-Goals:** ver `proposal.md`.

## Decisions

### D1. Estado de erro explícito nos três seletores

Cada `useQuery` passa a expor `isError` e `refetch`. Quando `isError` é verdadeiro, no lugar do `<select>` vazio aparece uma mensagem curta e um botão "Tentar novamente" que chama `refetch()`.

O botão "Enviar Chamado" fica desabilitado enquanto qualquer um dos três conjuntos de referência estiver ausente. Isso evita o caso em que o usuário escreve a descrição inteira, tenta enviar e só então descobre que o formulário estava quebrado.

*Alternativa descartada:* uma faixa de erro única no topo do formulário. Perde a informação de **qual** lista falhou, que é justamente o que faltou para diagnosticar o problema original.

### D2. `retry: 3` com backoff exponencial

Nos defaults do QueryClient, `retry: 3` e `retryDelay` exponencial com teto (por exemplo, `min(1000 * 2 ** n, 30000)`). Com `retry: 1`, as duas tentativas caem quase juntas e não cobrem a subida de uma instância fria.

Aplicar no default e não só nas queries de referência: a mesma janela de cold start atinge o Dashboard e a listagem de chamados. Mutações continuam sem repetição automática — repetir um `POST` de criação de chamado geraria duplicata.

### D3. `--cpu-boost` no Cloud Run

Acrescentar `--cpu-boost` ao `gcloud run deploy`. A flag concede CPU adicional durante a inicialização do container, encurtando justamente o trecho `npx prisma migrate deploy` + subida do Fastify. Não há custo de instância ociosa, diferente de `--min-instances=1`.

É mitigação, não cura: a causa raiz continua sendo a migração no `CMD`. D1 garante que, se ainda assim falhar, o usuário veja o erro.

### D4. Chaves de cache distintas por recorte

```
hoje                          depois
['sectors'] → todos          ['sectors','all']    → todos
['sectors'] → só ativos      ['sectors','ativos'] → só ativos
```

`SectorSelector` (filtro de listagem, usa todos) passa a `['sectors','all']`; `AbrirChamado` e `Chamados` (só ativos) passam a `['sectors','ativos']`.

Hoje a colisão é quase inofensiva, porque `/abrir-chamado` é exclusivo do Solicitante e o `SectorSelector` só aparece para papéis que não abrem chamado. É uma armadilha latente: quem montar primeiro popula o cache do outro. Corrigir agora custa duas linhas.

## Risks / Trade-offs

- **[`retry: 3` atrasa a exibição de um erro real]** → Com backoff, o pior caso fica em poucos segundos antes da mensagem aparecer. O `isLoading` continua visível nesse intervalo, então a tela não fica muda.
- **[`--cpu-boost` pode não ser suficiente]** → Aceito conscientemente. D1 transforma o sintoma em evidência e a decisão seguinte (min-instances ou tirar a migração do `CMD`) passa a ser informada.
- **[A causa raiz pode ser outra — JWT de 15 min expirado, por exemplo]** → D1 cobre igualmente: qualquer falha passa a ser visível. Um 401 já dispara `auth:unauthorized` e leva ao login, sintoma diferente do relatado.

## Migration Plan

Sem migration. Deploy normal pelo `main`. Independente das outras duas changes; pode ir primeiro.

## Open Questions

Nenhuma.
