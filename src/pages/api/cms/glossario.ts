import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/backend/db/supabase';
import { readServerEnv } from '@/backend/env/runtime';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function checkAuth(request: Request): boolean {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  return token === (readServerEnv('INTERNAL_API_SECRET') ?? '');


const createSchema = z.object({
  slug: z.string().optional(),
  term: z.string().min(2).max(100),
  definition_markdown: z.string().default(''),
  related_number: z.number().int().min(1).max(22).optional(),
  tags: z.array(z.string()).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  is_published: z.boolean().default(false),
});

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const url = new URL(request.url);
  const includeUnpublished = url.searchParams.get('all') === 'true';

  let query = supabase
    .from('glossary_terms')
    .select('id, slug, term, related_number, tags, is_published, created_at')
    .order('term', { ascending: true });

  if (!includeUnpublished) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ terms: data, total: data?.length ?? 0 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message }), { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug || slugify(data.term);

  const { data: term, error } = await supabase
    .from('glossary_terms')
    .insert({ ...data, slug })
    .select('id, slug, term, is_published, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return new Response(JSON.stringify({ error: `Slug "${slug}" já existe` }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(term), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
