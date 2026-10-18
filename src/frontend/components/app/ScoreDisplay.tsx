import { obterNivelV3 } from '../../../shared/score-v3';

interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  scoreVersion?: string | null;
  version?: string | null;
  showHowItWorksLink?: boolean;
  showLevelLink?: boolean;
}

interface ScoreLevel {
  bar: string;
  text: string;
  label: string;
  description: string;
  code?: string;
}

function getLegacyScoreLevel(clamped: number): ScoreLevel {
  if (clamped >= 90) {
    return {
      bar: 'from-emerald-500 to-emerald-400',
      text: 'text-emerald-400',
      label: 'Excelente',
      description: 'Vibração altamente favorável. Nome com excelente alinhamento energético e numerológico.',
    };
  }

  if (clamped >= 70) {
    return {
      bar: 'from-lime-500 to-lime-400',
      text: 'text-lime-400',
      label: 'Bom',
      description: 'Boa vibração geral. Pontos positivos superam eventuais tensões menores.',
    };
  }

  if (clamped >= 40) {
    return {
      bar: 'from-yellow-500 to-yellow-400',
      text: 'text-yellow-400',
      label: 'Aceitável',
      description: 'Vibração mediana. Funcional, mas há oportunidades de melhora energética.',
    };
  }

  if (clamped >= 20) {
    return {
      bar: 'from-orange-500 to-orange-400',
      text: 'text-orange-400',
      label: 'Não recomendado',
      description: 'Vibração desfavorável. Este nome carrega tensões que podem impactar negativamente.',
    };
  }

  return {
    bar: 'from-red-600 to-red-500',
    text: 'text-red-500',
    label: 'Crítico',
    description: 'Vibração muito desfavorável. Bloqueios ou tensões significativas detectados.',
  };
}

export default function ScoreDisplay({
  score,
  size = 'md',
  showLabel = true,
  showTooltip = false,
  scoreVersion,
  version,
  showHowItWorksLink = false,
  showLevelLink = false,
}: ScoreDisplayProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const resolvedVersion = scoreVersion ?? version ?? 'v3';
  const isV3 = resolvedVersion === 'v3';
  const shouldShowLink = showHowItWorksLink || showLevelLink;

  let level: ScoreLevel;
  if (isV3) {
    const v3Info = obterNivelV3(clamped);
    level = {
      bar: v3Info.corBarra,
      text: v3Info.corTexto,
      label: `${v3Info.codigo} · ${v3Info.rotulo}`,
      description: v3Info.descricao,
      code: v3Info.codigo,
    };
  } else {
    level = getLegacyScoreLevel(clamped);
  }

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  const textSizes = { sm: 'text-xs', md: 'text-xs sm:text-sm', lg: 'text-xs sm:text-sm' };
  const numSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-2xl sm:text-3xl' };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
        <span className={`font-cinzel font-bold leading-none shrink-0 ${numSizes[size]} ${level.text}`}>
          {clamped}
          <span className="text-xs sm:text-sm font-inter font-normal text-gray-500 ml-0.5">/100</span>
        </span>
        {showLabel && (
          showTooltip ? (
            <span className={`relative group/score ${textSizes[size]} font-semibold ${level.text} whitespace-nowrap cursor-default select-none`}>
              {level.label}
              <span className="ml-1 text-gray-500 text-[10px]">i</span>
              <span className="
                pointer-events-none absolute right-0 top-full mt-2 z-50
                w-64 rounded-xl bg-[#1e1c1a] border border-white/10
                shadow-2xl shadow-black/60 p-3 text-xs text-gray-300 leading-relaxed whitespace-normal
                opacity-0 group-hover/score:opacity-100
                transition-opacity duration-200
              ">
                <span className={`block font-semibold ${level.text} mb-1`}>{level.label}</span>
                <span className="block text-gray-400 mb-2">{level.description}</span>
                <span className="block border-t border-white/10 pt-2 space-y-0.5 text-gray-500">
                  {isV3 ? (
                    <>
                      <span className="block"><span className="text-emerald-400">N5 Harmonioso</span> 85-100</span>
                      <span className="block"><span className="text-lime-400">N4 Favorável</span> 70-84</span>
                      <span className="block"><span className="text-yellow-400">N3 Equilíbrio Parcial</span> 50-69</span>
                      <span className="block"><span className="text-orange-400">N2 Pede Atenção</span> 30-49</span>
                      <span className="block"><span className="text-red-400">N1 Em Tensão</span> 0-29</span>
                    </>
                  ) : (
                    <>
                      <span className="block"><span className="text-emerald-400">Excelente</span> 90-100</span>
                      <span className="block"><span className="text-lime-400">Bom</span> 70-89</span>
                      <span className="block"><span className="text-yellow-400">Aceitável</span> 40-69</span>
                      <span className="block"><span className="text-orange-400">Não recomendado</span> 20-39</span>
                      <span className="block"><span className="text-red-500">Crítico</span> 0-19</span>
                    </>
                  )}
                </span>
              </span>
            </span>
          ) : (
            <span className={`${textSizes[size]} font-semibold ${level.text} whitespace-nowrap`}>{level.label}</span>
          )
        )}
      </div>
      <div className={`w-full bg-white/10 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`${heights[size]} rounded-full bg-gradient-to-r ${level.bar} transition-all duration-700`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {shouldShowLink && (
        <div className="mt-1.5 text-right">
          <a
            href="/como-funciona-o-score"
            className="text-[11px] text-gray-500 hover:text-[#f2ca50] transition-colors underline decoration-dotted underline-offset-2"
          >
            Como calculamos esta nota?
          </a>
        </div>
      )}
    </div>
  );
}

