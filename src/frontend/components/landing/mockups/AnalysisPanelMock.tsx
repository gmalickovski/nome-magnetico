import { ChatPanelHeader, ChatScorePanelCard } from '../../shared/chat-ui/index.js';
import { ChatHarmonyStarPanel } from '../../app/chat/ChatHarmonyStarPanel.js';
import type { ResultPanelData } from '../../app/chat/chat-types.js';
import { ReadingTopicCard } from '../../shared/chat-ui/ReadingTopicCard.js';
import {
  ARCHETYPE_SUMMARIES,
  getArchetypeSummaryByExpressao,
} from '../../../../shared/archetype-summary.js';
import { RESULT_SCRIPTS } from './result-scripts.js';
import type { MockupTheme } from './types.js';

/** Monta o `ResultPanelData` real do chat a partir de um exemplo da landing (dados fictícios). */
function toPanelData(
  nome: string,
  score: number,
  starNums: readonly number[],
  bloqueiosCount: number,
): ResultPanelData {
  const [destino, expressao, motivacao, missao, impressao] = starNums as [
    number,
    number,
    number,
    number,
    number,
  ];
  return {
    nome,
    score,
    destino,
    expressao,
    motivacao,
    missao,
    impressao,
    potencial: score,
    bloqueiosCount,
    bloqueios: [],
    trianguloVida: { topo: 0, base: [] },
    arquetipo: ARCHETYPE_SUMMARIES[expressao] ?? getArchetypeSummaryByExpressao(expressao),
  };
}

export function buildMockPanels(theme: MockupTheme) {
  const data = RESULT_SCRIPTS[theme];
  return {
    birth: toPanelData(data.birth.nome, data.birth.nota, data.birth.starNums, 2),
    harmonized: toPanelData(data.harmonized.nome, data.harmonized.nota, data.harmonized.starNums, 0),
  };
}

/**
 * Conteúdo do Painel de Análise com as mesmas peças do sistema:
 * card de notas, Estrela Cabalística (com os 5 números explicados) e Arquétipo Vibracional.
 */
export function AnalysisPanelContent({
  theme = 'social',
  showArchetype = true,
  dual = true,
}: {
  theme?: MockupTheme;
  showArchetype?: boolean;
  /** false: só o nome de nascimento (antes de escolher uma sugestão). */
  dual?: boolean;
}) {
  const { birth, harmonized } = buildMockPanels(theme);
  const active = dual ? harmonized : birth;
  const arq = active.arquetipo;

  return (
    <div className="flex flex-col gap-4 text-left">
      <ChatScorePanelCard
        birth={{ nome: birth.nome, score: birth.score }}
        harmonized={dual ? { nome: harmonized.nome, score: harmonized.score } : null}
      />

      <ChatHarmonyStarPanel
        birthPanel={birth}
        harmonizedPanel={dual ? harmonized : null}
        isSuggestion={dual}
      />

      {showArchetype && arq ? (
        <ReadingTopicCard
          eyebrow="Arquétipo Vibracional"
          title={arq.nome}
          subtitle={`${active.nome} · Expressão ${active.expressao}${arq.sombra ? ` · Sombra: ${arq.sombra}` : ''}`}
        >
          <p className="nm-card-text text-gray-300">{arq.essencia}</p>
        </ReadingTopicCard>
      ) : null}
    </div>
  );
}

/** Folha de baixo do celular: puxador, X e título "Painel de análise", igual ao sistema. */
export function AnalysisPanelSheet({ theme = 'social' }: { theme?: MockupTheme }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative flex flex-col h-[92%] rounded-t-2xl bg-[#1C1C1C] text-[#E5E2E1] overflow-hidden nm-mockup-enter">
        <div className="relative h-11 w-full shrink-0">
          <div className="flex h-full w-full items-center justify-center">
            <span className="rounded-full bg-[#A0A0A0]/60" style={{ width: 36, height: 4 }} />
          </div>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e5e2e1]/80 text-lg leading-none">
            ×
          </span>
        </div>
        <div className="shrink-0 border-b border-white/[0.06] px-4 pb-3">
          <h2 className="font-cinzel text-base font-bold uppercase tracking-[0.12em] text-[#e5e2e1] text-center">
            Painel de análise
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
          <AnalysisPanelContent theme={theme} />
        </div>
      </div>
    </div>
  );
}

/**
 * Painel de análise lateral do desktop, idêntico em todos os mockups:
 * título "Painel de análise" + os mesmos blocos do sistema, na mesma posição.
 */
export function AnalysisPanelAside({
  theme = 'social',
  dual = false,
  reserveRight = false,
}: {
  theme?: MockupTheme;
  dual?: boolean;
  /** Reserva espaço quando o celular fica sobreposto à direita (modo `both`). */
  reserveRight?: boolean;
}) {
  return (
    <aside
      className={`flex flex-col justify-start gap-3 py-3 pl-3 pr-4 bg-[#131313]/95 min-h-0 min-w-0 overflow-hidden ${
        reserveRight ? '!pr-52' : ''
      }`}
    >
      <ChatPanelHeader hasSelection={dual} />
      <AnalysisPanelContent theme={theme} dual={dual} />
    </aside>
  );
}
