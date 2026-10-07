import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/backend/db/supabase';

const schema = z.object({
  analysis_id:  z.string().uuid().optional(),
  product_type: z.string().min(1).max(50),
  is_free:      z.boolean(),
  rating:       z.number().int().min(1).max(5).optional(),
  comment:      z.string().max(1000).optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'validation', details: parsed.error.flatten() }), { status: 422 });
  }

  const { analysis_id, product_type, is_free, rating, comment } = parsed.data;
  const user_id = locals.user?.id ?? null;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('analysis_feedback').insert({
    user_id,
    analysis_id: analysis_id ?? null,
    product_type,
    is_free,
    rating:  rating  ?? null,
    comment: comment ?? null,
  });

  if (error) {
    console.error('[feedback] insert error:', error);
    return new Response(JSON.stringify({ error: 'db_error' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
