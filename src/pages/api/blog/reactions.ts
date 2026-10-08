import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/backend/db/supabase';

const VALID_REACTIONS = ['heart', 'fire', 'think', 'star'] as const;

// ── GET /api/blog/reactions?slug=meu-artigo ──────────────────────────────────
export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ error: 'slug obrigatório' }), { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('blog_reactions')
    .select('reaction')
    .eq('post_slug', slug);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Conta por tipo
  const counts: Record<string, number> = { heart: 0, fire: 0, think: 0, star: 0 };
  for (const row of data ?? []) {
    if (row.reaction in counts) counts[row.reaction]++;
  }

  return new Response(JSON.stringify(counts), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// ── POST /api/blog/reactions ─────────────────────────────────────────────────
// Body: { slug: string, reaction: 'heart'|'fire'|'think'|'star', session_id: string }
// Comportamento: toggle (insere se não existir, deleta se já existir)
const bodySchema = z.object({
  slug:       z.string().min(1).max(200),
  reaction:   z.enum(VALID_REACTIONS),
  session_id: z.string().uuid(),
});

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Dados inválidos', details: parsed.error.flatten() }), { status: 422 });
  }

  const { slug, reaction, session_id } = parsed.data;
  const supabase = getSupabaseAdmin();

  // Verifica se já existe essa reação desta sessão neste artigo
  const { data: existing } = await supabase
    .from('blog_reactions')
    .select('id')
    .eq('post_slug', slug)
    .eq('reaction', reaction)
    .eq('session_id', session_id)
    .maybeSingle();

  if (existing) {
    // Toggle off — remove a reaction
    await supabase.from('blog_reactions').delete().eq('id', existing.id);
  } else {
    // Toggle on — adiciona a reaction
    await supabase.from('blog_reactions').insert({ post_slug: slug, reaction, session_id });
  }

  // Retorna contagens atualizadas
  const { data: allReactions } = await supabase
    .from('blog_reactions')
    .select('reaction')
    .eq('post_slug', slug);

  const counts: Record<string, number> = { heart: 0, fire: 0, think: 0, star: 0 };
  for (const row of allReactions ?? []) {
    if (row.reaction in counts) counts[row.reaction]++;
  }

  return new Response(JSON.stringify({ counts, toggled: existing ? 'removed' : 'added' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
