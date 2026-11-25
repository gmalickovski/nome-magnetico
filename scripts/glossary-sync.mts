/**
 * DEV-307 · Carga do glossário no banco (public.glossary_terms).
 *
 * Uso (sempre conferir antes com --dry-run):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/glossary-sync.mts --dry-run
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/glossary-sync.mts
 *
 * Regras (idempotente):
 * - Verbete do catálogo que não existe no banco → inserido e publicado.
 * - Verbete que já existe → o texto do banco é mantido; só preenche campos vazios
 *   (categoria, resumo, sinônimos, relacionados, ordem).
 * - Slugs em GLOSSARY_SLUG_REDIRECTS → despublicados (duplicatas).
 * - Slugs em FORCAR_TEXTO → recebem o texto do catálogo e são publicados.
 * - Linhas sem categoria → categoria inferida.
 * Nunca apaga linhas. Nunca imprime chaves.
 */
import { createClient } from '@supabase/supabase-js';
import {
  CANONICAL_GLOSSARY_TERMS,
  GLOSSARY_SLUG_REDIRECTS,
  inferGlossaryCategory,
} from '../src/shared/glossary/canonical-terms.ts';

// DEV-312: verbetes cujo texto no banco precisa ser substituído pelo do catálogo (sem saúde, sem travessão).
const FORCAR_TEXTO = new Set([
  'nome-de-ouro',
  'bloqueios-energeticos',
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `bloqueio-${n}${n}${n}`),
  'triangulo-da-vida',
  'tensao-vibracional',
  'numero-de-expressao',
  'estrela-cabalistica',
]);
const dryRun = process.argv.includes('--dry-run');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const host = new URL(url).host.split('.')[0];
console.log(`Projeto: ${host}${dryRun ? ' (dry-run)' : ''}`);

const db = createClient(url, key, { auth: { persistSession: false } });

type Row = {
  slug: string;
  term: string;
  summary: string | null;
  synonyms: string[] | null;
  exact_case_aliases: string[] | null;
  category: string | null;
  related_slugs: string[] | null;
  sort_order: number | null;
  tags: string[] | null;
  is_published: boolean;
};

const { data: atuais, error } = await db
  .from('glossary_terms')
  .select('slug, term, summary, synonyms, exact_case_aliases, category, related_slugs, sort_order, tags, is_published');
if (error) throw new Error(`Leitura falhou: ${error.message}`);
const porSlug = new Map((atuais as Row[]).map((r) => [r.slug, r]));
const vazio = (a: unknown[] | null | undefined) => !a || a.length === 0;

const inserir: Record<string, unknown>[] = [];
const atualizar: Array<{ slug: string; patch: Record<string, unknown> }> = [];

CANONICAL_GLOSSARY_TERMS.forEach((t, i) => {
  const ordem = (i + 1) * 10;
  const atual = porSlug.get(t.slug);
  if (!atual) {
    inserir.push({
      slug: t.slug,
      term: t.term,
      definition_markdown: t.definitionMarkdown,
      summary: t.shortSummary,
      synonyms: t.aliases,
      exact_case_aliases: t.exactCaseAliases ?? [],
      category: t.category,
      related_slugs: t.relatedSlugs ?? [],
      related_number: t.relatedNumber,
      tags: t.tags,
      meta_title: t.metaTitle ?? null,
      meta_description: t.metaDescription ?? null,
      sort_order: ordem,
      is_published: true,
    });
    return;
  }
  const patch: Record<string, unknown> = {};
  if (!atual.category) patch.category = t.category;
  if (!atual.summary?.trim()) patch.summary = t.shortSummary;
  if (vazio(atual.synonyms)) patch.synonyms = t.aliases;
  if (vazio(atual.exact_case_aliases) && t.exactCaseAliases?.length) patch.exact_case_aliases = t.exactCaseAliases;
  if (vazio(atual.related_slugs) && t.relatedSlugs?.length) patch.related_slugs = t.relatedSlugs;
  if (atual.sort_order == null) patch.sort_order = ordem;
  if (FORCAR_TEXTO.has(t.slug)) {
    Object.assign(patch, {
      term: t.term,
      definition_markdown: t.definitionMarkdown,
      summary: t.shortSummary,
      is_published: true,
    });
  }
  if (Object.keys(patch).length > 0) atualizar.push({ slug: t.slug, patch });
});

const canonicos = new Set(CANONICAL_GLOSSARY_TERMS.map((t) => t.slug));
for (const r of atuais as Row[]) {
  if (canonicos.has(r.slug)) continue;
  const patch: Record<string, unknown> = {};
  if (GLOSSARY_SLUG_REDIRECTS[r.slug] && r.is_published) patch.is_published = false;
  if (!r.category) patch.category = inferGlossaryCategory(r.slug, r.term, r.tags);
  if (Object.keys(patch).length > 0) atualizar.push({ slug: r.slug, patch });
}

console.log(`Inserir: ${inserir.length} → ${inserir.map((r) => r.slug).join(', ') || '-'}`);
console.log(`Atualizar: ${atualizar.length}`);
for (const u of atualizar) console.log(`  ${u.slug}: ${Object.keys(u.patch).join(', ')}`);

if (dryRun) process.exit(0);

if (inserir.length > 0) {
  const { error: e } = await db.from('glossary_terms').insert(inserir);
  if (e) throw new Error(`Inserção falhou: ${e.message}`);
}
for (const u of atualizar) {
  const { error: e } = await db
    .from('glossary_terms')
    .update({ ...u.patch, updated_at: new Date().toISOString() })
    .eq('slug', u.slug);
  if (e) throw new Error(`Atualização de ${u.slug} falhou: ${e.message}`);
}
console.log('Concluído.');
