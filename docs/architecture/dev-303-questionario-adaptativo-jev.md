# DEV-303 — Questionário adaptativo e proteções do JEV

Base: `main` com DEV-301 (motor v4) e DEV-302 (afinidades do perfil). Relacionada a [DEV-267](jev-verificacao-dev267.md) e [DEV-274](dev-274-jev-auditoria-execucao.md).

## 1. Proteções do caminho JEV, Groq e OpenAI (`decide-live`)

Arquivo: `src/shared/interactive-engine/providers/jev-safety.ts`. Sem rede, sem banco, sem imports de `backend/`.

| Proteção | Como funciona | Env (padrão) |
| --- | --- | --- |
| **Kill switch** | Com `NM_JEV_REMOTE_DISABLED=true`, nenhum provider externo é chamado, mesmo com todas as chaves. Responde o determinístico. | desligado |
| **Teto por visitante** | Chamadas remotas em 10 min por visitante anônimo (`ip:<hash>`, nunca IP puro). | `NM_JEV_MAX_CALLS_PER_ANON` (6) |
| **Teto por usuário** | Idem para usuário logado (`u:<id>`). | `NM_JEV_MAX_CALLS_PER_USER` (20) |
| **Teto global por hora** | Soma de todas as chamadas remotas. | `NM_JEV_MAX_CALLS_PER_HOUR` (400) |
| **Teto de tokens por hora** | Soma dos tokens informados pelo provider (Groq e OpenAI). `0` desliga. | `NM_JEV_MAX_TOKENS_PER_HOUR` (150000) |
| **Guarda de tentativas** | `LoopGuard` do backend recebe cada chamada: máximo de 3 tentativas e 50k tokens por sessão. Sem guarda recebida, usa um espelho com os mesmos limites. | fixo |
| **Validação da saída** | Zod sobre o que o JEV, o Groq e o OpenAI devolvem: enums do domínio, `noul` entre 0 e 1, `score` entre 0 e 2. Fora do domínio, vira `invalid-output` e a cadeia segue para o próximo nível. | fixo |

Acima de qualquer teto, o endpoint **não falha**: usa o determinístico (regex e chips do questionário) e registra o motivo.

Limite conhecido: o orçamento é **em memória, por processo Node**. A VPS roda um processo, então o teto vale como está. Com mais de uma instância, o teto efetivo é multiplicado pelo número delas; nesse caso mover o contador para o banco.

Cadeia de fallback, na ordem: JEV (TypeSafe) → Groq → OpenAI → determinístico. Groq e OpenAI só entram com relato de 6 caracteres ou mais.

### Telemetria sanitizada

`POST /api/decide-live` devolve `jevTelemetry` e escreve uma linha de log `[api/decide-live] jev`:

```json
{ "providerUsed": "deterministic", "providerPath": ["typesafe-jev:http-402", "deterministic-local"],
  "fallbackReason": "all-failed", "budgetDenial": null,
  "attempts": [{ "provider": "typesafe-jev", "outcome": "http-402", "latencyMs": 212 }],
  "tokens": 0, "latencyMs": 215 }
```

- `outcome`: `ok`, `invalid-output`, `timeout`, `guard-blocked`, `http-401`, `http-402`, `http-403`, `http-429`, `http-5xx`, `http-other`, `error`.
- `fallbackReason`: `mock-only`, `remote-disabled`, `no-keys`, `short-report`, `budget-exceeded`, `all-failed`.
- `budgetDenial`: `per-key`, `global`, `tokens`.
- Nunca entram mensagem de erro, nome, relato, e-mail ou chave.
- Cada resposta remota válida grava uma linha em `ai_usage` (`task = 'jev-decision'`, `user_id` nulo para visitante).

## 2. Roteiro adaptativo

Máximo de **10 passos**: os 8 de antes, mais `preferencias_assinatura` e `prioridade_conflito`. O roteador (`router.ts`) pula o que já está implícito:

| Resposta anterior | Pergunta pulada | Por quê |
| --- | --- | --- |
| "Não me representa" (`relacao_nome`) | `abertura_mudanca` | já indica abertura para mudar (estilo `qualquer`, sem teto de nível) |
| "Quase nada, só um detalhe" (`abertura_mudanca`) | `prioridade_conflito` | já é "mudar o mínimo" |
| "Contratos e documentos" (`onde_assina`) | `prioridade_conflito` | restrição legal já limita a mudança |

Caminhos: comum 10 perguntas; "Não me representa" 9; "Não me representa" com contratos 8. O contador de passos restantes e o "voltar" do chat respeitam o que foi pulado. Sessões salvas antes desta mudança ganham os campos novos com valor inicial.

## 3. Perguntas e opções novas

| Pergunta | Opções | Efeito (sempre preferência mole) |
| --- | --- | --- |
| `preferencias_assinatura` (até 2) | Manter meu primeiro nome · Prefiro sem acento · Tanto faz | `manterPrimeiroNome` filtra para sugestões com o primeiro nome idêntico ao do nascimento. `acentoNaAssinatura = prefere_sem` filtra sugestões sem acento novo e, no comparador, prefere as sem acento no mesmo patamar de nota. "Tanto faz" não ativa nada. |
| `prioridade_conflito` | A nota mais alta · Mudar o mínimo | `nota`: dentro do patamar, vence a maior nota (a menor mudança só desempata). `mudanca`: vale a ordem de antes (menor mudança primeiro). |
| `area_foco` ganhou **Outro foco** | texto livre, até 60 caracteres | sanitizado (sem controle, marcação ou `<>`); a área vira a mais próxima por palavras-chave (`inferAreaFocoFromText`), padrão carreira e negócios; o texto vai para o contexto da leitura. |

Nome artístico (já coletado em "Onde assina"): prioriza a forma curta (`curto_direto` e aceita encurtar), exceto com "quase nada", "acento ou letra" ou contratos.

### Relaxamento em cascata (motor v4)

As preferências relaxam, nesta ordem, quando não há 3 sugestões válidas, **sempre dentro do conjunto válido** (zero bloqueio e nota mínima da DEV-301):

1. grafia artificial → 2. teto de nível → 3. prefiro sem acento → 4. primeiro nome intacto → 5. sobrenomes excluídos → 6. etapa 3.

A restrição legal (contratos e documentos) não relaxa sozinha.

## 4. Fora desta entrega

- **O JEV `choice` decidindo o próximo passo no chat principal** não foi ligado. O roteador determinístico segue como fonte da verdade, agora com pulos por inferência. O motor adaptativo da DEV-274 (`NM_CHAT_ADAPTIVE_JEV`, `/api/adaptive-interview`) continua só com mocks e não exige os passos novos.
- **Chamada paga real** (TypeSafe, Groq, OpenAI) com autorização, chave e teto de gasto definidos pelo Guilherme. Nenhum teste faz chamada externa.
- Contador de orçamento compartilhado entre instâncias (ver limite acima).

## 5. Rollback

- Desligar chamadas externas na hora: `NM_JEV_REMOTE_DISABLED=true`.
- Voltar as preferências novas ao comportamento anterior: `NOME_SOCIAL_MOTOR_V4=false` (também desliga afinidades e a prioridade).
- Sem migration e sem mudança de schema.
