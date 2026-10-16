export type ScoreVersionFlag = 'v1' | 'v3';

const DEFAULT: ScoreVersionFlag = 'v1';

/** Lê SCORE_VERSION do ambiente (v1 | v3). Padrão v1 até virada em produção. */
export function getScoreVersion(): ScoreVersionFlag {
  const raw = (typeof process !== 'undefined' ? process.env.SCORE_VERSION : undefined)?.trim().toLowerCase();
  if (raw === 'v3') return 'v3';
  return DEFAULT;
}

export function isScoreV3(): boolean {
  return getScoreVersion() === 'v3';
}
