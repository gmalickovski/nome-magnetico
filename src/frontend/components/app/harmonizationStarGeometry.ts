/** Shared geometry for the double harmonization star (result page + landing mockup). */

export const HARMONY_STAR_VIEWBOX = { width: 680, height: 540 } as const;

export const HARMONY_STAR_CX = 340;
export const HARMONY_STAR_CY = 270;

export const HARMONY_STAR_OUTER_R = 160;
export const HARMONY_STAR_OUTER_INNER = 62;
export const HARMONY_STAR_INNER_R = 88;
export const HARMONY_STAR_INNER_INNER = 34;

export const HARMONY_STAR_LABEL_RADIUS = HARMONY_STAR_OUTER_R + 52;
export const HARMONY_STAR_GOLD_NUM_RADIUS = HARMONY_STAR_OUTER_R + 20;
export const HARMONY_STAR_RED_NUM_RADIUS = HARMONY_STAR_INNER_R + 18;

export const HARMONY_STAR_TIP_LABELS = [
  'Destino',
  'Expressão',
  'Motivação',
  'Missão',
  'Impressão',
] as const;

export const HARMONY_STAR_LABEL_ANCHORS = ['middle', 'start', 'start', 'end', 'end'] as const;
export const HARMONY_STAR_LABEL_DX = [0, 5, 5, -5, -5];
export const HARMONY_STAR_LABEL_DY = [-5, 0, 8, 8, 0];

export function harmonyStarPts(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a1 = ((-90 + i * 72) * Math.PI) / 180;
    pts.push(`${(cx + R * Math.cos(a1)).toFixed(1)},${(cy + R * Math.sin(a1)).toFixed(1)}`);
    const a2 = ((-90 + 36 + i * 72) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a2)).toFixed(1)},${(cy + r * Math.sin(a2)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function harmonyStarTipXY(cx: number, cy: number, radius: number, index: number) {
  const a = ((-90 + index * 72) * Math.PI) / 180;
  return {
    x: +(cx + radius * Math.cos(a)).toFixed(1),
    y: +(cy + radius * Math.sin(a)).toFixed(1),
  };
}
