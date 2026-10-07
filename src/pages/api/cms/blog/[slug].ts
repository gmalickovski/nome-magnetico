import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/backend/db/supabase';
import { readServerEnv } from '@/backend/env/runtime';

function checkAuth(request: Request): boolean {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  return token === (readServerEnv('INTERNAL_API_SECRET') ?? '');
}

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  content_markdown: z.string().optional(),
  produto_relacionado: z.enum(['nome_social', 'nome_bebe', 'nome_empresa']).nullable().optional(),
  author: z.string().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  meta_tags: z.array(z.string()).nullable().optional(),
  is_published: z.boolean().optional(),
});

export const GET: APIRoute = async ({ request, params }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug!)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Post não encontrado' }), { status: 404 });
  }

  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ request, params }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message }), { status: 400 });
  }

  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };

  if (parsed.data.is_published === true) {
    const { data: existing } = await supabase
      .from('blog_posts').select('published_at').eq('slug', params.slug!).single();
    if (!existing?.published_at) {
      updates.published_at = new Date().toISOString();
    }
  } else if (parsed.data.is_published === false) {
    updates.published_at = null;
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('slug', params.slug!)
    .select('id, slug, title, is_published, updated_at')
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message ?? 'Post não encontrado' }), { status: error ? 500 : 404 });
  }

  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('slug', params.slug!);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(null, { status: 204 });
};
