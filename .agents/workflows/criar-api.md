# Redirecionamento

Consulte o arquivo `AGENTS.md` na raiz do projeto para regras globais e fluxo de trabalho.

# Skill: /criar-api

Crie um novo endpoint Astro API para o projeto Nome Magnético.

## Argumentos esperados
`/criar-api [rota] [metodos] [descricao]`

Exemplos:
- `/criar-api /api/analise-parcial GET,POST "Retorna análise parcial para o teste de bloqueio"`
- `/criar-api /api/admin/relatorios GET "Relatórios de receita para admin"`
- `/criar-api /api/nomes/favoritos GET,POST,DELETE "Gerenciar nomes favoritos"`

---

## PASSO 1 — Identificar nível de proteção

| Rota | Proteção |
|------|---------|
| `/api/teste-bloqueio` | Pública + rate limit por IP |
| `/api/create-checkout` | Pública |
| `/api/stripe-webhook` | Verificação de assinatura Stripe |
| `/api/[recurso]` | Session válida + subscription ativa |
| `/api/admin/[recurso]` | Session válida + role='admin' |

---

## PASSO 2 — Estrutura padrão do endpoint

```typescript
// src/pages/api/[recurso].ts
import type { APIRoute } from 'astro'
import { z } from 'zod'
import { createServerClient } from '@/backend/db/supabase'
import { getActiveSubscription } from '@/backend/db/subscriptions'

// Schema de validação (SEMPRE usar Zod)
const RequestSchema = z.object({
  campo: z.string().min(1),
  data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
})

export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Autenticação (se necessário)
  const supabase = createServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Verificar subscription (para rotas do app)
  const subscription = await getActiveSubscription(user.id)
  if (!subscription?.is_active) {
    return new Response(JSON.stringify({ error: 'Assinatura necessária' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 3. Validar body com Zod
  let body: z.infer<typeof RequestSchema>
  try {
    const raw = await request.json()
    body = RequestSchema.parse(raw)
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 4. Lógica de negócio
  try {
    const result = await processarAlguma(body)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[api/recurso] Erro:', error)
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Bloquear métodos não permitidos
export const GET: APIRoute = () => {
  return new Response('Method Not Allowed', { status: 405 })
}
```

---

## PASSO 3 — Endpoint público com rate limit

```typescript
// Para /api/teste-bloqueio (público)
import type { APIRoute } from 'astro'

// Rate limit simples em memória (produção: usar Redis ou Supabase)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit = 3, windowMs = 3600000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Muitas tentativas. Tente em 1 hora.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ... resto da lógica
}
```

---

## PASSO 4 — Endpoint admin

```typescript
// Para /api/admin/[recurso].ts
import { isAdmin } from '@/backend/db/users'

export const GET: APIRoute = async ({ cookies }) => {
  const supabase = createServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(user.id))) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ... lógica admin
}
```

---

## PASSO 5 — Endpoint de streaming (SSE para IA)

```typescript
// Para /api/analyze.ts (streaming da IA)
export const POST: APIRoute = async ({ request, cookies }) => {
  // ... auth + validation ...

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(
          `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        ))
      }

      try {
        send('status', { message: 'Calculando numerologia...' })
        const numerology = calcularTudo(body.birthName, body.birthDate)

        send('status', { message: 'Consultando IA...' })
        await brain.analyze(numerology, {
          onChunk: (text) => send('chunk', { text }),
          onComplete: (result) => send('complete', result),
        })
      } catch (error) {
        send('error', { message: 'Erro na análise' })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

---

## Checklist de qualidade

- [ ] Método HTTP correto para a operação (GET=ler, POST=criar, PATCH=atualizar, DELETE=remover)
- [ ] Autenticação verificada antes de qualquer lógica
- [ ] Inputs validados com Zod
- [ ] Erro 401 para não autenticado
- [ ] Erro 403 para sem permissão
- [ ] Erro 400 para dados inválidos
- [ ] Erro 500 com `console.error` mas sem expor stack trace
- [ ] Rate limit para endpoints públicos
- [ ] Content-Type: application/json em todas as respostas
- [ ] NUNCA expor service key do Supabase
- [ ] LoopGuard em toda chamada à IA
