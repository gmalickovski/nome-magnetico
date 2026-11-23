import {
  ChatBabyGoodDaysStrip,
  ChatPanelHeader,
  ChatScorePanelCard,
  ChatSuggestionCard,
  ChatSuggestionSectionHeader,
} from '../../shared/chat-ui/index.js';
import { MockupSceneShell } from './MockupSceneShell.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
import {
  RESULT_SCRIPTS,
  SUGGESTION_CARDS_STEPS,
  type SuggestionCardsAction,
} from './result-scripts.js';
import type { MockupDevice, MockupTheme } from './types.js';
import { useMockupTimeline } from './useMockupTimeline.js';
import './mockup-animations.css';

export interface SuggestionCardsSceneProps {
  device?: MockupDevice;
  theme?: MockupTheme;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

const STEP_VISIBLE_COUNT: Record<SuggestionCardsAction, number> = {
  intro: 0,
  card_1: 1,
  card_2: 2,
  card_3: 3,
  days_or_focus: 3,
  complete: 3,
};

/**
 * Cena dos cards de sugestão entrando um a um usando `ChatSuggestionCard`,
 * `ChatSuggestionSectionHeader` (Artístico: Próximos × Novos) e `ChatBabyGoodDaysStrip` (Bebê).
 */
export function SuggestionCardsScene({
  device = 'both',
  theme = 'social',
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: SuggestionCardsSceneProps) {
  const data = RESULT_SCRIPTS[theme];
  const timeline = useMockupTimeline<SuggestionCardsAction>({
    steps: SUGGESTION_CARDS_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });

  const action = timeline.currentAction ?? 'intro';
  const visibleCount = STEP_VISIBLE_COUNT[action];
  const highlightMain = action === 'days_or_focus' || action === 'complete';

  const visibleBabyDays =
    data.babyGoodDays?.map((d, idx) => ({
      ...d,
      bom:
        action === 'complete'
          ? d.bom
          : action === 'days_or_focus'
            ? d.bom && idx < 3
            : false,
    })) ?? [];

  const renderSuggestionsList = (limit: number) => {
    const items = data.suggestions.slice(0, Math.min(limit, visibleCount));
    const proximos = items.filter((s) => s.secao === 'proximo');
    const novos = items.filter((s) => s.secao === 'novo');
    const hasArtisticSections = theme === 'artistico' && (proximos.length > 0 || novos.length > 0);

    if (items.length === 0) {
      return (
        <div className="rounded-2xl bg-[#181818] p-4 space-y-2 border border-white/[0.06]">
          <div className="h-3 w-32 rounded-full bg-white/10" />
          <div className="h-2.5 w-48 rounded-full bg-white/[0.06]" />
        </div>
      );
    }

    if (hasArtisticSections) {
      return (
        <div className="space-y-3">
          {proximos.length > 0 ? (
            <div className="flex flex-col gap-2">
              <ChatSuggestionSectionHeader
                titulo="Nomes artísticos próximos do seu"
                count={proximos.length}
              />
              {proximos.map((item, idx) => (
                <div key={item.id} className="nm-mockup-enter">
                  <ChatSuggestionCard
                    card={item.card}
                    selected={false}
                    principal={item.principal}
                    maiorNota={item.maiorNota}
                    interactive={false}
                    delayIndex={idx}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {novos.length > 0 ? (
            <div className="flex flex-col gap-2">
              <ChatSuggestionSectionHeader
                titulo="Nomes totalmente novos"
                count={novos.length}
              />
              {novos.map((item, idx) => (
                <div key={item.id} className="nm-mockup-enter">
                  <ChatSuggestionCard
                    card={item.card}
                    selected={highlightMain && Boolean(item.principal)}
                    principal={item.principal}
                    maiorNota={item.maiorNota}
                    destaque={limit <= 2 ? undefined : item.destaque}
                    interactive={false}
                    delayIndex={idx + proximos.length}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        {items.map((item, idx) => (
          <div key={item.id} className="nm-mockup-enter">
            <ChatSuggestionCard
              card={item.card}
              selected={highlightMain && Boolean(item.principal)}
              principal={item.principal}
              maiorNota={item.maiorNota}
              destaque={limit <= 2 ? undefined : item.destaque}
              interactive={false}
              delayIndex={idx}
            />
          </div>
        ))}
      </div>
    );
  };

  const phoneContent = (
    <ScaledMockupCanvas logicalWidth={375}>
      <div className="flex flex-col flex-1 min-h-0 justify-between bg-[#131313] p-4 gap-3 overflow-hidden">
        <div className="space-y-2.5">
          <div className="nm-score-eyebrow">Sugestões sem bloqueios</div>
          <p className="text-xs font-inter text-[#e5e2e1]/85 leading-snug">
            {data.suggestionsIntro}
          </p>
        </div>

        <div className="flex-1 min-h-0 flex flex-col justify-center gap-2.5">
          {renderSuggestionsList(theme === 'bebe' ? 2 : 3)}
          {theme === 'bebe' && visibleBabyDays.length > 0 ? (
            <ChatBabyGoodDaysStrip dias={visibleBabyDays} />
          ) : null}
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  const desktopContent = (
    <ScaledMockupCanvas logicalWidth={1220}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313] px-6 py-4">
        <div
          className={`flex-1 min-h-0 grid grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] gap-6 items-center ${
            device === 'both' ? 'pr-24' : ''
          }`}
        >
          <div className="rounded-2xl bg-[#161616] p-4 space-y-3 min-w-0">
            {renderSuggestionsList(3)}
          </div>

          <aside className="flex flex-col gap-3.5 min-w-0">
            <ChatPanelHeader title="Escolha Principal" hasSelection={highlightMain} />
            <ChatScorePanelCard
              birth={{ nome: data.birth.nome, score: data.birth.nota }}
              harmonized={
                visibleCount > 0
                  ? { nome: data.harmonized.nome, score: data.harmonized.nota }
                  : null
              }
            />
            {theme === 'bebe' && visibleBabyDays.length > 0 ? (
              <ChatBabyGoodDaysStrip dias={visibleBabyDays} />
            ) : data.affinityHighlight ? (
              <div className="nm-floating-card p-3.5 space-y-1.5">
                <p className="text-[11px] font-inter uppercase tracking-wider text-[#d7c6ff]">
                  {data.affinityHighlight.titulo}
                </p>
                <p className="text-xs text-[#e5e2e1]/85 leading-relaxed">
                  {data.affinityHighlight.detalhe}
                </p>
              </div>
            ) : (
              <div className="nm-floating-card p-3.5 space-y-1.5">
                <p className="text-[11px] font-inter uppercase tracking-wider text-[#f2ca50]">
                  Filtro de qualidade aplicado
                </p>
                <p className="text-xs text-[#e5e2e1]/85 leading-relaxed">
                  Todas as opções exibidas passaram pela regra de 0 bloqueios e nota acima de 80.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  return (
    <MockupSceneShell
      sceneName="suggestions"
      theme={theme}
      device={device}
      timeline={timeline}
      phoneContent={phoneContent}
      desktopContent={desktopContent}
      statusLabel={`${visibleCount} nomes em exibição · passo ${timeline.stepIndex + 1}/6`}
      showStatusPill={showStatusPill}
      className={className}
      srSummary={
        srSummary ??
        `Cards de sugestão do tema ${theme} exibindo até três nomes sem bloqueios a partir de ${data.harmonized.nome} (${data.harmonized.nota}/100).`
      }
    />
  );
}

export default SuggestionCardsScene;
