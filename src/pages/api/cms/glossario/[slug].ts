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
  term: z.string().min(2).max(100).optional(),
  definition_markdown: z.string().optional(),
  related_number: z.number().int().min(1).max(22).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
});

export const GET: APIRoute = async ({ request, params }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('glossary_terms')
    .select('*')
    .eq('slug', params.slug!)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Termo não encontrado' }), { status: 404 });
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

  const { data, error } = await supabase
    .from('glossary_terms')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('slug', params.slug!)
    .select('id, slug, term, is_published, updated_at')
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message ?? 'Termo não encontrado' }), { status: error ? 500 : 404 });
  }

  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('glossary_terms')
    .delete()
    .eq('slug', params.slug!);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(null, { status: 204 });
};
