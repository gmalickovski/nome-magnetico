import { supabase } from '../db/supabase';
import { memoize } from '../cache/memo';
import {
  CANONICAL_GLOSSARY_TERMS,
  extractSummaryFromMarkdown,
  getCanonicalGlossaryBySlug,
  inferGlossaryCategory,
  type GlossaryTermEntry,
} from '../../shared/glossary/canonical-terms';

const GLOSSARY_TTL_MS = 10 * 60 * 1000;
const GLOSSARY_ERROR_TTL_MS = 30 * 1000;

export interface RawGlossaryDbRow {
  slug: string;
  term: string;
  definition_markdown?: string | null;
  related_number?: number | null;
  tags?: string[] | null;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface GlossaryAnalysisSnapshot {
  id?: string | null;
  nome_completo?: string | null;
  numero_expressao?: number | null;
  numero_destino?: number | null;
  numero_motivacao?: number | null;
  numero_missao?: number | null;
  numero_personalidade?: number | null;
  bloqueios?: Array<{ codigo?: string | number; titulo?: string }> | null;
  licoes_carmicas?: Array<{ numero?: number } | number> | null;
  tendencias_ocultas?: Array<{ numero?: number } | number> | null;
  debitos_karmicos?: Array<{ numero?: number } | number> | null;
}

export interface MatchedUserGlossaryTerm {
  term: GlossaryTermEntry;
  reasonBadge: string;
}

function buildDynamicAliases(term: string): string[] {
  const clean = term.trim();
  if (!clean) return [];
  const mainHead = clean.split(/[—–:(]/)[0]?.trim();
  const aliases = new Set<string>([clean]);
  if (mainHead && mainHead.length >= 6) {
    aliases.add(mainHead);
  }
  return Array.from(aliases);
}

/**
 * Faz merge determinístico entre linhas publicadas do banco (`public.glossary_terms`)
 * e o catálogo canônico de domínio. Registros do banco têm precedência de texto e
 * metadados; campos editoriais extras (categoria, aliases, relacionados) são preservados.
 */
export function mergeGlossaryTerms(dbRows: RawGlossaryDbRow[]): GlossaryTermEntry[] {
  const bySlug = new Map<string, GlossaryTermEntry>();

  for (const canonical of CANONICAL_GLOSSARY_TERMS) {
    bySlug.set(canonical.slug, { ...canonical, isCanonicalFallback: true });
  }

  for (const row of dbRows) {
    const slug = String(row.slug || '').trim();
    if (!slug) continue;

    const canonical = getCanonicalGlossaryBySlug(slug);
    const dbMarkdown = typeof row.definition_markdown === 'string' ? row.definition_markdown.trim() : '';
    const dbTags = Array.isArray(row.tags) ? row.tags.filter((t): t is string => Boolean(t?.trim())) : [];
    const termTitle = (row.term || canonical?.term || slug).trim();

    if (canonical) {
      const mergedMarkdown = dbMarkdown || canonical.definitionMarkdown;
      bySlug.set(slug, {
        ...canonical,
        term: termTitle,
        definitionMarkdown: mergedMarkdown,
        shortSummary: dbMarkdown ? extractSummaryFromMarkdown(dbMarkdown) : canonical.shortSummary,
        relatedNumber: row.related_number ?? canonical.relatedNumber,
        tags: dbTags.length > 0 ? dbTags : canonical.tags,
        metaTitle: row.meta_title ?? canonical.metaTitle,
        metaDescription: row.meta_description ?? canonical.metaDescription,
        isCanonicalFallback: false,
      });
    } else {
      const category = inferGlossaryCategory(slug, termTitle, dbTags);
      bySlug.set(slug, {
        slug,
        term: termTitle,
        category,
        aliases: buildDynamicAliases(termTitle),
        shortSummary: extractSummaryFromMarkdown(dbMarkdown),
        definitionMarkdown: dbMarkdown || extractSummaryFromMarkdown(dbMarkdown),
        relatedNumber: row.related_number ?? null,
        tags: dbTags,
        metaTitle: row.meta_title ?? undefined,
        metaDescription: row.meta_description ?? undefined,
        isCanonicalFallback: false,
      });
    }
  }

  const canonicalIndex = new Map(CANONICAL_GLOSSARY_TERMS.map((item, idx) => [item.slug, idx]));
  return Array.from(bySlug.values()).sort((a, b) => {
    const idxA = canonicalIndex.get(a.slug);
    const idxB = canonicalIndex.get(b.slug);
    if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
    if (idxA !== undefined) return -1;
    if (idxB !== undefined) return 1;
    return a.term.localeCompare(b.term, 'pt-BR');
  });
}

/**
 * Lista todos os termos publicados do glossário (banco + fallback canônico).
 */
export async function listPublishedGlossaryTerms(): Promise<GlossaryTermEntry[]> {
  return memoize(
    'glossary:published:merged',
    (terms) => (!terms || terms.length === 0 ? GLOSSARY_ERROR_TTL_MS : GLOSSARY_TTL_MS),
    async () => {
      try {
        const { data, error } = await supabase
          .from('glossary_terms')
          .select('slug, term, definition_markdown, related_number, tags, meta_title, meta_description')
          .eq('is_published', true)
          .order('term', { ascending: true })
          .abortSignal(AbortSignal.timeout(2000));

        if (error) {
          console.warn('[glossary] fallback para catálogo canônico:', error.message ?? error.code);
          return mergeGlossaryTerms([]);
        }
        return mergeGlossaryTerms((data ?? []) as RawGlossaryDbRow[]);
      } catch (err) {
        console.warn('[glossary] erro ao ler Supabase — usando catálogo canônico:', err);
        return mergeGlossaryTerms([]);
      }
    },
  );
}

/**
 * Busca um termo específico por slug junto com termos relacionados resolvidos.
 */
export async function getGlossaryTermBySlug(slug: string): Promise<{
  term: GlossaryTermEntry;
  relatedTerms: GlossaryTermEntry[];
} | null> {
  const normalized = String(slug || '').trim().toLowerCase();
  if (!normalized) return null;

  const allTerms = await listPublishedGlossaryTerms();
  const term = allTerms.find((item) => item.slug.toLowerCase() === normalized);
  if (!term) return null;

  const bySlug = new Map(allTerms.map((item) => [item.slug, item]));
  const related: GlossaryTermEntry[] = [];
  const seen = new Set<string>([term.slug]);

  for (const relSlug of term.relatedSlugs ?? []) {
    const found = bySlug.get(relSlug);
    if (found && !seen.has(found.slug)) {
      related.push(found);
      seen.add(found.slug);
    }
  }

  if (related.length < 4) {
    for (const candidate of allTerms) {
      if (seen.has(candidate.slug)) continue;
      if (
        (term.relatedNumber != null && candidate.relatedNumber === term.relatedNumber) ||
        candidate.category === term.category
      ) {
        related.push(candidate);
        seen.add(candidate.slug);
      }
      if (related.length >= 4) break;
    }
  }

  return { term, relatedTerms: related.slice(0, 4) };
}

function extractNumericValue(entry: { numero?: number } | number): number | null {
  if (typeof entry === 'number' && Number.isFinite(entry)) return entry;
  if (entry && typeof entry === 'object' && typeof entry.numero === 'number') return entry.numero;
  return null;
}

/**
 * Cruza os elementos ativos de uma análise do usuário (bloqueios, débitos, lições,
 * tendências e números principais) com os termos disponíveis do glossário.
 */
export function matchUserGlossaryTerms(
  terms: GlossaryTermEntry[],
  analysis: GlossaryAnalysisSnapshot | null | undefined,
): MatchedUserGlossaryTerm[] {
  if (!analysis || !terms.length) return [];

  const bySlug = new Map(terms.map((item) => [item.slug, item]));
  const matched: MatchedUserGlossaryTerm[] = [];
  const seenSlugs = new Set<string>();

  const pushMatch = (slug: string, reasonBadge: string) => {
    if (seenSlugs.has(slug)) return;
    const found = bySlug.get(slug);
    if (!found) return;
    matched.push({ term: found, reasonBadge });
    seenSlugs.add(slug);
  };

  // 1. Bloqueios ativos (ex.: 444 -> bloqueio-444)
  const bloqueios = Array.isArray(analysis.bloqueios) ? analysis.bloqueios : [];
  for (const bloqueio of bloqueios) {
    const code = String(bloqueio?.codigo ?? '').trim();
    if (!code) continue;
    pushMatch(`bloqueio-${code}`, `Bloqueio ativo ${code}`);
  }
  if (bloqueios.length > 0) {
    pushMatch('bloqueios-energeticos', `${bloqueios.length} bloqueio(s) no mapa`);
  }

  // 2. Débitos Kármicos (13, 14, 16, 19)
  const debitos = Array.isArray(analysis.debitos_karmicos) ? analysis.debitos_karmicos : [];
  for (const debito of debitos) {
    const n = extractNumericValue(debito);
    if (n != null) {
      pushMatch(`debito-karmico-${n}`, `Seu Débito ${n}`);
    }
  }
  if (debitos.length > 0) {
    pushMatch('debitos-karmicos', 'Presente no seu mapa');
  }

  // 3. Lições Kármicas & Tendências Ocultas
  const licoes = Array.isArray(analysis.licoes_carmicas) ? analysis.licoes_carmicas : [];
  if (licoes.length > 0) {
    pushMatch('licoes-karmicas', `${licoes.length} lição(ões) no mapa`);
  }

  const tendencias = Array.isArray(analysis.tendencias_ocultas) ? analysis.tendencias_ocultas : [];
  if (tendencias.length > 0) {
    pushMatch('tendencias-ocultas', `${tendencias.length} tendência(s) no mapa`);
  }

  // 4. Números Mestres (11, 22) em Expressão ou Destino
  if (analysis.numero_expressao === 11 || analysis.numero_destino === 11) {
    pushMatch('numero-mestre-11', 'Vibração Mestre 11');
  }
  if (analysis.numero_expressao === 22 || analysis.numero_destino === 22) {
    pushMatch('numero-mestre-22', 'Vibração Mestre 22');
  }

  // 5. Fundamentos do mapa (Expressão, Destino, Triângulo da Vida)
  if (typeof analysis.numero_expressao === 'number') {
    pushMatch('numero-de-expressao', `Sua Expressão ${analysis.numero_expressao}`);
  }
  if (typeof analysis.numero_destino === 'number') {
    pushMatch('numero-de-destino', `Seu Destino ${analysis.numero_destino}`);
  }
  if (typeof analysis.numero_personalidade === 'number') {
    pushMatch('numero-de-personalidade', `Sua Impressão ${analysis.numero_personalidade}`);
  }
  pushMatch('triangulo-da-vida', 'Base do seu score');
  pushMatch('nota-do-nome', 'Como sua nota é calculada');

  return matched;
}
