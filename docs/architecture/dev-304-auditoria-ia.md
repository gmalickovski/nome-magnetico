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

### 2.7 Teste real com as credenciais do cofre TESTE (17/11/2026)

Com autorização do Guilherme e tetos baixos (6 chamadas por visitante, 20 por hora, 30 mil tokens por hora, 100 mil tokens por usuário por dia), o `decide-live` foi chamado de verdade em cada provedor, e a entrevista guiada foi percorrida passo a passo. Achados e correções:

| Achado | Evidência | Correção |
| --- | --- | --- |
| **O Groq do caminho de decisão usava um modelo aposentado.** O padrão era `llama-3.3-70b-versatile`, que a Groq retirou em 16/08/2026. Toda chamada dava 404 e a cadeia caía no OpenAI **pago**, sem ninguém perceber. | HTTP 404 "model does not exist" (170 ms) | Padrão agora `openai/gpt-oss-20b` (gratuito, o mesmo grupo de modelos do `models.ts`), trocável por `GROQ_DECIDE_MODEL`. Groq volta a ser o principal e o OpenAI só reserva. |
| **O OpenAI estourava o tempo limite.** O limite era 1,8 s e o `gpt-4o-mini` responde em 1,6 a 1,9 s. | 3 chamadas: 1944, 1663 e 1623 ms | Tempo limite 3,5 s (Groq) e 4 s (OpenAI), trocável por `NM_JEV_STRUCTURED_TIMEOUT_MS` (500 a 15000). |
| **O OpenAI devolvia valor fora da escala.** `clareza_relato_score: 8` para uma escala de 0 a 2. | resposta real; a validação da DEV-303 barrou e caiu no determinístico | Score virou inteiro com `enum` [0, 1, 2] no schema. |
| **O Groq recusa `enum` que mistura inteiros e decimais.** Fechar também a nota `noul` (0, 0,1…1) deu HTTP 400. | 6 variantes de schema testadas | A nota `noul` fica número livre; a faixa 0 a 1 é garantida pela validação Zod. Teste impede um enum numérico misto. |
| **`max_tokens: 200` ficava no limite com `gpt-oss`.** O raciocínio consome o limite: 182 e 199 tokens usados. | 2 chamadas com `finish=stop`, mas a 1 token do corte | `max_tokens` 600 e `reasoning_effort: 'low'` para modelos `gpt-oss`. |
| **A telemetria escondia o motivo da falha** (`http-other`). | foi preciso um diagnóstico à parte | Códigos próprios `http-400` e `http-404`. |
| **Grafia artificial ("Pedrõ", "Rõcha") ia para o topo** ao relaxar "prefiro sem acento", e vencia grafias naturais de mesma nota. | entrevista real com nome artístico | A grafia artificial passou a ser o último recurso da cascata e, no comparador, fica atrás da natural no mesmo patamar de nota. |

### 2.8 A entrevista manda; sem estilo definido, a assinatura que menos muda o nome

Regra de produto do Guilherme (17/11/2026): a preferência descrita na entrevista sempre prevalece, mas a maioria das pessoas quer uma assinatura que mude pouco, de preferência o primeiro nome mais um dos sobrenomes; acento e o que destoa do nome real ficam por último.

- **Padrão sem estilo definido** (entrevista aberta, "o que fizer sentido", "não me representa"): entre as sugestões com nota até 15 pontos da melhor, o Nome de Ouro é a que menos distorce o nome (`distorcaoDoNome`): primeiro nome + 1 sobrenome → tirar 1 sobrenome → acento leve → só o primeiro nome → duplicação, corte e apelido → grafia artificial. A de maior nota continua sempre visível, com o selo.
- **A entrevista passa na frente**: estilo explícito ("um acento ou letra", "tirar ou trocar um sobrenome", curto), "Prefiro sem acento" e os sobrenomes que a pessoa disse usar valem **antes** da faixa de nota (antes, só desempatavam dentro dela); "nota mais alta" põe a nota na frente.
- Exemplo (nascimento 01/01/1990, "Camila Dias Nunes"): entrevista aberta → `Camila Nunes` (76), com `Camilã Diás Nunes` (89) como maior nota ao lado; "um acento ou letra" → `Camilã Días Nunes`; "nota mais alta" → o de 89.
- Os goldens do Growth (DEV-186 e DEV-260) continuam passando.

Resultado final, com as chaves reais do TESTE, nos 3 provedores isolados: JEV (`typesafe-jev`, cerca de 210 a 310 ms por passo), Groq (`groq-structured`, cerca de 1 s, 720 tokens) e OpenAI (`openai-structured`, cerca de 1,9 s, 540 tokens), todos com `outcome: ok`. A entrevista completa (12 passos no caminho comum, 9 em "Não me representa") usou só o JEV e gerou 3 sugestões válidas.

## 3. Achados que NÃO mudei (decisão do Guilherme)

1. **Provedor padrão ignora `APP_ENV`.** O `CLAUDE.md` diz que produção usa Claude e desenvolvimento usa Groq, e o comentário do `router.ts` diz "padrão por APP_ENV", mas `getDefaultProvider()` devolve `groq` sempre, salvo `AI_DEFAULT_PROVIDER` ou uma linha ativa em `ai_config`. Mudar o padrão pode trocar o provedor de produção e o custo. Conferir o que a produção usa hoje (linha em `ai_config` ou env) antes de decidir.
2. **Modelos Claude podem estar defasados.** A configuração usa `claude-sonnet-4-6` e `claude-haiku-4-5-20251001`; existem versões mais novas (família 5). Trocar muda custo e tom do texto: testar no TESTE com chave e teto de gasto autorizados antes.
3. **Risco de texto cortado com `openai/gpt-oss-120b` (Groq) na análise completa.** Medido só para a decisão do JEV (182 e 199 tokens usados de 200, já corrigido). A análise completa tem 9 seções e `analysis` usa 6000, e ninguém checa `finish_reason = length`, então um texto cortado seria salvo como completo. Medir com uma análise real (consome tokens) e, se confirmar, subir o limite ou reduzir o esforço de raciocínio.
4. **Código sem uso:** `PRODUCT_AI_CONFIG`, `streamAnalysis`, `generateGuide`, `generateBabyAnalysis` e `generateCompanyAnalysis` não têm chamador. Remover é uma limpeza própria.
5. **Cota por tipo de erro:** `QUOTA_EXCEEDED` (limite do provedor) e `USER_TOKEN_LIMIT` (limite do usuário) são erros diferentes, mas a tela ainda não os separa.

## 4. Testes
- `ai/output-guard.test.ts` (12): vocabulário, extração e validação de nomes (com acento), filtro de candidatas.
- `ai/brain-guard.test.ts` (19): provedor e banco simulados. Nome inventado nas 3 tentativas não chega ao usuário, candidata inválida nem entra no prompt, copy proibida refaz e depois limpa, fallback Groq para OpenAI também valida, teto diário (acima, abaixo, desligado, sem usuário, banco fora), registro em `ai_usage`.
- `ai/prompts-audit.test.ts` (21): regras de acento e dos 5 números no prompt-base, nenhum prompt com vocabulário proibido, prompt do Nome Social montado com o resultado real do motor (sem bloqueio, sem nota baixa, estado vazio), configuração de modelos, temperaturas e provedor.

## 5. Rollback
- `AI_MAX_TOKENS_PER_USER_DAY=0` desliga o teto diário.
- A guarda de vocabulário e a de nomes ficam no código: para desligar, reverter o commit. Sem migration e sem mudança de schema.

### 2.9 Preferências estruturais e vitrine de 6 opções

- **Preferências estruturais mandam** (quantos/quais sobrenomes, "só o primeiro nome", manter o primeiro nome): quem as atende vem primeiro, ordenado pela **melhor nota**; as demais vêm por **menor distorção do nome**. Nova resposta exclusiva "Só o primeiro nome" na pergunta de sobrenomes (vale só se nenhum sobrenome for marcado junto).
- **Vitrine** (DEV-305 voltou a 3 opções): 3 de início, "Gerar mais" traz mais 3 por pedido (2 pedidos), teto de 9. A experiência de 6 de início foi testada na v1.37.0 e revertida a pedido do Guilherme.
- **A de maior nota sempre aparece entre as 3**, mesmo fora do padrão escolhido (a pessoa pode mudar de ideia). Se a preferência restringe demais e as notas caem, a de maior nota fica visível com o selo.
- Constantes em `src/shared/nome-social/gerar-mais-limits.ts` (`SUGESTOES_INICIAIS=3`, `POR_RODADA=3`, `MAX_PEDIDOS=2`, `MAX_TOTAL=9`).
