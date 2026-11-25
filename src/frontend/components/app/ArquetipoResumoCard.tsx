import type { ArchetypeSummary } from '../../../shared/archetype-summary';
import { GlossaryInlineTerm } from '../glossary/GlossaryInlineTerm';

export interface ArquetipoResumoCardProps {
  arquetipo?: ArchetypeSummary | null;
  expressao?: number | null;
  arquetipoNascimento?: ArchetypeSummary | null;
  expressaoNascimento?: number | null;
  isSuggestion?: boolean;
  variant?: 'dashboard' | 'panel' | 'card' | 'plain';
}

interface ArchetypeRelationMeta {
  kind: 'baseline' | 'unchanged' | 'changed';
  badge: string;
  panelText: string;
  dashboardText: string;
}

function buildRelationMeta(
  arquetipo: ArchetypeSummary,
  expressaoAtual: number,
  arquetipoNascimento?: ArchetypeSummary | null,
  expressaoNascimento?: number | null,
  isSuggestion?: boolean,
): ArchetypeRelationMeta {
  const birthNum =
    typeof expressaoNascimento === 'number' && expressaoNascimento > 0
      ? expressaoNascimento
      : arquetipoNascimento?.numero;

  if (arquetipoNascimento && (isSuggestion || arquetipoNascimento.numero !== arquetipo.numero)) {
    if (arquetipoNascimento.numero === arquetipo.numero) {
      return {
        kind: 'unchanged',
        badge: 'Permanência simbólica',
        panelText: `O arquétipo permanece o mesmo do nome de nascimento (${arquetipo.nome} · Expressão ${expressaoAtual}). A harmonização organiza sua energia sem mudar a força central.`,
        dashboardText: 'O arquétipo permanece o mesmo do nome de nascimento.',
      };
    }

    return {
      kind: 'changed',
      badge: 'Novo arquétipo ativado',
      panelText: `Com este nome, o arquétipo mudou de ${arquetipoNascimento.nome} (Exp. ${birthNum}) para ${arquetipo.nome} (Exp. ${expressaoAtual}).`,
      dashboardText: `Evoluiu de ${arquetipoNascimento.nome} (Exp. ${birthNum}) para ${arquetipo.nome} (Exp. ${expressaoAtual}).`,
    };
  }

  return {
    kind: 'baseline',
    badge: `Expressão ${expressaoAtual} · Base`,
    panelText:
      'Calculado pela Expressão deste nome. Ao selecionar uma opção de harmonização, este card mostra se o arquétipo muda ou se mantém.',
    dashboardText: `Calculado pela Expressão ${expressaoAtual} do nome selecionado.`,
  };
}

export function ArquetipoResumoCard({
  arquetipo,
  expressao,
  arquetipoNascimento,
  expressaoNascimento,
  isSuggestion = false,
  variant = 'card',
}: ArquetipoResumoCardProps) {
  if (!arquetipo) return null;

  const numeroExibido = typeof expressao === 'number' && expressao > 0 ? expressao : arquetipo.numero;
  const destaques = arquetipo.expressaoPositiva.slice(0, 2);
  const sombraPrincipal = arquetipo.expressaoSombra[0];
  const sombrasPainel = arquetipo.expressaoSombra.slice(0, 2);
  const positivasPainel = arquetipo.expressaoPositiva.slice(0, 3);
  const relation = buildRelationMeta(
    arquetipo,
    numeroExibido,
    arquetipoNascimento,
    expressaoNascimento,
    isSuggestion,
  );

  if (variant === 'dashboard' || variant === 'plain') {
    const relationColorClass =
      relation.kind === 'unchanged'
        ? 'text-[#d7c6ff]'
        : relation.kind === 'changed'
          ? 'text-[#f2ca50]'
          : 'text-[#A0A0A0]';

    return (
      <div className="mt-4 space-y-3.5" aria-label={`Arquétipo ${arquetipo.nome}`}>
        <div className="rounded-xl bg-[#141414] px-4 py-3">
          <p className="font-cinzel text-sm sm:text-[15px] italic text-[#f2ca50] leading-snug">
            “{arquetipo.essencia}”
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#141414] p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f2ca50]">
              Força principal
            </p>
            <ul className="space-y-1.5 text-[13px] leading-relaxed text-[#e5e2e1]/90">
              {destaques.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {(sombraPrincipal || arquetipo.sombra) && (
            <div className="rounded-xl bg-[#141414] p-4 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#bea5ff]">
                    Ponto de atenção
                  </p>
                  {arquetipo.sombra && (
                    <span className="rounded-full bg-[#221F2A] px-2.5 py-0.5 text-[11px] font-medium text-[#d7c6ff]">
                      Sombra: {arquetipo.sombra}
                    </span>
                  )}
                </div>
                {sombraPrincipal && (
                  <p className="text-[13px] leading-relaxed text-[#e5e2e1]/85">{sombraPrincipal}</p>
                )}
              </div>
              {arquetipo.figurasMiticas && arquetipo.figurasMiticas.length > 0 && (
                <p className="pt-1 text-[11px] text-[#8E8A80]">
                  Referências: {arquetipo.figurasMiticas.join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-[11px]">
          <p className={`font-medium ${relationColorClass}`}>{relation.dashboardText}</p>
          <p className="text-[#8E8A80]">
            Síntese simbólica vinculada à <GlossaryInlineTerm slug="numero-de-expressao">Expressão</GlossaryInlineTerm> — não altera o score.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'panel') {
    const badgeClass =
      relation.kind === 'changed'
        ? 'bg-[#272213] text-[#f2ca50]'
        : relation.kind === 'unchanged'
          ? 'bg-[#221F2A] text-[#d7c6ff]'
          : 'bg-[#252525] text-[#CFCBC5]';

    return (
      <div className="space-y-3" aria-label={`Arquétipo ${arquetipo.nome}`}>
        <div className="rounded-xl bg-[#141414] px-3.5 py-3 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A0A0A0]">
              Relação com <GlossaryInlineTerm slug="numero-de-expressao">Expressão</GlossaryInlineTerm> {numeroExibido}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
              {relation.badge}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#CFCBC5]">{relation.panelText}</p>
        </div>

        <div className="rounded-xl bg-[#141414] px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f2ca50]/85">
            Essência
          </p>
          <p className="mt-1 font-cinzel text-[13px] sm:text-sm italic leading-snug text-[#e5e2e1]">
            “{arquetipo.essencia}”
          </p>
        </div>

        {arquetipo.descricao && (
          <p className="text-[12.5px] leading-relaxed text-[#CFCBC5]">{arquetipo.descricao}</p>
        )}

        <div className="grid grid-cols-1 gap-2.5">
          {positivasPainel.length > 0 && (
            <div className="rounded-xl bg-[#141414] p-3.5 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6ee7b7]">
                Expressão positiva
              </p>
              <ul className="space-y-1 text-xs leading-relaxed text-[#e5e2e1]/90">
                {positivasPainel.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#34d399]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(sombrasPainel.length > 0 || arquetipo.sombra) && (
            <div className="rounded-xl bg-[#141414] p-3.5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f5b79f]">
                  Expressão sombra
                </p>
                {arquetipo.sombra && (
                  <span className="rounded-full bg-[#241B1A] px-2 py-0.5 text-[10px] font-medium text-[#f5b79f]">
                    Sombra: {arquetipo.sombra}
                  </span>
                )}
              </div>
              {sombrasPainel.length > 0 && (
                <ul className="space-y-1 text-xs leading-relaxed text-[#e5e2e1]/85">
                  {sombrasPainel.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#f5b79f]/80" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {arquetipo.figurasMiticas && arquetipo.figurasMiticas.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#bea5ff]">
              Figuras de referência
            </p>
            <div className="flex flex-wrap gap-1.5">
              {arquetipo.figurasMiticas.map((figura) => (
                <span
                  key={figura}
                  className="rounded-full bg-[#221F2A] px-2.5 py-0.5 text-[11px] font-medium text-[#d7c6ff]"
                >
                  {figura}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-[#8E8A80]">
          Leitura simbólica do <GlossaryInlineTerm slug="arquetipo">arquétipo</GlossaryInlineTerm> — não altera o score vibracional.
        </p>
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl bg-[#1C1C1C] p-4 shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
      aria-label={`Arquétipo ${arquetipo.nome}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-cinzel text-sm font-semibold uppercase tracking-wide text-[#f2ca50]">
          <GlossaryInlineTerm slug="arquetipo">Arquétipo</GlossaryInlineTerm>: {arquetipo.nome}
        </h3>
        <span className="text-[11px] text-[#d7c6ff]">
          <GlossaryInlineTerm slug="numero-de-expressao">Expressão</GlossaryInlineTerm> {numeroExibido}
        </span>
      </div>
      <p className="mt-1.5 font-cinzel text-xs italic text-[#e5e2e1]">{arquetipo.essencia}</p>
      <ul className="mt-3 space-y-1 text-xs text-[#e5e2e1]/90">
        {destaques.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {sombraPrincipal && (
        <p className="mt-2.5 text-xs text-[#D6CBB8]">
          <strong className="text-[#e5e2e1]">Ponto de atenção:</strong> {sombraPrincipal}
        </p>
      )}
      <p className="mt-2.5 text-[11px] font-medium text-[#bea5ff]">{relation.dashboardText}</p>
      <p className="mt-2 text-[11px] text-[#8E8A80]">
        Síntese simbólica para autoconhecimento, sem diagnóstico ou alteração do score.
      </p>
    </section>
  );
}
