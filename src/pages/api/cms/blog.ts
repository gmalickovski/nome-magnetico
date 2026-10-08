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
}

const createSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  content_markdown: z.string().default(''),
  produto_relacionado: z.enum(['nome_social', 'nome_bebe', 'nome_empresa']).optional(),
  author: z.string().default('Nome Magnético'),
  cover_image_url: z.string().url().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_tags: z.array(z.string()).optional(),
  is_published: z.boolean().default(false),
  published_at: z.string().optional(),
});

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const url = new URL(request.url);
  const includeUnpublished = url.searchParams.get('all') === 'true';

  let query = supabase
    .from('blog_posts')
    .select('id, slug, title, description, produto_relacionado, author, is_published, published_at, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (!includeUnpublished) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ posts: data, total: data?.length ?? 0 }), {
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
  const slug = data.slug || slugify(data.title);

  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      ...data,
      slug,
      published_at: data.is_published ? (data.published_at ?? new Date().toISOString()) : null,
    })
    .select('id, slug, title, is_published, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return new Response(JSON.stringify({ error: `Slug "${slug}" já existe` }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(post), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
