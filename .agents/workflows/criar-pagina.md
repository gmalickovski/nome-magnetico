# Redirecionamento

Consulte o arquivo `AGENTS.md` na raiz do projeto para regras globais e fluxo de trabalho.

# Skill: /criar-pagina

Crie uma nova página no projeto Nome Magnético. Siga este protocolo completo.

## Argumentos esperados
`/criar-pagina [rota] [tipo] [descricao]`

Exemplos:
- `/criar-pagina /app/perfil app "Página de perfil do usuário"`
- `/criar-pagina /landing/parceiros landing "Página de parceiros e afiliados"`
- `/criar-pagina /admin/relatorios admin "Relatórios financeiros"`

---

## PASSO 1 — Identificar tipo e layout

| Tipo | Layout a usar |
|------|---------------|
| `landing` | `LandingLayout.astro` |
| `auth` | `AuthLayout.astro` |
| `app` | `AppLayout.astro` |
| `admin` | `AdminLayout.astro` |

---

## PASSO 2 — Design no Paper MCP (OBRIGATÓRIO antes de codar)

Usar o Paper MCP para:
1. Criar um frame na área de trabalho com o nome da página
2. Definir a estrutura visual: seções, cards, formulários, tabelas
3. Aplicar o design system: dark bg, gold accent, glassmorphism
4. Revisar com o usuário antes de implementar

Descrever para o Paper: "Página [nome] do Nome Magnético. Dark theme #1a1a1a, accent gold #D4AF37, fonte Cinzel para títulos e Inter para body. [Descrever componentes e layout da página]"

---

## PASSO 3 — Identificar componentes necessários

Verificar se os componentes já existem em:
- `src/frontend/components/ui/` → componentes base
- `src/frontend/components/[tipo]/` → componentes específicos do tipo

Se não existir → usar `/criar-componente` antes de continuar.

---

## PASSO 4 — Verificar proteção de rota

| Tipo | Middleware |
|------|-----------|
| `landing` | Público |
| `auth` | Público (redireciona se já logado) |
| `app` | Session + subscription ativa |
| `admin` | Session + role='admin' |

Confirmar que `src/middleware.ts` já cobre a rota ou adicionar cobertura.

---

## PASSO 5 — Criar o arquivo .astro

```astro
---
// src/pages/[rota].astro
import [Layout] from '@/layouts/[Layout].astro'
// Imports de componentes Astro (estáticos)
// Imports server-side: db queries, auth check

// Para páginas protegidas:
const session = await getSession(Astro.request)
if (!session) return Astro.redirect('/auth/login')

const subscription = await getActiveSubscription(session.user.id)
if (!subscription) return Astro.redirect('/sem-acesso')

// Buscar dados necessários para SSR
---

<[Layout] title="[Título da Página] — Nome Magnético">
  <!-- Conteúdo estático em Astro -->

  <!-- Islands React (interativos) com client:load ou client:visible -->
  <NomeDoComponente client:load prop={dadosSSR} />
</[Layout]>
```

---

## PASSO 6 — Criar componentes React (islands)

Para cada componente interativo da página:
- Usar `client:load` para componentes críticos (acima da dobra)
- Usar `client:visible` para componentes abaixo da dobra (melhor performance)
- NUNCA usar `client:only` a não ser que seja absolutamente necessário

---

## PASSO 7 — Criar endpoint API se necessário

Se a página precisa de dados dinâmicos via fetch:
- Criar em `src/pages/api/[recurso].ts`
- Usar `/criar-api` para seguir o protocolo correto

---

## PASSO 8 — Atualizar navegação

Verificar se a nova rota deve aparecer em:
- `AppLayout.astro` — sidebar de navegação do app
- `AdminLayout.astro` — menu do admin
- `LandingLayout.astro` — links do header/footer

---

## Checklist de qualidade

- [ ] Layout correto para o tipo de página
- [ ] Proteção de rota implementada
- [ ] Design system respeitado (dark, gold, Cinzel + Inter)
- [ ] TypeScript sem erros
- [ ] Sem imports de `src/backend/` em componentes React
- [ ] SEO: `<title>` e `<meta description>` preenchidos no Layout
- [ ] Responsivo: testado em mobile (375px) e desktop (1280px)
- [ ] Loading states nos componentes que fazem fetch
- [ ] Error states tratados
