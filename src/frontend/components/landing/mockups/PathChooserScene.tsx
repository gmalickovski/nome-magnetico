import { useMemo } from 'react';
import { DeviceFrame } from './DeviceFrame.js';
import { MOCKUP_THEMES, type MockupDevice, type MockupTheme } from './types.js';
import { useMockupTimeline, type TimelineStep } from './useMockupTimeline.js';
import './mockup-animations.css';

export type PathChooserAction = 'ready' | 'focus' | 'tap' | 'selected';

const PATH_CHOOSER_STEPS: ReadonlyArray<TimelineStep<PathChooserAction>> = [
  { at: 0, action: 'ready' },
  { at: 550, action: 'focus' },
  { at: 1050, action: 'tap' },
  { at: 1550, action: 'selected' },
];

interface PathChoiceItem {
  id: MockupTheme;
  label: string;
  description: string;
  previewTitle: string;
  previewBullets: string[];
}

const PATH_CHOICES: readonly PathChoiceItem[] = [
  {
    id: 'social',
    label: 'Harmonizar o meu nome',
    description: 'Ajustar sua assinatura no dia a dia sem bloqueios.',
    previewTitle: 'Caminho · Nome Social',
    previewBullets: ['4 Triângulos cabalísticos', 'Nota 0 a 100 + bloqueios', 'Sugestões com nota 80+'],
  },
  {
    id: 'artistico',
    label: 'Criar um nome artístico',
    description: 'Para palco, redes sociais e marca pessoal.',
    previewTitle: 'Caminho · Nome Artístico',
    previewBullets: ['Afinidade número × área', 'Nomes próximos e novos', 'Presença de palco sem bloqueios'],
  },
  {
    id: 'bebe',
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

/**
 * Cena dos 3 botões de caminho ("O que você quer fazer hoje?").
 * A cada ciclo de animação, o toque falso alterna para o próximo caminho.
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
    const found = PATH_CHOICES.findIndex((item) => item.id === theme);
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
  const activeTokens = MOCKUP_THEMES[activeChoice.id];
  const action = timeline.currentAction ?? 'ready';
  const isFocused = action === 'focus' || action === 'tap' || action === 'selected';
  const isTapping = !timeline.reducedMotion && action === 'tap';
  const isSelected = timeline.reducedMotion || action === 'selected';

  const renderChoicesStack = (compact: boolean) => (
    <div className={`flex flex-col ${compact ? 'gap-2 p-3' : 'gap-2.5 p-4'} flex-1 min-h-0 justify-center`}>
      {/* Cabeçalho mini do Jev */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="h-6 w-6 rounded-full shrink-0 transition-all duration-500"
          style={{
            backgroundImage: activeTokens.orbGradient,
            boxShadow: `0 0 12px ${activeTokens.cursorRingRgba}`,
          }}
        />
        <span className="font-cinzel text-[11px] font-bold text-[#e5e2e1]">Nome Magnético</span>
      </div>

      {/* Pergunta canônica do Jev */}
      <div className="rounded-2xl bg-[#1C1C1C] px-3.5 py-2.5 ring-1 ring-white/[0.06] text-[#e5e2e1] font-inter">
        <div
          className="font-cinzel text-[9px] font-bold uppercase tracking-[0.12em] mb-1 transition-colors duration-300"
          style={{ color: activeTokens.accentHex }}
        >
          ESCOLHA SEU CAMINHO
        </div>
        <p className={`${compact ? 'text-[11.5px]' : 'text-[13px]'} font-medium`}>
          O que você quer fazer hoje?
        </p>
      </div>

      {/* Os 3 botões de caminho */}
      <div className="flex flex-col gap-1.5 mt-1">
        {PATH_CHOICES.map((choice, idx) => {
          const isTarget = idx === activeIndex;
          const choiceTokens = MOCKUP_THEMES[choice.id];
          const selectedNow = isTarget && isSelected;
          const focusedNow = isTarget && isFocused && !selectedNow;

          return (
            <div key={choice.id} className="relative">
              <div
                className={`rounded-full transition-all duration-300 ${
                  compact ? 'px-3.5 py-2' : 'px-4 py-2.5'
                } flex items-center justify-between gap-2`}
                style={
                  selectedNow
                    ? {
                        backgroundColor: choiceTokens.selectedChipBgHex,
                        color: choiceTokens.selectedChipTextHex,
                        border: `1px solid ${choiceTokens.selectedChipBorderHex}`,
                        transform: 'scale(0.99)',
                      }
                    : focusedNow
                      ? {
                          backgroundColor: '#242228',
                          color: '#e5e2e1',
                          border: `1px solid ${choiceTokens.accentHex}`,
                        }
                      : {
                          backgroundColor: '#1C1C1C',
                          color: '#e5e2e1',
                          border: `1px solid ${choiceTokens.chipBorderRgba}`,
                        }
                }
              >
                <span className={`font-inter font-medium truncate ${compact ? 'text-[11px]' : 'text-[12.5px]'}`}>
                  {choice.label}
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: selectedNow
                      ? choiceTokens.selectedChipTextHex
                      : choiceTokens.accentHex,
                  }}
                />
              </div>

              {isTarget && isTapping ? (
                <span
                  className="absolute right-8 top-1/2 pointer-events-none z-20"
                  aria-hidden="true"
                >
                  <span
                    className="block w-8 h-8 rounded-full nm-mockup-tap-ripple"
                    style={{ border: `2px solid ${choiceTokens.cursorCoreHex}` }}
                  />
                  <span
                    className="block w-3.5 h-3.5 rounded-full nm-mockup-tap-core"
                    style={{
                      backgroundColor: choiceTokens.cursorCoreHex,
                      boxShadow: `0 0 14px ${choiceTokens.cursorRingRgba}`,
                    }}
                  />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Confirmação compacta no celular quando selecionado */}
      {compact ? (
        <div
          className={`mt-1 rounded-2xl bg-[#181818] px-3 py-2 ring-1 ring-white/[0.05] transition-all duration-500 ${
            isSelected ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-1'
          }`}
        >
          <div className="text-[10px] font-inter font-semibold" style={{ color: activeTokens.accentHex }}>
            {activeChoice.previewTitle}
          </div>
          <div className="text-[10px] font-inter text-[#a0a0a0] mt-0.5 leading-snug">
            {activeChoice.description}
          </div>
        </div>
      ) : null}
    </div>
  );

  const phoneBody = renderChoicesStack(true);

  const desktopBody = (
    <div className="flex-1 min-h-0 grid grid-cols-[1.2fr_0.9fr] gap-px bg-white/[0.03]">
      <div className="flex flex-col min-h-0 min-w-0 bg-[#131313]">{renderChoicesStack(false)}</div>

      <aside
        className={`flex flex-col justify-center gap-3 p-4 sm:p-5 bg-[#151515]/90 min-w-0 ${
          device === 'both' ? 'md:pr-16 lg:pr-20' : ''
        }`}
      >
        <span
          className="self-start rounded-full px-3 py-1 text-[10px] font-inter font-semibold uppercase tracking-[0.08em] transition-colors duration-300"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: activeTokens.accentHex,
          }}
        >
          {activeChoice.previewTitle}
        </span>

        <h4 className="font-cinzel text-base font-bold text-[#e5e2e1] leading-snug">
          {activeChoice.label}
        </h4>

        <p className="font-inter text-xs text-[#a0a0a0] leading-relaxed">
          {activeChoice.description}
        </p>

        <ul className="space-y-1.5 mt-1">
          {activeChoice.previewBullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-center gap-2 text-[11.5px] font-inter text-[#e5e2e1]/90"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: activeTokens.accentSoftHex }}
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );

  return (
    <div
      ref={timeline.containerRef}
      data-mockup-scene="path-chooser"
      data-mockup-theme={activeChoice.id}
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
        theme={activeChoice.id}
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
