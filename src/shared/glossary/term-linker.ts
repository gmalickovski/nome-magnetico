import {
  GLOSSARY_CATEGORY_LABELS,
  type GlossaryTermEntry,
} from './canonical-terms.js';

export type GlossarySegment =
  | { type: 'text'; value: string }
  | { type: 'term'; value: string; term: GlossaryTermEntry };

export interface TermLinkerOptions {
  /** Base path para links completos (`/app/glossario` ou `/glossario`). */
  baseHref?: '/app/glossario' | '/glossario';
  /** Conjunto compartilhado para limitar a 1ª ocorrência por card/bloco ou seção. */
  seenSlugs?: Set<string>;
}

interface AliasMatcher {
  alias: string;
  exactCase: boolean;
  term: GlossaryTermEntry;
}

const REGEX_CACHE = new WeakMap<GlossaryTermEntry[], {
  pattern: RegExp;
  aliasLookup: Map<string, AliasMatcher>;
}>();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCompiledMatcher(terms: GlossaryTermEntry[]): {
  pattern: RegExp | null;
  aliasLookup: Map<string, AliasMatcher>;
} {
  const cached = REGEX_CACHE.get(terms);
  if (cached) return cached;

  const matchers: AliasMatcher[] = [];
  for (const term of terms) {
    for (const alias of term.aliases ?? []) {
      const clean = alias.trim();
      if (clean.length >= 3) {
        matchers.push({ alias: clean, exactCase: false, term });
      }
    }
    for (const alias of term.exactCaseAliases ?? []) {
      const clean = alias.trim();
      if (clean.length >= 3) {
        matchers.push({ alias: clean, exactCase: true, term });
      }
    }
  }

  if (matchers.length === 0) {
    return { pattern: null, aliasLookup: new Map() };
  }

  // Longest-match-first para evitar que "Bloqueio" roube "Bloqueio Energético" ou "444"
  matchers.sort((a, b) => b.alias.length - a.alias.length);

  const aliasLookup = new Map<string, AliasMatcher>();
  const uniqueSources: string[] = [];
  const seenKeys = new Set<string>();

  for (const m of matchers) {
    const key = m.alias.toLowerCase();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueSources.push(escapeRegExp(m.alias));
      aliasLookup.set(key, m);
    }
  }

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${uniqueSources.join('|')})(?![\\p{L}\\p{N}])`,
    'giu',
  );

  const entry = { pattern, aliasLookup };
  REGEX_CACHE.set(terms, entry);
  return entry;
}

/**
 * Segmenta texto puro preservando a 1ª ocorrência de cada termo do glossário
 * neste bloco/seção e retornando nós puros para renderização React.
 */
export function segmentTextWithGlossaryTerms(
  text: string,
  terms: GlossaryTermEntry[],
  options: TermLinkerOptions = {},
): GlossarySegment[] {
  if (!text || !terms.length) {
    return text ? [{ type: 'text', value: text }] : [];
  }

  const { pattern, aliasLookup } = buildCompiledMatcher(terms);
  if (!pattern) {
    return [{ type: 'text', value: text }];
  }

  const seen = options.seenSlugs ?? new Set<string>();
  const segments: GlossarySegment[] = [];
  let cursor = 0;

  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const matchedText = match[1];
    const start = match.index;
    const matcher = aliasLookup.get(matchedText.toLowerCase());
    if (!matcher) continue;

    if (seen.has(matcher.term.slug)) {
      continue;
    }

    if (matcher.exactCase && matchedText !== matcher.alias) {
      // Exige correspondência com inicial maiúscula (ex.: "Expressão" vs "expressão facial")
      if (matchedText[0] !== matcher.alias[0]) {
        continue;
      }
    }

    if (start > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, start) });
    }
    segments.push({ type: 'term', value: matchedText, term: matcher.term });
    seen.add(matcher.term.slug);
    cursor = start + matchedText.length;
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const SKIPPED_HTML_TAGS = new Set([
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'code',
  'pre',
  'button',
  'script',
  'style',
]);

/**
 * Insere links interativos na 1ª ocorrência de cada termo do glossário dentro de HTML
 * (ex.: saída do `marked`), ignorando tags bloqueadas (`a`, `h1`-`h6`, `code`, `pre`, `button`).
 * Nunca usado em PDF.
 */
export function linkGlossaryTermsInHtml(
  html: string,
  terms: GlossaryTermEntry[],
  options: TermLinkerOptions = {},
): string {
  if (!html || !terms.length) return html;

  const baseHref = options.baseHref ?? '/glossario';
  const seen = options.seenSlugs ?? new Set<string>();
  const tokenRegex = /(<[^>]+>)|([^<]+)/g;
  const tagDepth: Record<string, number> = {};

  let result = '';
  let token: RegExpExecArray | null;

  while ((token = tokenRegex.exec(html)) !== null) {
    const tag = token[1];
    const textChunk = token[2];

    if (tag) {
      const openMatch = /^<([a-zA-Z0-9]+)(?=[\s/>])/.exec(tag);
      const closeMatch = /^<\/([a-zA-Z0-9]+)\s*>/.exec(tag);
      const isSelfClosing = /\/>$/.test(tag);

      if (openMatch && !isSelfClosing) {
        const tagName = openMatch[1].toLowerCase();
        if (SKIPPED_HTML_TAGS.has(tagName)) {
          tagDepth[tagName] = (tagDepth[tagName] ?? 0) + 1;
        }
      } else if (closeMatch) {
        const tagName = closeMatch[1].toLowerCase();
        if (SKIPPED_HTML_TAGS.has(tagName)) {
          tagDepth[tagName] = Math.max(0, (tagDepth[tagName] ?? 0) - 1);
        }
      }

      result += tag;
      continue;
    }

    if (textChunk) {
      const insideSkipped = Object.values(tagDepth).some((depth) => depth > 0);
      if (insideSkipped || !textChunk.trim()) {
        result += textChunk;
        continue;
      }

      const segments = segmentTextWithGlossaryTerms(textChunk, terms, {
        baseHref,
        seenSlugs: seen,
      });

      for (const seg of segments) {
        if (seg.type === 'text') {
          result += seg.value;
        } else {
          const href = `${baseHref}/${seg.term.slug}`;
          result += `<a href="${href}" data-glossary-slug="${escapeHtmlAttr(seg.term.slug)}" data-glossary-term="${escapeHtmlAttr(seg.term.term)}" data-glossary-category="${escapeHtmlAttr(GLOSSARY_CATEGORY_LABELS[seg.term.category])}" data-glossary-summary="${escapeHtmlAttr(seg.term.shortSummary)}" class="nm-glossary-link decoration-[#D4AF37]/55 underline decoration-dotted underline-offset-4 text-[#e5e2e1] hover:text-[#f2ca50] transition-colors">${seg.value}</a>`;
        }
      }
    }
  }

  return result;
}
