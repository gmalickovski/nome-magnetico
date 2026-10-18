import { readServerEnv } from '../env/runtime';

export type ScoreVersionFlag = 'v1' | 'v3';

const DEFAULT: ScoreVersionFlag = 'v3';

/** Lê SCORE_VERSION do ambiente (v1 | v3). Padrão v3; só volta para v1 com rollback explícito. */
export function getScoreVersion(): ScoreVersionFlag {
  const raw = readServerEnv('SCORE_VERSION')?.toLowerCase();
  if (raw === 'v1') return 'v1';
  return DEFAULT;
}

export function isScoreV3(): boolean {
  return getScoreVersion() === 'v3';
}
