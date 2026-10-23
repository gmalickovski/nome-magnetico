import type { APIRoute } from 'astro';
import { supabase } from '../../backend/db/supabase';
import { memoize } from '../../backend/cache/memo';

const FAQ_API_TTL_MS = 10 * 60 * 1000; // 10 minutos em memória (DEV-212)

export const GET: APIRoute = async ({ url }) => {
  const categorySlug = url.searchParams.get('category') ?? null;
  const featuredOnly = url.searchParams.get('featured') === 'true';
  const cacheKey = `faq:api:${categorySlug ?? 'all'}:${featuredOnly ? 'featured' : 'all'}`;

  try {
    const payload = await memoize(cacheKey, FAQ_API_TTL_MS, async () => {
      const { data: categories, error: catErr } = await supabase
        .from('faq_categories')
        .select('id, title, slug, order_index')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (catErr) {
        throw new Error('Erro ao buscar categorias.');
      }

      let query = supabase
        .from('faq_items')
        .select('id, category_id, question, answer_markdown, slug, order_index, is_featured')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (featuredOnly) {
        query = query.eq('is_featured', true);
      }

      if (categorySlug) {
        const cat = categories?.find((c) => c.slug === categorySlug);
        if (cat) query = query.eq('category_id', cat.id);
      }

      const { data: items, error: itemsErr } = await query;
      if (itemsErr) {
        throw new Error('Erro ao buscar FAQs.');
      }

      return { categories: categories ?? [], items: items ?? [] };
    });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Erro ao buscar FAQs.' }), { status: 500 });
  }
};
