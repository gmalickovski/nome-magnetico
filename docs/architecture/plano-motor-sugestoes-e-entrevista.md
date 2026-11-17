# Plano — Motor de sugestões, entrevista (chat) e JEV

Base: `origin/main` 263ae67 (16/11/2026). Status: **proposta**, nada implementado. Ambiente de validação: cofre `Studio MLK - TESTE` + Supabase `nome_magnetico_teste` (`kbqrkkltjvmxomrgsrbc`) + Stripe test.

## 1. Regras de negócio (alvo) — revisadas pelo Guilherme em 17/11/2026

Toda sugestão **oferecida** ao usuário (Nome de Ouro, top 3, lista do chat, "gerar mais", export do PDF) obedece:

| # | Regra |
|---|---|
| R1 | Zero bloqueio nos 4 triângulos (`temBloqueio === false`) |
| R2 | Piso absoluto 70: `scoreMinimo = max(70, scoreNascimento + 1)`. Nascimento < 70 → sugestões ≥ 70; nascimento ≥ 70 → sempre acima do nascimento, nunca igual. Priorizar as mais altas (meta: ≥ nascimento + 5 quando existir) |
| R3 | Nome de Ouro = equilíbrio nota × perfil. Mantém a ordem de prioridade atual do comparador (etapas, estilo/abertura, sobrenomes, curto × formal, ortografia), só sobre o conjunto R1 + R2. Pode ter nota menor que outra opção se combina mais com o cliente (assinatura curta, sem um sobrenome, só o primeiro nome) |
| R3a | A opção válida de maior nota sempre aparece entre as visíveis, com selo "Maior nota" |
| R3b | "Gerar mais" traz as próximas válidas de nota alta, na mesma ordem, sem repetir |
| R4 | Regra dura nunca é relaxada para encher lista. Sem opção válida → estado vazio honesto |

R1 e R2 são duras. Preferências do questionário são moles e só se relaxam dentro do conjunto válido.

## 2. Diagnóstico (comprovado no código e em teste)

Script de estresse no scratchpad: 120 nomes sintéticos × 6 perfis de questionário = 720 casos, 2.805 sugestões oferecidas, motor v3.

| Métrica | Resultado |
|---|---|
| Sugestões oferecidas com bloqueio | **41** |
| Sugestões abaixo de nascimento + 5 | **38** |
| Nome de Ouro com score menor que outra opção válida | **77** casos |
| Casos sem nenhuma sugestão | 5 |

Todas as 41 com bloqueio vieram do perfil "Quase nada, só um detalhe" (`maxNivelGeracao = 50`).

Causas:

1. **Fallbacks que ignoram bloqueio** — `gerarSugestoesAutoSocial` ([nome-social.ts:856-866](../../src/backend/numerology/products/nome-social.ts)) devolve `analisados.slice(...)` quando há menos de 3 limpos. Os filtros do perfil (`maxNivelGeracao`, `restricaoDocumentosLegais`, sobrenomes excluídos, "gerar mais" com `nomesExcluidos`) encolhem o pool e acionam esse caminho.
2. **Candidatos do usuário nunca são filtrados por bloqueio** — `assinaturaAtual` (vem de "Como te chamam?") e `nomesCandidatos` entram em `analisesUsuario` e podem virar Nome de Ouro via `ordenarPorNotaDescEstavel(analisesUsuario)` ([nome-social.ts:1041-1045](../../src/backend/numerology/products/nome-social.ts)).
3. **Export do chat com nome manual** — [analyze.ts:349](../../src/pages/api/analyze.ts) substitui `nomesCandidatos` pela lista inteira, sem R1 nem R2.
4. **Ganho mínimo = 0** e comparação estrita (`>`), em [suggestion-birth-invariant.ts:14-25](../../src/backend/numerology/suggestion-birth-invariant.ts).
5. **Comparador prioriza etapa sobre score** ([nome-social.ts:681-765](../../src/backend/numerology/products/nome-social.ts)): fora da faixa N5 (≥ 85), a menor mudança vence mesmo com nota menor.
6. **Score v3 só desconta o Triângulo da Vida** ([score.ts:303](../../src/backend/numerology/score.ts)). Em 8.724 candidatos testados, Vida limpo ⇒ nenhum bloqueio nos outros 3 triângulos, então hoje não é falha prática. Mesmo assim o filtro final vai usar `temBloqueio` (4 triângulos), como manda o CLAUDE.md.
7. **Grafias artificiais** — o gerador põe til/acento em qualquer vogal: "Pãtrícia", "Ãlmeida", "Diegõ", "Juliãna".
8. **Legado morto** — `gerarNomesMagneticos` ([suggestions.ts](../../src/backend/numerology/suggestions.ts)) usa só o Triângulo da Vida e score v1; está importado em `analyze.ts`, mas não é chamado.

Entrevista / JEV:

9. **Respostas que não mudam o nome** — `estilo_presenca`, `area_foco` e `subfoco` não entram em `profileToRankingOpcoes` ([questionnaire-map.ts:84](../../src/shared/interactive-engine/questionnaire-map.ts)). Viram só texto do palpite. Metade da entrevista não afeta a sugestão.
10. **Roteiro fixo** — `router.ts` segue 8 passos em ordem fixa. O JEV só decide contexto/área/estilo em `decide-live`; o motor adaptativo (`NM_CHAT_ADAPTIVE_JEV`) existe só com mocks.
11. **Pendências DEV-267/274 antes de chamar JEV real**: `decide-live` é público, sem LoopGuard, sem teto de custo, sem validação de saída do provider.

## 3. Fases

### F0 — Preparação (slate)
- Issue Linear (time Desenvolvimento, `area:backend`), branch `linear/dev-XXX-motor-sugestoes-v4`, worktree e PR em rascunho.
- `npm ci`, `.env` do cofre TESTE (feito e conferido: Supabase `nome_magnetico_teste`, Stripe `sk_test`).
- Baseline: `npm test`, `npx astro check`, `npm run build`. Guardar o relatório do script de estresse como "antes".

### F1 — Motor de sugestões (prioridade)
1. **Validador único** `validarSugestaoOfertavel(analise, scoreNasc)` em `suggestion-birth-invariant.ts`: R1 + R2. Toda saída passa por ele: `analisarNomesSocial` (melhorNome, top3, nomesCandidatos), `regenerate-suggestions`, `decide-live`, export em `analyze.ts`, `nome-social-potencial-pdf`.
2. **R2**: `passaPisoSugestao` = `score >= max(70, base + 1)` (`PISO_ABSOLUTO = 70` em `score-config.ts`); a env só pode subir o mínimo.
3. **R4**: remover os retornos com bloqueio de `gerarSugestoesAutoSocial`. Relaxamento em cascata só nas preferências moles: estilo → teto de nível → sobrenomes excluídos → etapa 3. Nunca R1/R2.
4. **R3/R3a/R3b**: manter o comparador atual rodando depois do validador; garantir a opção de maior nota visível (`maiorNota: true`); "gerar mais" com as próximas válidas de nota alta.
5. **Nomes do usuário** ("como te chamam", assinatura atual, digitados): continuam avaliados e aparecem como **comparação**; só viram sugestão se passarem no validador.
6. **Busca ampliada** quando houver menos de N válidas: mais posições de acento (com a regra 7), consoante dobrada, troca Y/I, K/C, PH/F, nome de uso como base, combinações de sobrenomes. Teto de candidatos por análise para controlar CPU.
7. **Ortografia plausível** (filtro): til só em `a`/`o` em posição nasal ou final (`ã`, `ão`, `õe`); no máximo 1 acento novo por palavra; nada de acento na vogal inicial do sobrenome ("Ãlmeida"). Grafia única continua permitida, mas não grafia impossível.
8. **Estado vazio**: `semOpcoesElegiveis` gera a mensagem "Seu nome já está muito perto do máximo para esta data" e oferece o CTA "aceitar mudanças maiores", que libera as preferências moles. Sem fallback com bloqueio.
9. Aposentar `suggestions.ts`/`gerarNomesMagneticos` (import morto) e alinhar `docs/architecture/logica-analises.md` (ainda descreve score v1 e "sem bloqueios **ou menos que o original**").
10. **Flag de rollback** `NOME_SOCIAL_MOTOR_V4` (default `true` no TESTE; produção decide o Infra).

Testes F1, adicionados ao `npm test`:
- Propriedade sobre ~1.000 nomes sintéticos × datas × 6 perfis: 0 bloqueios ofertados, 0 abaixo de `max(70, nascimento + 1)`, opção de maior nota sempre visível, 0 grafias proibidas.
- Regressão: `chat-ranking-exact`, `nome-social-v3`, `suggestion-birth-invariant`, `curso-dev260`.

### F2 — Perfil da entrevista → escolha do nome (JEV)
- Mapear `estilo_presenca`, `area_foco` e `subfoco` para **afinidades numerológicas** (números de Expressão/Motivação/Impressão preferidos), usadas só no desempate de R3. Rascunho a validar com o Guilherme:

| Resposta | Afinidade proposta |
|---|---|
| Dinheiro e prosperidade | 8, 4 |
| Carreira e negócios / liderança | 1, 8, 22 |
| Relacionamentos | 2, 6 |
| Autoestima e expressão | 3, 5, 1 |
| Firme e confiável | 4, 8 |
| Leveza e acolhimento | 2, 6 |
| Criatividade marcante | 3, 5 |
| Elegância discreta | 7, 6 |

- Texto "por que este nome para você" gerado a partir das afinidades atendidas (template; LLM opcional e só redator).
- JEV `score` por dimensão vira peso do desempate; `choice` decide o próximo passo (F3).

### F3 — Questionário mais inteligente
- **Adaptativo**: pular perguntas já inferidas (ex.: "Não me representa" libera mudança maior sem perguntar "quanto topa mudar"; "Contratos" implica restrição legal).
- **Opções novas** (meta: até 10 passos, a maioria com 1 toque):
  - "Manter o primeiro nome intacto?" (sim / tanto faz)
  - "Aceita acento na assinatura?" (sim / prefiro sem / tanto faz), hoje só inferido
  - "Outro" com texto livre em área de foco
  - Prioridade quando houver conflito: "nota mais alta" × "mudança menor" (ajusta o peso nota × perfil de R3, sem esconder a de maior nota)
- Ligar `NM_CHAT_ADAPTIVE_JEV` **só no TESTE**, depois de: gate de sessão/teto em `decide-live`, LoopGuard no caminho JEV, validação Zod da saída do provider, telemetria de provider/tokens. Chamada paga real só com autorização e teto explícitos.

### F4 — IA e modelos
- Auditar `brain.ts`/prompts: a LLM **não propõe nomes**; se algum caminho ainda pedir nomes à IA, a saída passa pelo validador F1.
- Revisar `config/models.ts` e `providers.ts` (modelos atuais, fallback Groq), `temperatures.ts` para texto de explicação.

### F5 — Validação em sandbox (antes de merge/deploy)
1. `npm test`, `npx astro check`, `npm run build`.
2. Script de estresse "depois" comparado com o "antes" (anexado ao PR).
3. `npm run dev` com o `.env` TESTE: usuário teste no `nome_magnetico_teste`, chat completo com os 6 perfis, "gerar mais" até esgotar, export PDF, checkout Stripe test.
4. Migrations: nenhuma prevista. Se surgir, só com pedido explícito e só no TESTE.
5. PR draft → In Review → OK do Guilherme → backup Infra → merge → tag → deploy (humano).

## 4. Fora do escopo desta entrega
- `nome_bebe` e `nome_empresa` têm geradores próprios. O validador F1 deve ser reaproveitado lá numa issue seguinte.
- Mudança da fórmula do score v3 (pesos). As regras R1–R4 filtram e ordenam; não mudam a nota.

## 5. Rollback
Desligar `NOME_SOCIAL_MOTOR_V4` (volta ao comparador/fallback atuais) ou reverter a tag. Sem mudança de schema.
