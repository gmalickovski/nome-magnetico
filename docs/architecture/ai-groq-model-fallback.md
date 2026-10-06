# IA — Modelos Groq e Fallback OpenAI

## Contexto

Em **16/08/2026**, a Groq descontinuou para contas free/developer:

- `llama-3.3-70b-versatile`
- `llama-3.1-8b-instant`

Chamadas com esses IDs passam a retornar HTTP **404** com `code: model_not_found`.

## Sintoma em produção (DEV-110)

- UI: tela **ERRO NA ANÁLISE** (“Não foi possível concluir a análise agora…”).
- `analyses.status = error` com a mesma mensagem amigável.
- `error_logs`: `analysis falhou após 3 tentativas: 404 … model_not_found`.
- Sentry **não** capturou o erro de IA (só vai para `error_logs` / HQ monitor).

## Causa raiz

1. `src/backend/ai/config/models.ts` ainda apontava para os modelos Llama retirados.
2. O fallback Groq → OpenAI em `brain.ts` só tratava **rate limit (429)**.
3. Em 404, o Brain fazia **3 retries no próprio Groq** e nunca chamava OpenAI — mesmo com `OPENAI_API_KEY` válida.

## Correção

| Peça | Mudança |
|------|---------|
| Modelos Groq | `openai/gpt-oss-120b` (analysis/suggestions/guide) e `openai/gpt-oss-20b` (support_polish) |
| `providers/groq.ts` | Mapeia 404/auth/modelo morto → `GROQ_UNAVAILABLE` |
| `brain.ts` | Fallback OpenAI também em 404 / `model_not_found` / `GROQ_UNAVAILABLE` |
| Admin UI | Opções Groq atualizadas no `AIConfigEditor` |

## Substitutos oficiais (Groq)

| Antigo | Novo (recomendado) |
|--------|--------------------|
| `llama-3.3-70b-versatile` | `openai/gpt-oss-120b` (ou `qwen/qwen3.8-27b`) |
| `llama-3.1-8b-instant` | `openai/gpt-oss-20b` |

Referência: [Groq Model Deprecations](https://console.groq.com/docs/deprecations).

## Validação rápida

```bash
# Groq (deve retornar 200 com openai/gpt-oss-120b)
curl -sS https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-120b","messages":[{"role":"user","content":"ok"}],"max_tokens":64}'

# OpenAI (fallback)
curl -sS https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"ok"}],"max_tokens":8}'
```

## Arquivos

- `src/backend/ai/config/models.ts`
- `src/backend/ai/providers/groq.ts`
- `src/backend/ai/brain.ts`
- `src/backend/ai/usage-stats.ts`
- `src/frontend/components/admin/AIConfigEditor.tsx`
