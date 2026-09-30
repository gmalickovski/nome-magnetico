# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Nome Magnético — Contexto do Projeto para Agentes IA

## Comandos

```bash
npm run dev      # servidor local (porta 4321 por padrão)
npm run build    # build de produção
npm run preview  # preview do build
npx astro check  # type-check TypeScript + Astro
```

Não há testes automatizados no projeto. Type-checking é feito via `npx astro check`.

## Identidade

**Produto:** Nome Magnético
**O que é:** SaaS de numerologia cabalística que analisa o nome de nascimento, detecta bloqueios energéticos e sugere variações do nome sem bloqueios, compatíveis com os números de Expressão e Destino do usuário.
**Stack:** Astro 5 SSR + React islands + Tailwind CSS + Supabase Cloud + Stripe
**Nota:** "Astro" é APENAS o framework técnico. Nunca aparece na interface, copy ou branding do produto.

---

## Design System ("The Celestial Alchemist")

### Cores & Estilo Visual (Rooted in DESIGN.md)
- **Base Layer (Void):** `#131313`. NUNCA usar pure whites para texto, use `#e5e2e1`.
- **Primary (Godly Gold):** `#f2ca50` e `#d4af37`.
- **Secondary (Earth):** `#76746a` (ações/dados secundários).
- **Tertiary (Mystical Purple):** `#d7c6ff` e `#bea5ff` (focus, espiritual).
- **"NO-LINE" Rule:** É ESTRITAMENTE PROIBIDO o uso de `border: 1px solid` para sectioning. Tudo é feito via stacking de fundo ou whitespace. O fallback acessibilidade é uma outline com 15% opacity.
- **Glassmorphism:** Apenas flutuantes. Opacity 60% e blur 20-40px deixando vazar cor de fundo.
- **Sombras:** Ambientais, estilo glow de escuridão: `0 20px 50px rgba(0,0,0,0.6)`. Nunca drop-shadows padrão.
- **Animações (Micro-animations):** Lentas (800ms) para emular um ritmo meditativo.
- **Radius:** `rounded-2xl` (cards) e `rounded-full` (botões/chips). NUNCA sharp corners.

### Fontes (Google Fonts)
- Headings/branding: **Cinzel** (serif), weights 400 e 700. Wide tracking.
- Body/UI: **Inter** (sans-serif), weights 300, 400, 500.
- Sub-headers: Inter `headline-sm` em ALL CAPS com `0.1em` tracking.

### Componentes base (src/frontend/components/ui/)
Sempre preferir estes antes de criar novos:
- `Card` — stacked deep sheets, sem dividers (usar whitespace 2rem vertical).
- `Button` — variants: primary (gold inner glow, container `primary-container`), secondary (ghost border, text primary).
- `Input` — lowest surface. Hover/Focus dispara ghost border `tertiary`.
- `Badge/Chip` — rounded-full. Seleção é sinalizada com gradient do roxo místico.
- `Modal` — floating sheet com glassmorphism (opacidade base) e deep shadow.
- `Toast` — notificações temporárias.

---

## Arquitetura

### Separação Backend / Frontend
```
src/backend/   → NUNCA importado por componentes React diretamente
               → Apenas chamado via pages/api/* (endpoints Astro)
               → Contém: IA, numerologia, Supabase server-side, PDF, emails

src/frontend/  → React components (islands) + hooks + supabase-browser
               → NUNCA importa de src/backend/
               → Comunicação com backend SOMENTE via fetch para /api/*
```

### Fluxo de dados
```
React Component → fetch /api/endpoint → Astro API route → backend/service → Supabase/IA
```

### Roteamento de Auth
- `/app/*` → requer session + subscription ativa (ou is_test válido, ou admin)
- `/admin/*` → **REDIRECIONA para `https://hq.studiomlk.com.br`** (painel admin removido do SaaS)
- `/api/admin/*` → ainda protegido por `role='admin'` (endpoints legados mantidos temporariamente)
- `/acesso` → público — landing page para links trial gerados pelo HQ
- `/acesso/resgatar` → requer session — efetiva o resgate do trial
- `/api/redeem-trial` → requer session — endpoint para resgatar código trial via POST
- `/api/teste-bloqueio` → público, rate limit por IP (3/hora)
- Todo o resto → público

---

## IA — Regras de Ouro

### Provedores
- **development** (APP_ENV=development): Groq por padrão (gratuito)
- **production** (APP_ENV=production): Claude por padrão
- Admin pode sobrescrever via `/admin/ia` (salvo em `nome_magnetico.ai_config`)

### Arquivos de configuração de IA (SEMPRE editar aqui)
```
src/backend/ai/config/providers.ts    → qual provedor usar
src/backend/ai/config/models.ts       → qual modelo por tarefa
src/backend/ai/config/temperatures.ts → temperatura e max_tokens por tarefa
src/backend/ai/prompts/               → system prompts e user prompts
```

### Loop Guard
- OBRIGATÓRIO em toda chamada à IA
- Máx 3 tentativas por análise
- Detecta respostas similares (threshold 0.85)
- Rate limit: 50k tokens por sessão de usuário

---

## Numerologia Cabalística — Referência

### Tabela de conversão letra → número
```
A I Q J Y = 1
B K R     = 2
C G L S   = 3
D M T X   = 4
E H N     = 5
U V W Ç   = 6
O Z       = 7
F P       = 8
```

### Tratamento de acentos
- Agudo (´): +2 ao valor base
- Til (~): +3 ao valor base
- Grave (`): ×3 do valor base

### Números preservados (masters)
- 11 e 22 NÃO são reduzidos (em contextos que usam masters)

### 5 números principais
1. **Expressão**: todas as letras do nome completo
2. **Destino**: soma dígitos da data de nascimento
3. **Motivação/Alma**: apenas vogais
4. **Missão/Impressão**: apenas consoantes
5. **Personalidade**: primeiro nome apenas

### Os 4 Triângulos Numerológicos
Cada análise calcula TODOS os 4 triângulos (não apenas o Triângulo da Vida):

| Triângulo | Modificador da linha base | Dimensão revelada |
|-----------|--------------------------|-------------------|
| **Vida** (básico) | valor da letra apenas | Aspectos gerais |
| **Pessoal** | letra + dia de nascimento (reduzido) | Vida íntima, reações internas |
| **Social** | letra + mês de nascimento (reduzido) | Influências externas, percepção do mundo |
| **Destino** | letra + (dia+mês reduzidos) | Resultados, missão, previsões |

Bloqueios são detectados em **todos os 4 triângulos** e consolidados. Cada bloqueio inclui `aspectoSaude`.

### Bloqueios (sequências repetidas ≥3 em qualquer triângulo)
111=Iniciação, 222=Associação, 333=Expressão, 444=Estruturação,
555=Liberdade, 666=Harmonia, 777=Conexão Espiritual,
888=Poder e Abundância, 999=Compaixão Universal

Cada bloqueio tem: `codigo`, `titulo`, `descricao`, `aspectoSaude`, `triangulos[]`

### Lições Kármics e Tendências Ocultas
- **Lições Kármics**: números 1–8 **ausentes** no nome → qualidades a desenvolver nesta encarnação
- **Tendências Ocultas**: número que aparece **≥4 vezes** no nome → excesso daquela qualidade
- Funções: `detectarLicoesCarmicas(nome)`, `detectarTendenciasOcultas(nome)`, `mapearFrequencias(nome)`
- Módulo: `src/backend/numerology/karmic.ts`

### Harmonização de Nomes — Score e Compatibilidade

O sistema usa **score 0–100** (calculado em `harmonization.ts`) e **4 tipos de compatibilidade** Expressão × Destino.
Esses critérios são compartilhados pelos 3 produtos: `nome_social`, `nome_bebe` e `nome_empresa`.

#### Faixas de Score
| Faixa | Tier | Cor UI |
|-------|------|--------|
| 90–100 | Excelente | `emerald-500` |
| 70–89 | Bom | `emerald-500` |
| 40–69 | Aceitável | `amber-500` |
| 20–39 | Não Recomendado | `red-400` |
| 0–19 | Crítico | `red-600` |

#### 4 Tipos de Compatibilidade
| Código | Label UI | Cor | Critério |
|--------|----------|-----|----------|
| `total` | ✦ Ressonância Total | `emerald-400` (verde) | Expressão reduzida = Destino — vibrações idênticas |
| `complementar` | ◈ Vibração Complementar | `sky-400` (azul) | Expressão + Destino = 9, 11 ou 22 (números de maestria) |
| `aceitavel` | ◎ Vibração Neutra | `amber-400` (âmbar) | Diferença de 1 unidade entre Expressão e Destino |
| `incompativel` | ⚠ Tensão Vibracional | `red-400` (vermelho) | Demais casos — frequências díspares |

- Componente UI: `CompatibilityBadge` em `src/frontend/components/app/CompatibilityBadge.tsx`
- Aceita prop `showTooltip` para exibir legenda completa inline (sem botão aninhado, CSS-only)
- **NUNCA** usar a palavra "incompatível" no copy voltado ao cliente — usar "Tensão Vibracional"
- Critérios da assinatura: legibilidade, inclinação levemente ascendente, sem traços cortantes, estética equilibrada
- **SEM radiestesia/pêndulo** — apenas critérios objetivos formais
- Módulo: `src/backend/numerology/harmonization.ts`

---

## Produtos

```typescript
type ProductType = 'nome_social' | 'nome_bebe' | 'nome_empresa'
```

### `nome_social` — Nome Social (produto principal)
- Analisa nome de nascimento + data de nascimento
- Calcula 5 números + 4 triângulos + bloqueios + lições kármics + tendências ocultas
- Sugere variações do nome sem bloqueios e compatíveis com Expressão × Destino
- Gera guia de implementação da nova assinatura
- Módulo: `src/backend/ai/brain.ts` (funções: `generateAnalysis`, `generateSuggestions`, `generateGuide`)

### `nome_bebe` — Nome para Bebê
- Input: sobrenome da família + data de nascimento do bebê + lista de nomes candidatos
- Para cada candidato: calcula 4 triângulos + detecta bloqueios + verifica compatibilidade Expressão × Destino do bebê + lições kármics
- Rankeia por score 0–100 e aponta o melhor nome
- Módulo: `src/backend/numerology/products/nome-bebe.ts`
- Prompt IA: `src/backend/ai/prompts/baby-prompt.ts`
- Brain: `generateBabyAnalysis(params, userId, analysisId)`

### `nome_empresa` — Nome Empresarial
- Input: nome do sócio principal + data de nascimento do sócio + data de fundação (opcional) + nomes candidatos
- Analisa compatibilidade com Destino do sócio E Destino da empresa (data de fundação)
- Penalidade extra por tendência oculta do 8 (excesso de materialismo)
- Módulo: `src/backend/numerology/products/nome-empresa.ts`
- Prompt IA: `src/backend/ai/prompts/company-prompt.ts`
- Brain: `generateCompanyAnalysis(params, userId, analysisId)`

### Modelo de negócio
Pagamento único por ciclo de 30 dias (não recorrente)

### Modelo de entrega — IMPORTANTE para copy e comunicação
- **NÃO existe "entrega"**: o produto é 100% self-service. O usuário paga, acessa o painel imediatamente e roda as análises por conta própria, na hora que quiser e quantas vezes quiser.
- **Acesso é imediato**: liberado automaticamente após confirmação do Stripe, sem etapa manual.
- **NÃO usar** nas landing pages, preços ou CTAs: "Entrega em 24h", "entregue em até X horas", "receba sua análise".
- **USAR**: "Acesso imediato", "Análise na hora", "Você mesmo faz sua análise", "self-service".
- **Suporte**: existe suporte geral por e-mail via sistema de tickets (`/suporte`), com SLA de resposta em até 24h úteis. Porém, a equipe **NÃO** faz revisão individual de análises nem oferece suporte específico por análise. No copy, usar "Suporte por e-mail" — nunca "Suporte por 30 dias sobre sua análise" ou "revisão da análise".

---

## Banco de Dados

- **Supabase Cloud:** projeto `nome_magnetico` (`bhxneaeuhybtucmbmpvg.supabase.co`)
- Schema: **`public`** (todas as tabelas estão no schema public)
- Auth: `auth.users` do Supabase (nativo)
- RLS ativo em todas as tabelas
- Admin: `profiles.role = 'admin'`

### Tabelas principais
- `profiles` — perfis (role, nome, email)
- `subscriptions` — acesso (stripe_session_id, asaas_payment_id, payment_provider, starts_at, ends_at, is_active computed); campo `metadata JSONB` para produtos específicos
- `analyses` — análises completas (status: pending/processing/complete/error); campos expandidos: `triangulo_vida`, `triangulo_pessoal`, `triangulo_social`, `triangulo_destino`, `licoes_carmicas`, `tendencias_ocultas`, `frequencias_numeros`, `nome_harmonizado`, `expressao_harmonizada`
- `magnetic_names` — nomes sugeridos com scores
- `baby_name_inputs` — dados específicos do produto nome_bebe (sobrenome_familia, data_nascimento_bebe, nomes_candidatos[])
- `company_name_inputs` — dados específicos do produto nome_empresa (nome_socio_principal, data_fundacao, nomes_candidatos[])
- `ai_config` — configuração de IA editável em runtime
- `ai_usage` — log de uso (loop guard)
- `support_tickets` + `support_messages` — suporte
- `faq_categories` + `faq_items` — FAQ editável
- `support_faq.support_faq_v` — view read-only da FAQ ativa para o bot Suporte (role `support_bot`). Sem embeddings. Sem senha na migration. Ver `docs/architecture/support-bot-faq-readonly.md`

### Migrations aplicadas
- `001_nome_magnetico.sql` — schema base completo (schema public no Supabase Cloud)
- `002_expand_analyses.sql` — expansão para 4 triângulos, lições kármics, tendências ocultas, produtos nome_bebe e nome_empresa
- `020_test_users.sql` — campos `is_test` + `test_ends_at` na tabela `profiles`, tabela `trial_redemptions` para rastreabilidade do HQ
- `024_payment_provider.sql` — colunas `payment_provider` (stripe/asaas) e `asaas_payment_id` na tabela `subscriptions`

---

## Integração HQ StudioMLK

O HQ (`hq.studiomlk.com.br`) gerencia centralmente usuários, trials e billing de todos os SaaS do estúdio.

### Painel Admin
- O painel `/admin/*` foi **removido** do Nome Magnético — tudo é gerenciado pelo HQ.
- Rotas `/admin/*` redirecionam automaticamente para `https://hq.studiomlk.com.br`.

### Usuários Teste (Trial)
Dois campos foram adicionados à tabela `profiles`:
- `is_test: boolean` — marcado como true quando o HQ cria um acesso trial
- `test_ends_at: timestamptz | null` — data de expiração (`null` = sem expiração)

Regra de acesso: se `is_test=true` E (`test_ends_at IS NULL` OU `test_ends_at > now()`), o usuário tem acesso completo sem subscription paga.

### Fluxo 1 — Usuário existente (via HQ)
HQ → Usuários → ícone Experimento → "Marcar como teste" → o HQ atualiza `is_test` diretamente no Supabase.

### Fluxo 2 — Novo usuário via link
Link gerado pelo HQ: `https://nomemagnetico.com.br/acesso?code=CODE&days=7&product=nome_social`
1. Usuário acessa o link → `/acesso.astro`
2. Se não logado: redireciona para cadastro/login com redirect para `/acesso/resgatar?code=...`
3. Após auth: `/acesso/resgatar.astro` aplica o trial e redireciona para `/app?trial=ativado`

### Checkout com cupom
O `CheckoutFlow.tsx` possui campo de código promocional opcional.
O endpoint `/api/create-checkout.ts` resolve o ID do promotion_code no Stripe antes de criar a sessão.
Admins e usuários teste recebem bypass total (assinatura criada diretamente no Supabase, sem Stripe).

### Trial Redemptions
Tabela `trial_redemptions` registra cada resgate com `user_id`, `trial_code`, `source` ('link' | 'manual').
Garante que um mesmo código não seja resgatado duas vezes pelo mesmo usuário.

### Plano de implementação do lado HQ
As mudanças necessárias no projeto `C:\Dev\hq-studiomlk-refine` estão documentadas em:
`C:\Dev\hq-studiomlk-refine\docs\agente-hq-test-users-sync.md`

Resumo do que o HQ ainda precisa fazer:
- `POST /access-codes/test-users` → também setar `profiles.is_test=true` no Supabase do SaaS
- `DELETE /access-codes/test-users/:userId` → também setar `profiles.is_test=false` no SaaS
- `POST /access-codes/:id/apply` → criar subscriptions com produtos válidos + setar `is_test`
- `GET /users` select → incluir `is_test, test_ends_at` para mostrar tag "TESTE" na lista
- `UserList.tsx` → toggle marcar/remover teste com feedback visual

---

## Emails

### Auth (Supabase + Amazon SES) — NÃO usar código para isso
- **Confirmação de cadastro** e **recuperação de senha** são gerenciadas 100% pelo Supabase Auth nativo
- Supabase está configurado com Amazon SES como provedor SMTP (sem Resend, sem n8n para auth)
- Templates HTML de confirmação e recuperação estão configurados diretamente no Supabase Dashboard
- `auth.signUp()` → dispara email de confirmação via SES automaticamente
- `auth.resetPasswordForEmail()` → dispara email de recuperação via SES automaticamente

### Emails transacionais (n8n) — pagamentos e suporte
NUNCA enviar emails de pagamento/suporte diretamente do código. Sempre usar:
```typescript
import { notify } from '@/backend/notifications/notify'
await notify('payment.confirmed', { email, firstName, accessUrl })
```

O n8n recebe o evento via webhook e processa o envio. Webhooks configurados:
- `N8N_WEBHOOK_TRANSACIONAL` — eventos de pagamento
- `N8N_WEBHOOK_SUPORTE` — tickets de suporte

---

## Comandos Disponíveis (Skills)

- `/criar-projeto` — ordem de criação dos arquivos do zero
- `/criar-pagina` — criar nova página seguindo design system
- `/criar-componente` — criar novo componente React seguindo padrões
- `/criar-api` — criar novo endpoint Astro API

---

## Componentes App Disponíveis (src/frontend/components/app/)

- `TriangleVisualization` — visualiza os 4 triângulos com abas e bloqueios expandíveis
- `KarmicLessons` — exibe lições kármics com cards expansíveis por número
- `HiddenTendencies` — exibe tendências ocultas + barra de frequências 1–8
- `SignatureEvaluation` — critérios objetivos da assinatura (sem radiestesia)
- `BabyNameForm` — formulário completo para produto nome_bebe
- `CompanyNameForm` — formulário completo para produto nome_empresa
- `CompatibilityBadge` — badge de compatibilidade Expressão × Destino com tooltip CSS; props: `compatibilidade`, `size`, `showTooltip`

---

## Pagamentos (Stripe & Asaas)

- O sistema suporta múltiplos provedores (`payment_provider` na tabela `subscriptions`).
- Webhook do Asaas em: `src/pages/api/asaas-webhook.ts`
- O MCP Stripe está configurado em `C:\Users\gmali\.claude\settings.local.json`
- **SEMPRE** usar a chave da conta **Nome Magnético** (não Sincro): `STRIPE_SECRET_KEY` do arquivo `.env` do projeto
- Chave test: `sk_test_51TDUrBL...` (conta `TDUrBL66SzSlet1`)
- Chave live: `sk_live_51TDUrBL...` (mesma conta, modo produção)
- Se o MCP Stripe mostrar produtos "Sincro Sinergia" ou "Sincro Desperta", a chave está errada — trocar pela do `.env`

---

## Regras Gerais para Agentes

1. **NUNCA** nomear arquivos ou variáveis com "astro" (é o framework, não o produto)
2. **SEMPRE** usar Tailwind CSS — sem CSS custom a não ser para glassmorphism
3. **SEMPRE** TypeScript — sem JS
4. **NUNCA** importar backend em componentes React
5. **SEMPRE** validar inputs com Zod nos endpoints API
6. **NUNCA** expor service key do Supabase no cliente
7. **SEMPRE** checar subscription ativa antes de processar análise
8. **NUNCA** chamar IA sem passar pelo LoopGuard
9. Ao criar página nova → consultar Paper MCP para layout antes de codar
10. Ao criar componente novo → verificar se existe em `src/frontend/components/ui/` ou `src/frontend/components/app/`
11. **NUNCA** mencionar radiestesia, pêndulo ou técnicas radiestésicas — o projeto usa APENAS critérios formais objetivos
12. Análise SEMPRE usa os 4 triângulos (não só o Triângulo da Vida) — importar `calcularTodosTriangulos` de `triangle.ts`
13. **DOCUMENTAÇÃO OBRIGATÓRIA**: Todo novo processo, componente reutilizável ou decisão de arquitetura deve ser documentada na pasta `docs/` seguindo a estrutura exata: `architecture/`, `sops/`, `snippets/` ou `devops/`. Nunca crie arquivos `.md` soltos na raiz do `docs/`.
14. **Bot Suporte = FAQ read-only.** A role `support_bot` só faz `SELECT` em `support_faq.support_faq_v`. Não dar acesso a clientes, pagamentos, leads, auth ou HQ. Não criar senha nem aplicar a migration em produção sem ok do Guilherme.
