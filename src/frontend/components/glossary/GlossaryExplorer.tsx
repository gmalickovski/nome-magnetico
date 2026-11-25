import { useMemo, useState } from 'react';
import {
  GLOSSARY_CATEGORY_LABELS,
  GLOSSARY_CATEGORY_ORDER,
  type GlossaryCategory,
} from '../../../shared/glossary/canonical-terms.js';

export interface GlossaryExplorerItem {
  slug: string;
  term: string;
  category: GlossaryCategory;
  shortSummary: string;
  relatedNumber: number | null;
  tags: string[];
}

export interface GlossaryPersonalizedMatch extends GlossaryExplorerItem {
  reasonBadge: string;
}

export interface GlossaryExplorerProps {
  terms: GlossaryExplorerItem[];
  baseHref: '/glossario' | '/app/glossario';
  personalizedMatches?: GlossaryPersonalizedMatch[];
}

const NUMBER_FILTERS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function GlossaryExplorer({
  terms,
  baseHref,
  personalizedMatches = [],
}: GlossaryExplorerProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | GlossaryCategory>('all');
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const filteredTerms = useMemo(() => {
    const q = normalizeText(query);
    return terms.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedNumber !== null && item.relatedNumber !== selectedNumber) return false;
      if (!q) return true;
      const haystack = normalizeText(
        `${item.term} ${item.shortSummary} ${item.tags.join(' ')} ${GLOSSARY_CATEGORY_LABELS[item.category]}`,
      );
      return haystack.includes(q);
    });
  }, [terms, query, selectedCategory, selectedNumber]);

  const hasActiveFilters = Boolean(query.trim() || selectedCategory !== 'all' || selectedNumber !== null);

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedNumber(null);
  };

  return (
    <div className="space-y-10">
      {/* Destaque personalizado dentro da área logada */}
      {personalizedMatches.length > 0 && (
        <section className="nm-floating-card rounded-2xl p-5 sm:p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f2ca50]">
                No seu mapa
              </p>
              <h2 className="mt-1 font-cinzel text-xl font-bold text-[#e5e2e1] sm:text-2xl">
                Termos da sua análise
              </h2>
            </div>
            <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-xs font-semibold text-[#f2ca50]">
              {personalizedMatches.length} {personalizedMatches.length === 1 ? 'conceito ativo' : 'conceitos ativos'}
            </span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {personalizedMatches.map((item) => (
              <a
                key={item.slug}
                href={`${baseHref}/${item.slug}`}
                className="group nm-glossary-card flex flex-col justify-between p-5"
              >
                <div>
                  <span className="inline-flex items-center rounded-full bg-[#D4AF37]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">
                    {item.reasonBadge}
                  </span>
                  <h3 className="mt-2.5 font-cinzel text-base font-bold text-[#e5e2e1] transition-colors duration-700 group-hover:text-[#f2ca50]">
                    {item.term}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#A0A0A0] line-clamp-2">
                    {item.shortSummary}
                  </p>
                </div>
                <span className="mt-3 text-xs font-semibold text-[#D4AF37] opacity-80 transition-opacity duration-700 group-hover:opacity-100">
                  Estudar conceito →
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Barra de busca e filtros no corpo da página */}
      <section
        aria-label="Filtros do glossário"
        className="nm-floating-card rounded-2xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0A0A0]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar termo, código (ex.: 444, Expressão, Triângulo, Karma)..."
              className="w-full rounded-full bg-[#131313] py-3 pl-11 pr-4 text-sm text-[#e5e2e1] placeholder-[#76746a] ring-1 ring-white/10 transition focus:outline-none focus:ring-2 focus:ring-[#bea5ff]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs font-medium text-[#A0A0A0]">
              {filteredTerms.length} {filteredTerms.length === 1 ? 'termo' : 'termos'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-[#d7c6ff] transition hover:bg-white/[0.12]"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Categorias */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
            Categorias
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === 'all'
                  ? 'bg-[#D4AF37] text-[#131313]'
                  : 'bg-[#131313]/80 text-[#e5e2e1] ring-1 ring-white/10 hover:ring-[#D4AF37]/40'
              }`}
            >
              Todos
            </button>
            {GLOSSARY_CATEGORY_ORDER.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(active ? 'all' : category)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-[#D4AF37] text-[#131313]'
                      : 'bg-[#131313]/80 text-[#e5e2e1] ring-1 ring-white/10 hover:ring-[#D4AF37]/40'
                  }`}
                >
                  {GLOSSARY_CATEGORY_LABELS[category]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Números Cabalísticos */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
            Filtrar por número relacionado
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedNumber(null)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                selectedNumber === null
                  ? 'bg-[#bea5ff] text-[#131313]'
                  : 'bg-[#131313]/80 text-[#A0A0A0] ring-1 ring-white/10 hover:text-[#e5e2e1]'
              }`}
            >
              Todos
            </button>
            {NUMBER_FILTERS.map((num) => {
              const active = selectedNumber === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedNumber(active ? null : num)}
                  className={`min-w-[2.25rem] rounded-full px-2.5 py-1 text-xs font-bold tabular-nums transition ${
                    active
                      ? 'bg-[#bea5ff] text-[#131313]'
                      : 'bg-[#131313]/80 text-[#e5e2e1] ring-1 ring-white/10 hover:ring-[#bea5ff]/50'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid de termos */}
      {filteredTerms.length === 0 ? (
        <div className="nm-floating-card rounded-2xl p-8 text-center">
          <p className="font-cinzel text-lg font-bold text-[#e5e2e1]">
            Nenhum termo encontrado com esses filtros
          </p>
          <p className="mt-2 text-sm text-[#A0A0A0]">
            Tente buscar outro conceito ou limpe os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#131313] hover:bg-[#f2ca50]"
          >
            Ver todos os termos
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTerms.map((item) => (
            <a
              key={item.slug}
              href={`${baseHref}/${item.slug}`}
              className="group nm-glossary-card flex flex-col justify-between p-5 sm:p-6"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#bea5ff]">
                    {GLOSSARY_CATEGORY_LABELS[item.category]}
                  </span>
                  {item.relatedNumber != null && (
                    <span className="rounded-full bg-[#D4AF37]/12 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-[#f2ca50]">
                      Número {item.relatedNumber}
                    </span>
                  )}
                </div>

                <h3 className="mt-3 font-cinzel text-lg font-bold leading-snug text-[#e5e2e1] transition-colors duration-700 group-hover:text-[#f2ca50]">
                  {item.term}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#A0A0A0] line-clamp-3">
                  {item.shortSummary}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-medium text-[#A0A0A0]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-semibold text-[#D4AF37] opacity-80 transition-opacity duration-700 group-hover:opacity-100">
                  Ler mais →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default GlossaryExplorer;
