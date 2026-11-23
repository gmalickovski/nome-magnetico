import { useMemo } from 'react';
import {
  ChatOptionPills,
  ChatPanelHeader,
  ChatProgressBar,
  NmBubble,
  ReadingTopicCard,
  UserBubble,
  type ChatOptionPillItem,
} from '../../shared/chat-ui/index.js';
import { DeviceFrame } from './DeviceFrame.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
import { MOCKUP_THEMES, type MockupDevice, type MockupTheme, type MockupThemeTokens } from './types.js';
import { useMockupTimeline, type TimelineStep } from './useMockupTimeline.js';
import './mockup-animations.css';

export type PathChooserAction = 'ready' | 'focus' | 'tap' | 'selected';

const PATH_CHOOSER_STEPS: ReadonlyArray<TimelineStep<PathChooserAction>> = [
  { at: 0, action: 'ready' },
  { at: 550, action: 'focus' },
  { at: 1050, action: 'tap' },
  { at: 1550, action: 'selected' },
];

interface PathChoiceItem extends ChatOptionPillItem {
  theme: MockupTheme;
  description: string;
  previewTitle: string;
  previewBullets: string[];
}

const PATH_CHOICES: readonly PathChoiceItem[] = [
  {
    id: 'dia_a_dia',
    theme: 'social',
    label: 'Harmonizar o meu nome',
    description: 'Ajustar sua assinatura no dia a dia sem bloqueios.',
    previewTitle: 'Caminho · Nome Social',
    previewBullets: ['4 Triângulos cabalísticos', 'Nota 0 a 100 + bloqueios', 'Sugestões com nota 80+'],
  },
  {
    id: 'artistico',
    theme: 'artistico',
    label: 'Criar um nome artístico',
    description: 'Para palco, redes sociais e marca pessoal.',
    previewTitle: 'Caminho · Nome Artístico',
    previewBullets: ['Afinidade número × área', 'Nomes próximos e novos', 'Presença de palco sem bloqueios'],
  },
  {
    id: 'bebe',
    theme: 'bebe',
    label: 'Escolher o nome do meu bebê',
    description: 'Cruza o sobrenome da família com a data prevista.',
    previewTitle: 'Caminho · Nome do Bebê',
    previewBullets: ['Janela possível do parto', 'Manual acolhedor para os pais', '0 bloqueios nos nomes indicados'],
  },
];

export interface PathChooserSceneProps {
  device?: MockupDevice;
  theme?: MockupTheme;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

function TapOverlay({ tokens }: { tokens: MockupThemeTokens }) {
  return (
    <span className="absolute left-1/2 top-1/2 pointer-events-none z-20" aria-hidden="true">
      <span
        className="block w-8 h-8 rounded-full nm-mockup-tap-ripple"
        style={{ border: `2px solid ${tokens.cursorCoreHex}` }}
      />
      <span
        className="block w-3.5 h-3.5 rounded-full nm-mockup-tap-core shadow-md"
        style={{
          backgroundColor: tokens.cursorCoreHex,
          boxShadow: `0 0 14px ${tokens.cursorRingRgba}`,
        }}
      />
    </span>
  );
}

/**
 * Cena dos 3 botões de caminho ("O que você quer fazer hoje?") usando as peças compartilhadas
 * reais do chat (`NmBubble`, `ChatOptionPills`, `UserBubble`, `ReadingTopicCard`).
 */
export function PathChooserScene({
  device = 'phone',
  theme = 'social',
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: PathChooserSceneProps) {
  const initialIndex = useMemo(() => {
    const found = PATH_CHOICES.findIndex((item) => item.theme === theme);
    return found >= 0 ? found : 0;
  }, [theme]);

  const timeline = useMockupTimeline<PathChooserAction>({
    steps: PATH_CHOOSER_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });

  const activeIndex = timeline.reducedMotion
    ? initialIndex
    : (initialIndex + timeline.cycle) % PATH_CHOICES.length;

  const activeChoice = PATH_CHOICES[activeIndex]!;
  const activeTokens = MOCKUP_THEMES[activeChoice.theme];
  const action = timeline.currentAction ?? 'ready';
  const isTapping = !timeline.reducedMotion && action === 'tap';
  const isSelected = timeline.reducedMotion || action === 'selected';
  const showHighlight = action === 'focus' || isTapping || isSelected;

  const renderChatPane = (showMobilePreview: boolean, includeTopBar: boolean) => (
    <div className="flex flex-col flex-1 min-h-0 bg-[#131313]">
      {includeTopBar ? (
        <ChatProgressBar
          currentStep={isSelected ? 1 : 0}
          totalSteps={4}
          className="shrink-0 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        />
      ) : null}

      <div className="flex-1 min-h-0 flex flex-col justify-center gap-2 p-4">
        <NmBubble eyebrow="PASSO 1 DE 3" wide>
          <p className="text-chat-ink leading-relaxed">O que você quer fazer hoje?</p>
          <ChatOptionPills
            options={PATH_CHOICES}
            size="lg"
            selectedIds={showHighlight ? [activeChoice.id] : []}
            className="mt-3"
            renderItemOverlay={(opt) =>
              isTapping && opt.id === activeChoice.id ? <TapOverlay tokens={activeTokens} /> : null
            }
          />
        </NmBubble>

        {isSelected ? <UserBubble content={activeChoice.label} /> : null}

        {showMobilePreview && isSelected ? (
          <ReadingTopicCard
            eyebrow={activeChoice.previewTitle}
            title={activeChoice.label}
            subtitle={activeChoice.description}
            className="mt-2"
          >
            <ul className="space-y-1.5">
              {activeChoice.previewBullets.map((b) => (
                <li key={b} className="text-xs font-inter text-[#e5e2e1]/85 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </ReadingTopicCard>
        ) : null}
      </div>
    </div>
  );

  const phoneBody = (
    <ScaledMockupCanvas logicalWidth={375}>{renderChatPane(true, true)}</ScaledMockupCanvas>
  );

  const desktopBody = (
    <ScaledMockupCanvas logicalWidth={1024}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313]">
        <ChatProgressBar
          currentStep={isSelected ? 1 : 0}
          totalSteps={4}
          className="shrink-0 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        />
        <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] gap-4 px-5">
          <div className="flex flex-col min-h-0 min-w-0">{renderChatPane(false, false)}</div>

          <aside
            className={`flex flex-col justify-center gap-4 py-4 px-3 min-w-0 ${
              device === 'both' ? 'pr-24' : ''
            }`}
          >
            <ChatPanelHeader hasSelection={isSelected} />
            <ReadingTopicCard
              eyebrow={activeChoice.previewTitle}
              title={activeChoice.label}
              subtitle={activeChoice.description}
            >
              <ul className="space-y-2">
                {activeChoice.previewBullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-2 text-sm font-inter text-[#e5e2e1]/90"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </ReadingTopicCard>
          </aside>
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  return (
    <div
      ref={timeline.containerRef}
      data-mockup-scene="path-chooser"
      data-mockup-theme={activeChoice.theme}
      data-mockup-playing={timeline.isPlaying ? 'true' : 'false'}
      data-mockup-in-view={timeline.isInView ? 'true' : 'false'}
      data-mockup-reduced-motion={timeline.reducedMotion ? 'true' : 'false'}
      className={`relative w-full min-w-0 ${className}`}
    >
      {showStatusPill ? (
        <div className="mb-2 flex flex-wrap items-center justify-end gap-2 text-[11px] font-inter text-[#a0a0a0]">
          <span className="rounded-full bg-[#1C1C1C] px-2.5 py-0.5 ring-1 ring-white/[0.08]">
            {timeline.reducedMotion
              ? `Reduced motion · ${activeChoice.label}`
              : timeline.isPlaying
                ? `Ciclo ${timeline.cycle + 1} · ${activeChoice.label}`
                : 'Pausado fora da tela'}
          </span>
        </div>
      ) : null}

      <DeviceFrame
        variant={device}
        theme={activeChoice.theme}
        phoneContent={phoneBody}
        desktopContent={desktopBody}
        srSummary={
          srSummary ??
          'Prévia dos três caminhos disponíveis no chat: Harmonizar o meu nome, Criar um nome artístico e Escolher o nome do meu bebê.'
        }
      />
    </div>
  );
}

export default PathChooserScene;
