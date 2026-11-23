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
  | 'names_shown'
  | 'star_finale';

/**
 * Linha do tempo CSS-free da cena do Hero da Home (`DEV-338`):
 * escolha do caminho -> 2 perguntas rápidas -> 3 nomes sugeridos -> estrela comparativa final.
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
  { at: 7150, action: 'names_shown' },
  { at: 9000, action: 'star_finale' },
];
