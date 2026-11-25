import { useMemo } from 'react';
import {
  CANONICAL_GLOSSARY_TERMS,
  GLOSSARY_CATEGORY_LABELS,
} from '../../../shared/glossary/canonical-terms.js';
import { segmentTextWithGlossaryTerms } from '../../../shared/glossary/term-linker.js';

export interface GlossaryLinkedTextProps {
  text: string;
  baseHref?: '/app/glossario' | '/glossario';
}

/**
 * Componente React que auto-linka a 1ª ocorrência de cada termo do glossário em um bloco de texto,
 * mantendo as marcações `[data-glossary-*]` consumidas pelo `GlossaryTermOverlay`.
 */
export function GlossaryLinkedText({
  text,
  baseHref = '/app/glossario',
}: GlossaryLinkedTextProps) {
  const segments = useMemo(
    () => segmentTextWithGlossaryTerms(text, CANONICAL_GLOSSARY_TERMS, { baseHref }),
    [text, baseHref],
  );

  return (
    <>
      {segments.map((seg, index) => {
        if (seg.type === 'text') {
          return <span key={index}>{seg.value}</span>;
        }
        return (
          <a
            key={`${seg.term.slug}-${index}`}
            href={`${baseHref}/${seg.term.slug}`}
            data-glossary-slug={seg.term.slug}
            data-glossary-term={seg.term.term}
            data-glossary-category={GLOSSARY_CATEGORY_LABELS[seg.term.category]}
            data-glossary-summary={seg.term.shortSummary}
            className="nm-glossary-link decoration-[#D4AF37]/55 underline decoration-dotted underline-offset-4 text-[#e5e2e1] hover:text-[#f2ca50] transition-colors"
          >
            {seg.value}
          </a>
        );
      })}
    </>
  );
}

export default GlossaryLinkedText;
