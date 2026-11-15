import type { ArchetypeSummary } from '../../../shared/archetype-summary';
import { GlossaryInlineTerm } from '../glossary/GlossaryInlineTerm';

export interface ArquetipoResumoCardProps {
  arquetipo?: ArchetypeSummary | null;
  expressao?: number | null;
  arquetipoNascimento?: ArchetypeSummary | null;
}

export function ArquetipoResumoCard({ arquetipo, expressao, arquetipoNascimento }: ArquetipoResumoCardProps) {
  if (!arquetipo || !expressao || expressao <= 0) return null;
  return (
    <section className="mt-6 rounded-2xl bg-[#131313]/70 p-5 text-[#e5e2e1]" aria-label="Arquétipo do nome selecionado">
      <h3 className="font-cinzel text-lg font-bold text-[#f2ca50]">
        <GlossaryInlineTerm slug="arquetipo">Arquétipo</GlossaryInlineTerm>: {arquetipo.nome}
      </h3>
      <p className="mt-2 text-sm text-[#d7c6ff]">
        <GlossaryInlineTerm slug="numero-de-expressao">Expressão</GlossaryInlineTerm> {expressao} · {arquetipo.essencia}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {arquetipo.expressaoPositiva.slice(0, 2).map(item => <li key={item}>{item}</li>)}
      </ul>
      {arquetipo.expressaoSombra[0] && <p className="mt-3 text-sm leading-relaxed"><strong>Ponto de atenção:</strong> {arquetipo.expressaoSombra[0]}.</p>}
      {arquetipo.numero === arquetipoNascimento?.numero && (
        <p className="mt-3 text-sm text-[#d7c6ff]">O arquétipo permanece o mesmo do nome de nascimento.</p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-[#e5e2e1]/75">Síntese simbólica para autoconhecimento, sem diagnóstico ou alteração do score.</p>
    </section>
  );
}
