# DEV-304 — Auditoria de IA: modelos, prompts e nomes da LLM

Base: `main` com DEV-301, DEV-302 e DEV-303. Nenhuma chamada paga real foi feita: provedores e banco são simulados nos testes.

## 1. Quem chama a IA e quem decide os nomes

| Função (`brain.ts`) | Tarefa | Chamador vivo | Pede nomes à IA? | Guardas |
| --- | --- | --- | --- | --- |
| `generateSocialAnalysis` | `analysis` | `api/analyze` (Nome Social, sem nome já escolhido no chat) | **Não.** Os nomes vêm do motor v4 e a IA só explica. | LoopGuard, guarda de vocabulário, teto diário |
| `generateAnalysis` | `analysis` | `api/analyze` (fallback genérico) | Não | idem |
| `generateSupportPolish` | `support_polish` | `api/internal/ai-polish` | Não (texto do agente) | LoopGuard, teto diário (sistema, sem usuário) |
| `generateSuggestions` | `suggestions` | **nenhum** (só um import morto, removido) | Escolhe 3 entre candidatas dadas | LoopGuard, **lista fechada de nomes**, vocabulário, teto diário |
| `generateGuide` | `guide` | nenhum | Não | LoopGuard, vocabulário, teto diário |
| `generateBabyAnalysis`, `generateCompanyAnalysis` | `analysis` | nenhum | Não | LoopGuard, vocabulário, teto diário |
| `streamAnalysis` | `analysis` | nenhum | Não | LoopGuard (1 tentativa) |
| JEV no `decide-live` | JEV, Groq e OpenAI | `api/decide-live` | Não (só área, uso, estilo e subfoco) | DEV-303: teto de custo, LoopGuard, validação, kill switch |

Conclusão: **nenhum caminho vivo pede nomes à IA**. Os nomes oferecidos ao usuário saem do motor determinístico (zero bloqueio, nota mínima 70 e acima do nascimento). Os caminhos mortos (`generateSuggestions` e outros) foram deixados com a mesma proteção, para que religá-los não abra uma brecha.

Também confirmado por busca no código: nenhum SDK ou endpoint de IA é usado fora de `src/backend/ai/` e do provider do JEV.

## 2. O que mudou

### 2.1 Nomes da IA só da lista do motor (`ai/output-guard.ts`)
- `generateSuggestions` só entrega à IA as candidatas que o motor poderia oferecer (`motivoNaoOfertavel`: sem bloqueio, nota mínima). Com a nota do nascimento (`opcoes.scoreNascimento`) vale `max(70, nascimento + 1)`; sem ela, descarta ao menos quem tem bloqueio. Nenhuma candidata ofertável: não chama a IA (`NO_OFFERABLE_CANDIDATES`).
- A resposta só passa se todo título `### ✨ Nome: …` estiver na lista, com os **mesmos acentos** (o acento muda o número). Nome inventado, acento trocado ou nenhum nome no formato esperado reprovam a tentativa; após 3 tentativas o erro sobe e nada chega ao usuário.

### 2.2 Vocabulário proibido
Regras em `COPY_PROIBIDA`: radiestesia e pêndulo, "incompatível" (usar "Tensão Vibracional"), prazo de entrega ou revisão individual da análise (o produto é self-service e imediato) e preço. Vale para todo texto ao cliente (análises e guia); o polimento de suporte é texto do agente e fica de fora.
- Tentativas 1 e 2: a resposta é refeita (cada resposta é registrada em `ai_usage`).
- Tentativa 3: remove só as frases problemáticas, em vez de perder a análise inteira.
- Os prompts de análise, bebê e empresa diziam "este relatório vale R$150+"; trocado por "relatório premium (nunca cite preço ou valor)".

### 2.3 Prompt-base (`system-kabbalistic.ts`)
- **Erro corrigido:** dizia "grave (×3)". O correto é grave e trema ×2, com circunflexo e anel +7 e o apóstrofo +2.
- **Definições alinhadas ao projeto:** Impressão agora é "consoantes, sempre de 1 a 9" (estava "primeiro nome"), Missão é Destino + Expressão, e 11 e 22 não são reduzidos em Expressão, Destino, Motivação e Missão.
- **Regras sobre nomes** (R1 a R4 da DEV-301 como contexto): só nomes dos dados, todos já sem bloqueio e com nota mínima 70, o Nome de Ouro equilibra nota e perfil, a maior nota sempre aparece, e sem opção válida a IA explica com honestidade e não inventa.
- **Vocabulário e promessas proibidos** repetidos no prompt.

### 2.4 Prompt do Nome Social
- "Use SOMENTE os nomes listados acima".
- Quando o motor não achou opção válida, o prompt manda explicar que o nome de nascimento já está muito perto do máximo para a data, sem inventar alternativa.

### 2.5 Teto diário de tokens por usuário
`getUserTokensToday` existia e **nunca era chamado**: o limite de 50k tokens do LoopGuard vale por chamada, não por usuário. Agora `runWithGuard` consulta a soma das últimas 24h em `ai_usage` antes de gastar e responde `USER_TOKEN_LIMIT` acima do teto.
- `AI_MAX_TOKENS_PER_USER_DAY`, padrão **500000**; `0` desliga. Falha aberta se o banco não responde. Chamadas de sistema (sem usuário) não entram.
- Um tratamento de erro específico na tela, para `USER_TOKEN_LIMIT`, não foi feito: hoje cai no erro genérico de análise (a rota já registra o erro).

### 2.6 Configuração
- Temperatura de `suggestions`: 0.8 para 0.4 (escolher entre candidatas dadas não pede criatividade).
- `models.ts`, `providers.ts` e os limites de tokens ficam como estão (ver abaixo).

## 3. Achados que NÃO mudei (decisão do Guilherme)

1. **Provedor padrão ignora `APP_ENV`.** O `CLAUDE.md` diz que produção usa Claude e desenvolvimento usa Groq, e o comentário do `router.ts` diz "padrão por APP_ENV", mas `getDefaultProvider()` devolve `groq` sempre, salvo `AI_DEFAULT_PROVIDER` ou uma linha ativa em `ai_config`. Mudar o padrão pode trocar o provedor de produção e o custo. Conferir o que a produção usa hoje (linha em `ai_config` ou env) antes de decidir.
2. **Modelos Claude podem estar defasados.** A configuração usa `claude-sonnet-4-6` e `claude-haiku-4-5-20251001`; existem versões mais novas (família 5). Trocar muda custo e tom do texto: testar no TESTE com chave e teto de gasto autorizados antes.
3. **Risco de texto cortado com `openai/gpt-oss-120b` (Groq).** Modelos com raciocínio gastam parte de `max_tokens` pensando; a análise completa tem 9 seções e `analysis` usa 6000. Ninguém checa `finish_reason = length`, então um texto cortado seria salvo como completo. Medir em chamada real (autorizada) e, se confirmar, subir o limite ou reduzir o esforço de raciocínio.
4. **Código sem uso:** `PRODUCT_AI_CONFIG`, `streamAnalysis`, `generateGuide`, `generateBabyAnalysis` e `generateCompanyAnalysis` não têm chamador. Remover é uma limpeza própria.
5. **Cota por tipo de erro:** `QUOTA_EXCEEDED` (limite do provedor) e `USER_TOKEN_LIMIT` (limite do usuário) são erros diferentes, mas a tela ainda não os separa.

## 4. Testes
- `ai/output-guard.test.ts` (12): vocabulário, extração e validação de nomes (com acento), filtro de candidatas.
- `ai/brain-guard.test.ts` (19): provedor e banco simulados. Nome inventado nas 3 tentativas não chega ao usuário, candidata inválida nem entra no prompt, copy proibida refaz e depois limpa, fallback Groq para OpenAI também valida, teto diário (acima, abaixo, desligado, sem usuário, banco fora), registro em `ai_usage`.
- `ai/prompts-audit.test.ts` (21): regras de acento e dos 5 números no prompt-base, nenhum prompt com vocabulário proibido, prompt do Nome Social montado com o resultado real do motor (sem bloqueio, sem nota baixa, estado vazio), configuração de modelos, temperaturas e provedor.

## 5. Rollback
- `AI_MAX_TOKENS_PER_USER_DAY=0` desliga o teto diário.
- A guarda de vocabulário e a de nomes ficam no código: para desligar, reverter o commit. Sem migration e sem mudança de schema.
