import { supabase } from '../db/supabase';
import { marked } from 'marked';
import type { FaqItemProps } from '../../frontend/components/landing/FAQSection';

// Configura marked para FAQ (sem sanitização extra — conteúdo nosso)
marked.use({ gfm: true, breaks: false });

// Nome de Bebê e Nome Empresarial saíram da oferta. Itens de FAQ que ainda os citam ficam
// ocultos no site até o Marketing reescrever o texto no banco (a linha em faq_items não é alterada).
const RETIRED_PRODUCT_PATTERN =
  /beb[êe]|nome\s+empresarial|nomes?\s+(d[aoe]s?\s+)?(sua\s+|uma\s+|minha\s+)?empresas?|nome_empresa/i;

interface GetFaqsOptions {
  featuredOnly?: boolean;
}

export async function getSupabaseFaqs(opts: GetFaqsOptions = {}): Promise<FaqItemProps[]> {
  let query = supabase
    .from('faq_items')
    .select('id, question, answer_markdown, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (opts.featuredOnly) {
    query = query.eq('is_featured', true);
  }

  const { data, error } = await query;
  if (error || !data?.length) return [];

  return data
    .filter(item => !RETIRED_PRODUCT_PATTERN.test(`${item.question ?? ''} ${item.answer_markdown ?? ''}`))
    .map(item => ({
      id: item.id,
      question: item.question,
      answer: '',
      answer_html: marked.parse(item.answer_markdown ?? '') as string,
    }));
}
