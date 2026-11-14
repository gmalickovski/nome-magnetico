import React from 'react';
import type { ResultPanelData } from './chat-types.js';
import {
  ProductHarmonyStar,
  harmonyStarNumsFromPanel,
} from '../../landing/ProductResultFrame.js';
import ReadingTopicCard from './ReadingTopicCard.js';

type StarTipKey = 'destino' | 'expressao' | 'motivacao' | 'missao' | 'impressao';

const NUMERO_VIBRACAO: Record<number, string> = {
  1: 'Iniciativa e Autonomia',
  2: 'Sensibilidade e Mediação',
  3: 'Criatividade e Comunicação',
  4: 'Método e Construção',
  5: 'Versatilidade e Movimento',
  6: 'Harmonia e Cuidado',
  7: 'Análise e Profundidade',
  8: 'Poder e Abundância',
  9: 'Compaixão e Humanidade',
  11: 'Intuição e Inspiração',
  22: 'Visão e Manifestação',
};

const STAR_TIP_EXPLANATIONS: ReadonlyArray<{
  key: StarTipKey;
  label: string;
  description: string;
}> = [
  {
    key: 'destino',
    label: 'Destino',
    description:
      'Calculado pela soma da data de nascimento (imutável). Representa a sua estrada evolutiva, as oportunidades naturais e os aprendizados centrais da sua jornada.',
  },
  {
    key: 'expressao',
    label: 'Expressão',
    description:
      'Soma de todas as letras do nome em uso. Revela como você manifesta seus talentos na prática, interage com o mundo e projeta sua força de realização.',
  },
  {
    key: 'motivacao',
    label: 'Motivação',
    description:
      'Calculada pelas vogais do nome. Traduz o impulso íntimo da alma — o que move suas escolhas por dentro e nutre sua realização pessoal.',
  },
  {
    key: 'missao',
    label: 'Missão',
    description:
      'Nasce da síntese entre Destino e Expressão. Aponta a sua vocação maior, o propósito prático e o legado que você veio construir.',
  },
  {
    key: 'impressao',
    label: 'Impressão',
    description:
      'Calculada pelas consoantes do nome. Reflete a primeira impressão vibracional que sua assinatura transmite e como o mundo percebe sua presença.',
  },
];

export interface ChatHarmonyStarPanelProps {
  birthPanel: ResultPanelData;
  harmonizedPanel?: ResultPanelData | null;
  isSuggestion: boolean;
  onResetToBase?: () => void;
  className?: string;
}

/** Estrela cabalística do painel lateral — mesmo componente da landing. */
export function ChatHarmonyStarPanel({
  birthPanel,
  harmonizedPanel = null,
  isSuggestion,
  onResetToBase,
  className = '',
}: ChatHarmonyStarPanelProps) {
  const dual = isSuggestion && Boolean(harmonizedPanel);
  const activePanel = dual && harmonizedPanel ? harmonizedPanel : birthPanel;

  return (
    <ReadingTopicCard
      eyebrow="Estrela Cabalística"
      subtitle="Os 5 números essenciais do seu campo vibracional"
      className={className}
    >
      {dual && harmonizedPanel ? (
        <ProductHarmonyStar
          play
          variant="dual"
          birthName={birthPanel.nome}
          birthScore={birthPanel.score}
          birthNums={harmonyStarNumsFromPanel(birthPanel)}
          harmonizedName={harmonizedPanel.nome}
          harmonizedScore={harmonizedPanel.score}
          harmonizedNums={harmonyStarNumsFromPanel(harmonizedPanel)}
        />
      ) : (
        <ProductHarmonyStar
          play
          variant="birth-only"
          birthName={birthPanel.nome}
          birthScore={birthPanel.score}
          birthNums={harmonyStarNumsFromPanel(birthPanel)}
        />
      )}

      <div className="w-full pt-3.5 border-t border-white/[0.06] space-y-3.5 text-left">
        {STAR_TIP_EXPLANATIONS.map((item) => {
          const activeVal = activePanel[item.key];
          const birthVal = birthPanel[item.key];
          const archetipo = NUMERO_VIBRACAO[activeVal];
          const changed = dual && birthVal !== activeVal;

          return (
            <div key={item.key} className="space-y-1 text-left">
              <h4 className="font-semibold text-[#e5e2e1] text-sm leading-snug">
                {item.label} <span className="text-[#f2ca50]">= {activeVal}</span>
                {changed && (
                  <span className="text-xs font-normal text-gray-400 ml-1.5">
                    (nascimento: {birthVal})
                  </span>
                )}
                {archetipo && (
                  <span className="text-xs font-normal text-[#bea5ff] ml-1.5">
                    · {archetipo}
                  </span>
                )}
              </h4>
              <p className="nm-card-text text-gray-300">{item.description}</p>
            </div>
          );
        })}
      </div>
    </ReadingTopicCard>
  );
}

export default ChatHarmonyStarPanel;
