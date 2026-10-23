> **Agentes:** leia primeiro [`AGENTS.md`](../../AGENTS.md) na raiz do repositório.


# Skill: /criar-projeto

Você é o arquiteto do projeto **Nome Magnético**. Siga esta ordem exata de criação. Marque cada etapa como concluída antes de avançar.

## FASE 1 — Fundação (sem esta fase nada funciona)

### 1.1 Inicializar projeto Astro
```bash
npm create astro@latest nome-magnetico-app -- --template minimal --typescript strict --no-git
cd nome-magnetico-app
npx astro add react tailwind node
```

### 1.2 Instalar dependências
```bash
npm install @supabase/supabase-js @anthropic-ai/sdk openai groq-sdk stripe zod
npm install @react-pdf/renderer
npm install -D @types/react @types/react-dom
```

### 1.3 Arquivos de configuração base
Criar nesta ordem:
1. `.env` (a partir de `.env.example`)
2. `astro.config.mjs` — output: 'server', adapter: node
3. `tsconfig.json` — path aliases: `@/` → `src/`
4. `tailwind.config.mjs` — custom colors (gold, dark), fontes Cinzel + Inter
5. `src/styles/global.css` — scrollbar, glassmorphism, animações

### 1.4 Fontes
Adicionar ao `<head>` do BaseLayout:
```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

---

## FASE 2 — Banco de Dados

### 2.1 Migration Supabase
Criar `supabase/migrations/001_nome_magnetico.sql` com o schema completo.
Ver schema em CLAUDE.md.

### 2.2 Cliente Supabase
1. `src/backend/db/supabase.ts` — cliente server-side (service key)
2. `src/frontend/lib/supabase-browser.ts` — cliente client-side (anon key)

---

## FASE 3 — Backend Core (sem IA)

Criar nesta ordem:

### 3.1 Numerologia (portar do index.html existente)
1. `src/backend/numerology/core.ts` — calcularValor, reduzirNumero
2. `src/backend/numerology/triangle.ts` — calcularTrianguloDaVida, detectarBloqueios
3. `src/backend/numerology/numbers.ts` — 5 números principais
4. `src/backend/numerology/suggestions.ts` — gerarVariacoes, scoreVariacao

### 3.2 Notificações
`src/backend/notifications/notify.ts` — webhook n8n

### 3.3 Pagamentos
`src/backend/payments/stripe.ts` — cliente e helpers

### 3.4 Queries DB
1. `src/backend/db/users.ts`
2. `src/backend/db/subscriptions.ts`
3. `src/backend/db/analyses.ts`

---

## FASE 4 — Camada de IA

Criar nesta ordem (CRÍTICO — respeitar a hierarquia):

1. `src/backend/ai/config/providers.ts`
2. `src/backend/ai/config/models.ts`
3. `src/backend/ai/config/temperatures.ts`
4. `src/backend/ai/config/products.ts`
5. `src/backend/ai/loop-guard.ts`
6. `src/backend/ai/prompts/system-kabbalistic.ts`
7. `src/backend/ai/prompts/analysis-prompt.ts`
8. `src/backend/ai/prompts/suggestions-prompt.ts`
9. `src/backend/ai/prompts/guide-prompt.ts`
10. `src/backend/ai/providers/groq.ts`
11. `src/backend/ai/providers/claude.ts`
12. `src/backend/ai/providers/openai.ts`
13. `src/backend/ai/router.ts`
14. `src/backend/ai/brain.ts`

---

## FASE 5 — Frontend Base

### 5.1 Layouts Astro
1. `src/layouts/BaseLayout.astro`
2. `src/layouts/LandingLayout.astro`
3. `src/layouts/AuthLayout.astro`
4. `src/layouts/AppLayout.astro`
5. `src/layouts/AdminLayout.astro`

### 5.2 Componentes UI base (src/frontend/components/ui/)
1. `Button.tsx`
2. `Input.tsx`
3. `GlassCard.tsx`
4. `Card.tsx`
5. `Badge.tsx`
6. `Modal.tsx`
7. `Accordion.tsx`
8. `Tabs.tsx`
9. `Toast.tsx`

**IMPORTANTE:** Antes de criar cada componente UI, usar o Paper MCP para definir o design visual.

---

## FASE 6 — Middleware e API Pública

1. `src/middleware.ts` — auth guard
2. `src/pages/api/teste-bloqueio.ts` — endpoint público do chamariz
3. `src/pages/api/create-checkout.ts` — Stripe checkout
4. `src/pages/api/stripe-webhook.ts` — webhook Stripe

---

## FASE 7 — Landing Page

### 7.1 Componentes landing (src/frontend/components/landing/)
Criar um por um, consultando Paper MCP para cada seção:
1. `LandingHeader.tsx`
2. `HeroSection.tsx`
3. `ProblemSection.tsx`
4. `HowItWorksSection.tsx`
5. `TesteDeBlockio.tsx` ← chamariz com formulário + resultado parcial
6. `BenefitsSection.tsx`
7. `TestimonialsSection.tsx`
8. `ProductsSection.tsx`
9. `PricingSection.tsx`
10. `FAQSection.tsx`
11. `GuaranteeSection.tsx`
12. `LandingFooter.tsx`

### 7.2 Páginas
1. `src/pages/index.astro`
2. `src/pages/comprar.astro`

---

## FASE 8 — Auth

### 8.1 Componentes auth
1. `LoginForm.tsx`
2. `SignupForm.tsx`
3. `ForgotPasswordForm.tsx`
4. `ResetPasswordForm.tsx`

### 8.2 Páginas auth
1. `src/pages/auth/login.astro`
2. `src/pages/auth/cadastro.astro`
3. `src/pages/auth/esqueci-senha.astro`
4. `src/pages/auth/nova-senha.astro`

---

## FASE 9 — App (área autenticada)

### 9.1 Componentes app
1. `Questionnaire.tsx`
2. `AnalysisForm.tsx`
3. `AnalysisStream.tsx`
4. `TriangleVisualization.tsx`
5. `NumberProfile.tsx`
6. `BlockageCard.tsx`
7. `MagneticNameCard.tsx`
8. `ImplementationGuide.tsx`
9. `PDFDownloadButton.tsx`
10. `AnalysisHistory.tsx`

### 9.2 Endpoints da análise
1. `src/pages/api/analyze.ts`
2. `src/pages/api/generate-pdf.ts`

### 9.3 Páginas app
1. `src/pages/app/index.astro`
2. `src/pages/app/questionario.astro`
3. `src/pages/app/analise/nome-magnetico.astro`
4. `src/pages/app/resultado/[id].astro`

---

## FASE 10 — PDF

1. `src/backend/pdf/styles.ts`
2. `src/backend/pdf/pages/cover.tsx`
3. `src/backend/pdf/pages/profile.tsx`
4. `src/backend/pdf/pages/analysis.tsx`
5. `src/backend/pdf/pages/magnetic-name.tsx`
6. `src/backend/pdf/pages/guide.tsx`
7. `src/backend/pdf/pages/practice.tsx`
8. `src/backend/pdf/template.tsx`

---

## FASE 11 — Admin

1. `MetricsDashboard.tsx`
2. `UsersTable.tsx`
3. `AIModelConfig.tsx`
4. `SubscriptionManager.tsx`
5. `TicketsAdmin.tsx`
6. Endpoints: `src/pages/api/admin/`
7. Páginas: `src/pages/admin/`

---

## FASE 12 — Suporte

1. `FAQPage.tsx`, `SupportTicketForm.tsx`, `TicketList.tsx`, `TicketDetail.tsx`
2. Endpoints: `src/pages/api/support/`
3. Páginas: `src/pages/suporte/`

---

## Checklist final antes de produção
- [ ] `.env` preenchido com credenciais reais
- [ ] Migration SQL executada no Supabase
- [ ] Stripe webhook configurado no painel
- [ ] N8n workflow criado e testado
- [ ] APP_ENV=production no servidor
- [ ] Rate limit do `teste-bloqueio` testado
- [ ] PDF (dark + light) gerado e validado
- [ ] Primeiro admin promovido manualmente no Supabase
