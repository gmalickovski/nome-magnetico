import React from 'react';
import type { ResultPanelData } from './chat-types.js';
import {
  ProductHarmonyStar,
  harmonyStarNumsFromPanel,
} from '../../landing/ProductResultFrame.js';
import { getScoreTierVisual } from '../../landing/score-tier-visual.js';
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

const STAR_DIMENSION_META: ReadonlyArray<{
  key: StarTipKey;
  label: string;
  fallback: string;
}> = [
  {
    key: 'destino',
    label: 'Destino',
    fallback:
      'Calculado pela data de nascimento (imutável). Representa sua estrada evolutiva e os aprendizados centrais da jornada.',
  },
  {
    key: 'expressao',
    label: 'Expressão',
    fallback:
      'Soma das letras do nome em uso. Revela como você manifesta seus talentos e projeta sua força no mundo.',
  },
  {
    key: 'motivacao',
    label: 'Motivação',
    fallback:
      'Vibração das vogais do nome. Traduz o impulso íntimo da alma e o que nutre suas escolhas.',
  },
  {
    key: 'missao',
    label: 'Missão',
    fallback:
      'Síntese entre Destino e Expressão. Aponta sua vocação prática e o propósito maior de realização.',
  },
  {
    key: 'impressao',
    label: 'Impressão',
    fallback:
      'Vibração das consoantes do nome. Reflete a primeira impressão que sua assinatura transmite ao mundo.',
  },
];

const STAR_DIMENSION_NUMBER_MEANINGS: Record<StarTipKey, Record<number, string>> = {
  destino: {
    1: 'Calculado pela data de nascimento (imutável). Destino 1 traça uma jornada de pioneirismo, autonomia e liderança pelo exemplo.',
    2: 'Calculado pela data de nascimento (imutável). Destino 2 conduz sua trajetória por meio da diplomacia, cooperação e parcerias equilibradas.',
    3: 'Calculado pela data de nascimento (imutável). Destino 3 orienta seu caminho pela comunicação inspiradora, criatividade e expansão social.',
    4: 'Calculado pela data de nascimento (imutável). Destino 4 estrutura sua caminhada com método, disciplina, segurança e realizações duradouras.',
    5: 'Calculado pela data de nascimento (imutável). Destino 5 impulsiona movimento contínuo, versatilidade, liberdade e renovação constante.',
    6: 'Calculado pela data de nascimento (imutável). Destino 6 direciona sua estrada ao cuidado responsável, harmonia nas relações e equilíbrio estético.',
    7: 'Calculado pela data de nascimento (imutável). Destino 7 convida ao aprofundamento analítico, sabedoria prática e discernimento espiritual.',
    8: 'Calculado pela data de nascimento (imutável). Destino 8 aponta uma estrada de autoridade executiva, justiça e realização material estruturada.',
    9: 'Calculado pela data de nascimento (imutável). Destino 9 volta sua jornada à compaixão universal, visão ampliada e serviço coletivo.',
    11: 'Calculado pela data de nascimento (imutável). Destino 11 traz alta sensibilidade intuitiva para inspirar, orientar e despertar consciências.',
    22: 'Calculado pela data de nascimento (imutável). Destino 22 une visão elevada e execução prática para construir projetos de grande alcance.',
  },
  expressao: {
    1: 'Soma das letras do nome em uso. Expressão 1 projeta iniciativa firme, independência de ação e coragem para abrir caminhos.',
    2: 'Soma das letras do nome em uso. Expressão 2 manifesta tato, empatia ativa e habilidade natural para conciliar e unir pessoas.',
    3: 'Soma das letras do nome em uso. Expressão 3 comunica com carisma, fluidez verbal e criatividade envolvente em qualquer ambiente.',
    4: 'Soma das letras do nome em uso. Expressão 4 transmite confiabilidade, organização rigorosa e precisão na entrega de resultados.',
    5: 'Soma das letras do nome em uso. Expressão 5 irradia dinamismo, adaptabilidade rápida e magnetismo voltado à inovação.',
    6: 'Soma das letras do nome em uso. Expressão 6 expressa equilíbrio, acolhimento responsável e senso refinado de harmonia e cuidado.',
    7: 'Soma das letras do nome em uso. Expressão 7 revela mente investigativa, rigor intelectual e profundidade analítica respeitável.',
    8: 'Soma das letras do nome em uso. Expressão 8 emana autoridade executiva, pragmatismo estratégico e foco claro em prosperidade sólida.',
    9: 'Soma das letras do nome em uso. Expressão 9 projeta generosidade, tolerância e visão abrangente voltada ao impacto humano.',
    11: 'Soma das letras do nome em uso. Expressão 11 canaliza intuição aguçada e magnetismo inspirador entre o sutil e o prático.',
    22: 'Soma das letras do nome em uso. Expressão 22 traduz visão arquitetônica em realização concreta e organização de grande escala.',
  },
  motivacao: {
    1: 'Vibração das vogais do nome. Motivação 1 revela desejo íntimo de autonomia, protagonismo e liberdade para decidir o próprio rumo.',
    2: 'Vibração das vogais do nome. Motivação 2 busca paz nas relações, pertencimento genuíno e cooperação afetuosa.',
    3: 'Vibração das vogais do nome. Motivação 3 alimenta a alma pela criação artística, expressão autêntica e leveza cotidiana.',
    4: 'Vibração das vogais do nome. Motivação 4 prioriza segurança, ordem previsível e construções sólidas de longo prazo.',
    5: 'Vibração das vogais do nome. Motivação 5 move você pelo desejo constante de liberdade, variedade e descoberta de novos horizontes.',
    6: 'Vibração das vogais do nome. Motivação 6 nutre-se ao cuidar, harmonizar ambientes e proteger quem você valoriza.',
    7: 'Vibração das vogais do nome. Motivação 7 impulsiona a busca silenciosa por verdade, conhecimento profundo e coerência interior.',
    8: 'Vibração das vogais do nome. Motivação 8 direciona sua ambição interna para conquistas tangíveis, soberania e prosperidade com propósito.',
    9: 'Vibração das vogais do nome. Motivação 9 expande a alma através do desapego, da compaixão e da contribuição desinteressada.',
    11: 'Vibração das vogais do nome. Motivação 11 desperta sede intensa de propósito elevado, sintonia intuitiva e inspiração espiritual.',
    22: 'Vibração das vogais do nome. Motivação 22 canaliza o impulso de edificar obras duradouras e soluções práticas de impacto coletivo.',
  },
  missao: {
    1: 'Síntese entre Destino e Expressão. Missão 1 convoca você a inaugurar projetos com coragem individual e autonomia criativa.',
    2: 'Síntese entre Destino e Expressão. Missão 2 orienta sua vocação para mediar conflitos e sustentar pontes de colaboração duradoura.',
    3: 'Síntese entre Destino e Expressão. Missão 3 direciona seus talentos à palavra inspirada, à arte e à expansão otimista.',
    4: 'Síntese entre Destino e Expressão. Missão 4 chama você a transformar ideias em estruturas confiáveis e legados consistentes.',
    5: 'Síntese entre Destino e Expressão. Missão 5 impulsiona renovação de padrões estagnados com inteligência adaptativa e liberdade.',
    6: 'Síntese entre Destino e Expressão. Missão 6 direciona sua entrega ao equilíbrio comunitário, à justiça afetiva e ao cuidado responsável.',
    7: 'Síntese entre Destino e Expressão. Missão 7 pede aprofundamento intelectual e transmissão clara de conhecimento especializado.',
    8: 'Síntese entre Destino e Expressão. Missão 8 orienta o domínio ético dos recursos materiais para gerar prosperidade compartilhada.',
    9: 'Síntese entre Destino e Expressão. Missão 9 convida ao serviço humanitário lúcido, acolhimento amplo e conclusão sábia de ciclos.',
    11: 'Síntese entre Destino e Expressão. Missão 11 sustenta uma frequência inspiradora para iluminar decisões e despertar percepções.',
    22: 'Síntese entre Destino e Expressão. Missão 22 une visão estratégica e execução concreta para construir realizações de escala ampla.',
  },
  impressao: {
    1: 'Vibração das consoantes do nome. Impressão 1 transmite postura firme, independente e preparada para tomar a frente.',
    2: 'Vibração das consoantes do nome. Impressão 2 projeta gentileza, escuta receptiva e presença acolhedora de fácil aproximação.',
    3: 'Vibração das consoantes do nome. Impressão 3 irradia carisma imediato, simpatia articulada e energia criativa envolvente.',
    4: 'Vibração das consoantes do nome. Impressão 4 comunica solidez, seriedade profissional e confiabilidade organizada à primeira vista.',
    5: 'Vibração das consoantes do nome. Impressão 5 passa vitalidade versátil, presença ágil e abertura natural para o novo.',
    6: 'Vibração das consoantes do nome. Impressão 6 transparece equilíbrio estético, senso de cuidado e postura conciliadora.',
    7: 'Vibração das consoantes do nome. Impressão 7 projeta distinção analítica, discrição elegante e autoridade reflexiva.',
    8: 'Vibração das consoantes do nome. Impressão 8 transmite força executiva, clareza estratégica e presença de alta autoridade.',
    9: 'Vibração das consoantes do nome. Impressão 9 revela amplitude humana, generosidade serena e acolhimento sem barreiras.',
    11: 'Vibração das consoantes do nome. Impressão 11 irradia sensibilidade magnética e lucidez inspiradora desde o primeiro contato.',
    22: 'Vibração das consoantes do nome. Impressão 22 comunica capacidade monumental de planejamento e firmeza realizadora.',
  },
};

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
  const birthVisual = getScoreTierVisual(birthPanel.score);
  const activeVisual = getScoreTierVisual(activePanel.score);

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
        {STAR_DIMENSION_META.map((item) => {
          const activeVal = activePanel[item.key];
          const birthVal = birthPanel[item.key];
          const archetipo = NUMERO_VIBRACAO[activeVal];
          const changed = dual && birthVal !== activeVal;
          const meaning =
            STAR_DIMENSION_NUMBER_MEANINGS[item.key][activeVal] ?? item.fallback;

          return (
            <div key={item.key} className="space-y-1 text-left">
              <p className="font-inter font-semibold text-[#e5e2e1] text-sm leading-snug">
                {item.label}{' '}
                <span className="font-bold" style={{ color: activeVisual.text }}>
                  = {activeVal}
                </span>
                {changed && (
                  <span className="text-xs font-normal text-gray-400 ml-1.5">
                    (antes:{' '}
                    <span className="font-semibold" style={{ color: birthVisual.text }}>
                      {birthVal}
                    </span>
                    )
                  </span>
                )}
                {archetipo && (
                  <span className="text-xs font-normal text-[#bea5ff] ml-1.5">
                    · {archetipo}
                  </span>
                )}
              </p>
              <p className="nm-card-text text-gray-300">{meaning}</p>
            </div>
          );
        })}
      </div>
    </ReadingTopicCard>
  );
}

export default ChatHarmonyStarPanel;
