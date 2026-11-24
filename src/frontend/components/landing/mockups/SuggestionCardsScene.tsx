import {
  ChatBabyGoodDaysStrip,
  ChatSuggestionCard,
  ChatSuggestionSectionHeader,
} from '../../shared/chat-ui/index.js';
import { MockupSceneShell } from './MockupSceneShell.js';
import { RESULT_SCRIPTS, type ResultSuggestionExample } from './result-scripts.js';
import type { MockupDevice, MockupTheme } from './types.js';
import { useMockupTimeline, type TimelineStep } from './useMockupTimeline.js';
import './mockup-animations.css';

export interface SuggestionCardsSceneProps {
  /** Mantido por compatibilidade: a cena agora aparece solta, só com os cards. */
  device?: MockupDevice;
  theme?: MockupTheme;
  /** Alterna Social → Artístico → Bebê a cada volta da animação. */
  autoCycleThemes?: boolean;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

type FlowAction = 'card_1' | 'card_2' | 'card_3' | 'pick';

const FLOW_STEPS: ReadonlyArray<TimelineStep<FlowAction>> = [
  { at: 0, action: 'card_1' },
  { at: 650, action: 'card_2' },
  { at: 1300, action: 'card_3' },
  { at: 2600, action: 'pick' },
];

const VISIBLE: Record<FlowAction, number> = {
  card_1: 1,
  card_2: 2,
  card_3: 3,
  pick: 3,
};

const THEME_ROTATION: readonly MockupTheme[] = ['social', 'artistico', 'bebe'];

/**
 * Sugestões como no chat real: seção "Sugestões do sistema" só com os cards, na ordem que o sistema
 * gera (Principal e Maior nota em destaque). Artístico mostra 6 nomes em dois grupos
 * (próximos do seu e totalmente novos). Sem moldura de celular ou desktop.
 */
export function SuggestionCardsScene({
  device = 'both',
  theme = 'social',
  autoCycleThemes = false,
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: SuggestionCardsSceneProps) {
  const timeline = useMockupTimeline<FlowAction>({
    steps: FLOW_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });
  void device;

  const activeTheme: MockupTheme =
    autoCycleThemes && !timeline.reducedMotion
      ? THEME_ROTATION[
          (Math.max(0, THEME_ROTATION.indexOf(theme)) + timeline.cycle) % THEME_ROTATION.length
        ]!
      : theme;

  const data = RESULT_SCRIPTS[activeTheme];
  const action = timeline.currentAction ?? 'card_1';
  const visibleCount = VISIBLE[action];
  const picking = action === 'pick';

  /** No máximo 3 cards, na ordem do sistema: Principal, depois Maior nota, depois os demais. */
  const orderFor = (t: MockupTheme): ResultSuggestionExample[] => {
    const rank = (x: ResultSuggestionExample) => (x.principal ? 0 : x.maiorNota ? 1 : 2);
    return RESULT_SCRIPTS[t].suggestions
      .slice(0, 3)
      .map((x, i) => ({ x, i }))
      .sort((a, b) => rank(a.x) - rank(b.x) || a.i - b.i)
      .map(({ x }) => x);
  };

  /** Seção completa de um tema mostrando `count` cards (a mesma peça serve de "fantasma" de altura). */
  const renderSection = (t: MockupTheme, count: number, isPicking: boolean) => {
    const all = orderFor(t);
    const list = all.slice(0, count);
    const prox = list.filter((x) => x.secao === 'proximo');
    const nov = list.filter((x) => x.secao !== 'proximo');
    const babyDays =
      RESULT_SCRIPTS[t].babyGoodDays?.map((d, idx) => ({
        ...d,
        bom: isPicking ? d.bom : d.bom && idx < 3 && count >= 2,
      })) ?? [];

    const card = (item: ResultSuggestionExample, idx: number) => (
      <div key={`${t}-${item.id}`} className="nm-soft-enter">
        <ChatSuggestionCard
          card={item.card}
          selected={isPicking && Boolean(item.principal)}
          principal={item.principal}
          maiorNota={item.maiorNota}
          destaque={item.destaque}
          interactive={false}
          delayIndex={idx}
        />
      </div>
    );

    return (
      <section
        aria-label="Sugestões do sistema"
        className="w-full max-w-[560px] mx-auto rounded-2xl bg-[#161616] p-4 sm:p-5 space-y-4"
      >
        <h3 className="font-cinzel text-base sm:text-lg font-bold text-gold">
          Sugestões do sistema
          <span className="ml-2 font-inter text-xs font-medium text-chat-muted">({all.length})</span>
        </h3>

        {t === 'bebe' && babyDays.length > 0 ? <ChatBabyGoodDaysStrip dias={babyDays} /> : null}

        {t === 'artistico' ? (
          <div className="flex flex-col gap-4">
            {prox.length > 0 ? (
              <div className="flex flex-col gap-3">
                <ChatSuggestionSectionHeader
                  titulo="Nomes artísticos próximos do seu"
                  count={all.filter((x) => x.secao === 'proximo').length}
                />
                {prox.map((item, idx) => card(item, idx))}
              </div>
            ) : null}
            {nov.length > 0 ? (
              <div className="flex flex-col gap-3">
                <ChatSuggestionSectionHeader
                  titulo="Nomes totalmente novos"
                  count={all.filter((x) => x.secao !== 'proximo').length}
                />
                {nov.map((item, idx) => card(item, idx + prox.length))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">{list.map((item, idx) => card(item, idx))}</div>
        )}
      </section>
    );
  };

  // Fantasmas invisíveis (um por caminho) reservam a altura: o texto ao lado fica parado.
  const ghostThemes: MockupTheme[] = autoCycleThemes ? [...THEME_ROTATION] : [activeTheme];
  const framelessContent = (
    <div className="grid">
      {ghostThemes.map((gt) => (
        <div key={gt} className="col-start-1 row-start-1 invisible" aria-hidden="true">
          {renderSection(gt, 3, true)}
        </div>
      ))}
      <div className="col-start-1 row-start-1 self-start">
        {renderSection(activeTheme, visibleCount, picking)}
      </div>
    </div>
  );

  return (
    <MockupSceneShell
      sceneName="suggestions"
      theme={activeTheme}
      device="both"
      timeline={timeline}
      framelessContent={framelessContent}
      statusLabel={`${visibleCount} nomes em exibição`}
      showStatusPill={showStatusPill}
      className={className}
      srSummary={
        srSummary ??
        `Sugestões do tema ${activeTheme} ranqueadas pelo sistema, todas sem bloqueios, a partir de ${data.harmonized.nome} (${data.harmonized.nota}/100).`
      }
    />
  );
}

export default SuggestionCardsScene;
