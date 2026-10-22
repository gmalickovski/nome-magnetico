# Redirecionamento

Consulte o arquivo `AGENTS.md` na raiz do projeto para regras globais e fluxo de trabalho.

# Skill: /criar-componente

Crie um novo componente React para o projeto Nome Magnético.

## Argumentos esperados
`/criar-componente [nome] [categoria] [descricao]`

Exemplos:
- `/criar-componente NumberBadge ui "Badge que exibe um número numerológico com cor e rótulo"`
- `/criar-componente AnalysisCard app "Card que exibe resumo de uma análise salva"`
- `/criar-componente RevenueChart admin "Gráfico de receita mensal para o dashboard admin"`

---

## PASSO 1 — Verificar se já existe

Antes de criar, buscar em:
```
src/frontend/components/ui/
src/frontend/components/landing/
src/frontend/components/auth/
src/frontend/components/app/
src/frontend/components/admin/
src/frontend/components/support/
```

Se já existir um componente similar → **estender ou compor** em vez de criar novo.

---

## PASSO 2 — Categorizar o componente

| Categoria | Pasta | Uso |
|-----------|-------|-----|
| `ui` | `components/ui/` | Base reutilizável em qualquer contexto |
| `landing` | `components/landing/` | Exclusivo da landing page |
| `auth` | `components/auth/` | Formulários de autenticação |
| `app` | `components/app/` | Área autenticada do usuário |
| `admin` | `components/admin/` | Painel administrativo |
| `support` | `components/support/` | Central de suporte |

---

## PASSO 3 — Design no Paper MCP (para componentes visuais)

Se o componente tem interface visual relevante:
1. Criar frame no Paper com o nome do componente
2. Definir estados: default, hover, loading, error, empty
3. Aplicar design system (dark, gold, glassmorphism)
4. Validar com o usuário antes de codar

---

## PASSO 4 — Estrutura do componente

### Componente simples (presentational)
```tsx
// src/frontend/components/[categoria]/NomeDoComponente.tsx

interface NomeDoComponenteProps {
  // Props tipadas com TypeScript
  title: string
  value: number
  variant?: 'default' | 'gold' | 'danger'
}

export function NomeDoComponente({ title, value, variant = 'default' }: NomeDoComponenteProps) {
  return (
    <div className="...tailwind classes...">
      {/* Conteúdo */}
    </div>
  )
}
```

### Componente com estado (island)
```tsx
// src/frontend/components/[categoria]/NomeDoComponente.tsx
'use client' // NÃO NECESSÁRIO em Astro — remover

import { useState, useEffect } from 'react'

interface Props {
  initialData?: DataType
  onComplete?: (result: ResultType) => void
}

export function NomeDoComponente({ initialData, onComplete }: Props) {
  const [state, setState] = useState<DataType | null>(initialData ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Comunicação com backend APENAS via fetch para /api/*
  const handleAction = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ... }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setState(data)
      onComplete?.(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  return (
    <div>
      {/* Conteúdo */}
    </div>
  )
}

// Sub-componentes de estado (dentro do mesmo arquivo se pequenos)
function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
      {message}
    </div>
  )
}
```

---

## PASSO 5 — Classes Tailwind padrão do design system

```tsx
// GlassCard base
"bg-white/5 backdrop-blur-md border border-yellow-500/20 rounded-2xl p-6"

// Título principal (Cinzel)
"font-cinzel text-2xl font-bold text-yellow-400"

// Subtítulo (Inter)
"font-inter text-gray-400 text-sm"

// Botão primário (gold)
"bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"

// Botão secundário (outline gold)
"border border-yellow-500/50 hover:border-yellow-400 text-yellow-400 px-6 py-3 rounded-xl transition-all duration-300"

// Input dark
"bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-all duration-300"

// Badge gold
"bg-yellow-500/20 text-yellow-400 text-xs font-medium px-3 py-1 rounded-full border border-yellow-500/30"

// Separador
"border-t border-white/5"
```

---

## PASSO 6 — Configurar Tailwind para fontes personalizadas

Verificar se `tailwind.config.mjs` tem:
```js
fontFamily: {
  'cinzel': ['Cinzel', 'serif'],
  'inter': ['Inter', 'sans-serif'],
}
```

---

## PASSO 7 — Exportar

Verificar se o componente deve ser exportado via barrel file:
```typescript
// src/frontend/components/ui/index.ts
export { Button } from './Button'
export { GlassCard } from './GlassCard'
// ... adicionar novo componente aqui
```

---

## Checklist de qualidade

- [ ] TypeScript correto — sem `any`
- [ ] Props tipadas com interface
- [ ] Loading state implementado
- [ ] Error state implementado
- [ ] Empty state implementado (se aplicável)
- [ ] Responsivo: funciona em mobile
- [ ] Design system respeitado
- [ ] NUNCA importa de `src/backend/`
- [ ] Comunicação com API apenas via `fetch('/api/...')`
- [ ] Acessibilidade: `aria-label` em botões icone, `role` adequado
