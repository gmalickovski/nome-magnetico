/**
 * DEV-307 · Edição do glossário pelo painel admin (service_role só no servidor).
 * A tabela `public.glossary_terms` é a fonte única dos textos do glossário.
 */
import { z } from 'zod';
import { supabase } from '../db/supabase';
import { invalidateGlossaryCache } from '../glossary/glossary-service';

export class GlossaryOpsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GlossaryOpsError';
  }
}

export const GLOSSARY_CATEGORIES = [
  'numeros',
  'calculo',
  'triangulos',
  'bloqueios',
  'karma',
  'assinatura',
  'arcanos',
] as const;

const COLUMNS =
  'id, slug, term, summary, definition_markdown, category, synonyms, exact_case_aliases, related_slugs, related_number, tags, meta_title, meta_description, sort_order, is_published, updated_at';

/** Vocabulário que nunca pode ir para o cliente (CLAUDE.md). */
const COPY_PROIBIDA = /radiest|p[êe]ndulo|\bincompat[íi]vel\b|entrega em \d|receba sua an[áa]lise/i;

const lista = z
  .array(z.string().trim().min(1).max(80))
  .max(30)
  .transform((a) => Array.from(new Set(a)));

export const glossaryFieldsSchema = z
  .object({
    term: z.string().trim().min(2).max(120),
    summary: z.string().trim().min(10).max(320),
    definition_markdown: z.string().trim().min(20).max(20000),
    category: z.enum(GLOSSARY_CATEGORIES),
    synonyms: lista.default([]),
    exact_case_aliases: lista.default([]),
    related_slugs: lista.default([]),
    related_number: z.number().int().min(1).max(22).nullable().default(null),
    tags: lista.default([]),
    meta_title: z.string().trim().max(120).nullable().optional().transform((v) => v || null),
    meta_description: z.string().trim().max(320).nullable().optional().transform((v) => v || null),
    sort_order: z.number().int().min(0).max(100000).nullable().optional(),
    is_published: z.boolean().default(true),
  })
  .superRefine((body, ctx) => {
    const texto = `${body.term} ${body.summary} ${body.definition_markdown}`;
    if (COPY_PROIBIDA.test(texto)) {
      ctx.addIssue({ code: 'custom', path: ['definition_markdown'], message: 'Texto com vocabulário proibido' });
    }
  });

export const glossarySlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífen');

export const glossaryCreateSchema = glossaryFieldsSchema.and(z.object({ slug: glossarySlugSchema }));

export const glossaryPatchSchema = z
  .object({
    term: z.string().trim().min(2).max(120),
    summary: z.string().trim().min(10).max(320),
    definition_markdown: z.string().trim().min(20).max(20000),
    category: z.enum(GLOSSARY_CATEGORIES),
    synonyms: lista,
    exact_case_aliases: lista,
    related_slugs: lista,
    related_number: z.number().int().min(1).max(22).nullable(),
    tags: lista,
    meta_title: z.string().trim().max(120).nullable(),
    meta_description: z.string().trim().max(320).nullable(),
    sort_order: z.number().int().min(0).max(100000).nullable(),
    is_published: z.boolean(),
  })
  .partial()
  .strict()
  .refine((b) => Object.keys(b).length > 0, 'Nada para atualizar')
  .superRefine((body, ctx) => {
    const texto = `${body.term ?? ''} ${body.summary ?? ''} ${body.definition_markdown ?? ''}`;
    if (COPY_PROIBIDA.test(texto)) {
      ctx.addIssue({ code: 'custom', path: ['definition_markdown'], message: 'Texto com vocabulário proibido' });
    }
  });

export type GlossaryOpsRow = {
  id: string;
  slug: string;
  term: string;
  summary: string | null;
  definition_markdown: string;
  category: string | null;
  synonyms: string[] | null;
  exact_case_aliases: string[] | null;
  related_slugs: string[] | null;
  related_number: number | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number | null;
  is_published: boolean;
  updated_at: string;
};

export async function listGlossaryOps(params: { q?: string; published?: boolean }): Promise<GlossaryOpsRow[]> {
  let query = supabase
    .from('glossary_terms')
    .select(COLUMNS)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('term', { ascending: true })
    .limit(500);
  if (params.published !== undefined) query = query.eq('is_published', params.published);
  const q = params.q?.trim().replace(/[%,()]/g, ' ');
  if (q) query = query.or(`term.ilike.%${q}%,slug.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw new GlossaryOpsError('Não foi possível ler o glossário', 503);
  return (data ?? []) as GlossaryOpsRow[];
}

export async function createGlossaryTerm(
  input: z.infer<typeof glossaryCreateSchema>,
  staffId: string,
): Promise<GlossaryOpsRow> {
  const { data, error } = await supabase.from('glossary_terms').insert(input).select(COLUMNS).single();
  if (error) {
    if (error.code === '23505') throw new GlossaryOpsError('Já existe um termo com esse slug', 409);
    throw new GlossaryOpsError('Não foi possível criar o termo', 500);
  }
  invalidateGlossaryCache();
  console.info('[ops/glossary] criado', { staff: staffId, slug: input.slug });
  return data as GlossaryOpsRow;
}

export async function updateGlossaryTerm(
  slug: string,
  patch: z.infer<typeof glossaryPatchSchema>,
  staffId: string,
): Promise<GlossaryOpsRow> {
  const { data, error } = await supabase
    .from('glossary_terms')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw new GlossaryOpsError('Não foi possível salvar o termo', 500);
  if (!data) throw new GlossaryOpsError('Termo não encontrado', 404);
  invalidateGlossaryCache();
  console.info('[ops/glossary] atualizado', { staff: staffId, slug, campos: Object.keys(patch) });
  return data as GlossaryOpsRow;
}
