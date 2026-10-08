# Cliente Supabase server-side — env em runtime

Última atualização: 2026-10-07 — DEV-122

O build de produção (GitHub Actions) **não** recebe `SUPABASE_SERVICE_ROLE_KEY`. A VPS injeta o `.env` só ao subir o processo (`start.mjs`). Se a chave for lida via `import.meta.env` (ou `process.env.NOME` estático), o Vite grava `undefined` no bundle e o endpoint responde 500 com `supabaseKey is required`.

## Regra

- Service role e demais segredos server-only: `readServerEnv('NOME')` em `src/backend/env/runtime.ts` (usa `process.env[name]`, sem bake).
- Cliente admin: `getSupabaseAdmin()` ou `supabase` de `src/backend/db/supabase.ts`.
- Client/browser: só `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` em `src/frontend/lib/supabase-browser.ts`.
- Componentes React **nunca** importam `src/backend/`.

## Errado

```ts
createClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.SUPABASE_SERVICE_KEY)
createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
```

`SUPABASE_SERVICE_KEY` não existe neste projeto. O nome correto é `SUPABASE_SERVICE_ROLE_KEY`.

## Certo (API / backend)

```ts
import { getSupabaseAdmin } from '@/backend/db/supabase'

export const GET: APIRoute = async () => {
  const supabase = getSupabaseAdmin()
  // ...
}
```

## Endpoints corrigidos no DEV-122

- `src/pages/api/blog/reactions.ts` — usava `import.meta.env.SUPABASE_SERVICE_KEY` (bug em produção).
- `src/pages/api/feedback.ts` — o mesmo padrão.
- `src/pages/api/cms/blog.ts`, `cms/blog/[slug].ts`, `cms/glossario.ts`, `cms/glossario/[slug].ts` — `createClient` no topo do módulo com service role.

Páginas públicas de blog/glossário e o sitemap usam a **anon** key (`PUBLIC_*`). Isso é intencional e pode permanecer em `import.meta.env`.
