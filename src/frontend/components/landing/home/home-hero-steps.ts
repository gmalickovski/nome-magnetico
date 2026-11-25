import type { TimelineStep } from '../mockups/mockup-timeline-core.js';

export type HomeHeroAction =
  | 'path_shown'
  | 'path_tap'
  | 'path_answered'
  | 'q1_typing'
  | 'q1_shown'
  | 'q1_tap'
  | 'q1_answered'
  | 'q2_typing'
  | 'q2_shown'
  | 'q2_tap'
  | 'q2_answered'
  | 'q3_typing'
  | 'q3_shown'
  | 'q3_tap'
  | 'q3_answered'
  | 'q4_typing'
  | 'q4_shown'
  | 'q4_tap'
  | 'q4_answered'
  | 'wrap_typing'
  | 'star_finale';

/**
 * Linha do tempo da cena do Hero da Home:
 * escolha do caminho -> 4 perguntas (o chat enche o desktop, como no sistema) ->
 * abre o Painel de análise (folha de baixo no celular) -> reinicia.
 */
export const HOME_HERO_STEPS: ReadonlyArray<TimelineStep<HomeHeroAction>> = [
  { at: 0, action: 'path_shown' },
  { at: 850, action: 'path_tap' },
  { at: 1500, action: 'path_answered' },
  { at: 2050, action: 'q1_typing' },
  { at: 2650, action: 'q1_shown' },
  { at: 3350, action: 'q1_tap' },
  { at: 4000, action: 'q1_answered' },
  { at: 4500, action: 'q2_typing' },
  { at: 5100, action: 'q2_shown' },
  { at: 5800, action: 'q2_tap' },
  { at: 6450, action: 'q2_answered' },
  { at: 6950, action: 'q3_typing' },
  { at: 7550, action: 'q3_shown' },
  { at: 8250, action: 'q3_tap' },
  { at: 8900, action: 'q3_answered' },
  { at: 9400, action: 'q4_typing' },
  { at: 10000, action: 'q4_shown' },
  { at: 10700, action: 'q4_tap' },
  { at: 11350, action: 'q4_answered' },
  { at: 11850, action: 'wrap_typing' },
  { at: 13000, action: 'star_finale' },
];
