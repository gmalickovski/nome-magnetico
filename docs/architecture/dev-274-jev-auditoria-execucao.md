# DEV-274 — Auditoria UI → endpoint → `runJevDecision` (Parte 1 · mocks)

Relaciona [DEV-267](jev-verificacao-dev267.md) (contrato e mocks do provider) com o chat adaptativo JEV + LLM. **Parte 1 autorizada em 12/11/2026:** somente mocks, sem chamadas pagas (TypeSafe/JEV, Groq, OpenAI).

## Diagrama do fluxo atual (comprovado no código)

```text
NomeSocialChat.tsx
  └─ fetch POST /api/decide-live  (decide-live-bridge.ts monta o body)
       └─ decideLiveSchema (Zod)
       └─ determineNextStep (router.ts · regras fixas DEV-235)
       └─ InteractiveDecisionEngine.evaluate (engine.ts)
            └─ runJevDecision (providers/jev-provider.ts)
                 ├─ 1 TYPESAFE_API_KEY → TypeSafeClient.systemOne (model jev-latest, 1500 ms)
                 ├─ 2 GROQ_API_KEY + relato ≥ 6 → Groq chat/completions (json_schema, 1800 ms)
                 ├─ 3 OPENAI_API_KEY + relato ≥ 6 → OpenAI idem
                 └─ 4 evaluateDeterministically (0 ms, regex + chips)
       └─ buildProfilePalpiteText / buildPanelData (numerologia local, sem IA)
```

**UI não chama JEV diretamente.** O provider efetivo volta em `providerUsed` no JSON e em `console.info('[api/decide-live] providerUsed', …)`.

## Provider/model por condição de ambiente (hoje)

| Ordem | Condição | Provider (`providerUsed`) | Modelo / destino | Execução comprovada em CI |
| --- | --- | --- | --- | --- |
| 0 | `NM_JEV_MOCK_ONLY=true` (DEV-274) | `deterministic` | Regras locais; **nenhuma** rede | Sim (`jev-provider.mock.test.ts`, `adaptive-interview.fixtures.test.ts`) |
| 1 | `TYPESAFE_API_KEY` definida e mock off | `typesafe-jev` | `jev-latest` via `@typesafe-ai/sdk` | Só com SDK mockado nos testes |
| 2 | Falha JEV + `GROQ_API_KEY` + relato ≥ 6 chars | `groq-structured` | `GROQ_DECIDE_MODEL` ou `llama-3.3-70b-versatile` | Não (rede bloqueada nos testes) |
| 3 | Falha Groq + `OPENAI_API_KEY` + relato ≥ 6 chars | `openai-structured` | `OPENAI_DECIDE_MODEL` ou `gpt-4o-mini` | Não |
| 4 | Sem chave, falha ou relato curto | `deterministic` | Regex + chips do questionário | Sim (`interactive-engine.test.ts`) |

**Integração presente ≠ execução comprovada:** o SDK e os `fetch` para Groq/OpenAI existem no código; chamadas reais à TypeSafe/Groq/OpenAI **não** são parte desta entrega.

### Funções auxiliares (fora do chat principal)

| Função | Modelo | Quando |
| --- | --- | --- |
| `locateSignatureBoxWithJev` | `jev-preview` | Imagem de assinatura; mesmo gate `TYPESAFE_API_KEY` |

### Presets e partitura

| Artefato | Papel |
| --- | --- |
| `presets/nome-magnetico.ts` → `buildNomeMagneticoJevQuestions()` | Perguntas System One (`choice`, `noul`, `score`) enviadas ao JEV |
| `partitura.ts` | Matriz passo × camada (código / JEV / LLM escritor) |
| `questionnaire-adaptive.ts` | Árvore fixa 8 perguntas + palpite (roteador **sem** JEV por pergunta) |
| `writer.ts` | LLM escritor **desligado**; só template `buildProfilePalpiteText` |
| `thresholds.ts` | `CHOICE_MIN`, `NOUL_YES/NO`, `JUDGE_MAX`, etc. |

## Entrevista adaptativa DEV-274 (flag desligada por padrão)

| Variável | Padrão | Efeito |
| --- | --- | --- |
| `NM_CHAT_ADAPTIVE_JEV` | ausente / `false` | Fluxo atual (DEV-235); endpoint `POST /api/adaptive-interview` retorna 404 |
| `NM_CHAT_ADAPTIVE_JEV=true` | — | Habilita motor em `src/shared/interactive-engine/adaptive/*` |
| `NM_JEV_MOCK_ONLY` | `true` quando adaptativo ligado em teste | `runJevDecision` **nunca** instancia TypeSafe/Groq/OpenAI |

**Separação de responsabilidades (design Parte 1):**

- **JEV (mock tipado):** `choice` próximo ramo/pergunta, `noul` aprofundar, `score` aderência por dimensão (`interview-lines`).
- **LLM (mock):** só redige pergunta, explicação de contradição e blocos do resumo a partir de evidências já coletadas e números do motor numerológico (sem inventar perfil).

Endpoint: `POST /api/adaptive-interview` — Zod, `AdaptiveSessionGuard` (limites sessão/custo/timeout), `providerPath` observável.

## Lacunas conhecidas (decisão humana antes de chamadas reais)

1. **LoopGuard DB** (`src/backend/ai/loop-guard.ts`) ainda não envolve `decide-live` / JEV (apontado na DEV-267).
2. **`decide-live` é público** sem gate de assinatura (preview gratuito); habilitar JEV real exige teto server-side.
3. **Autorização Guilherme** para consumo TypeSafe/Groq/OpenAI e telemetria de tokens (DEV-267 In Review).
4. **UI do resumo confirmável** (card Marca × Marketing) — backend pronto em `profile-summary.ts`; ligação no `NomeSocialChat` fica para Parte 2 / DEV-275.
5. **Título do card e CTA** — divergência registrada no comentário 12/11 na issue.

## Como testar

```bash
NM_JEV_MOCK_ONLY=true npm test
npx astro check
npm run build
```

Fixtures dedicadas: `src/shared/interactive-engine/adaptive/adaptive-interview.fixtures.test.ts` (entrevista curta, contraditória, revisão de preferência, ausência de provider).

## Rollback

Desligar `NM_CHAT_ADAPTIVE_JEV` (ou remover da env). Reverter tag anterior em produção; código antigo continua usando só `decide-live` + roteador DEV-235.
