export interface ScoreTierVisual {
  code: 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
  label: string;
  stroke: string;
  text: string;
  fill: string;
  dotBg: string;
  badgeClass: string;
  barGradient: string;
}

export function getScoreTierVisual(score: number): ScoreTierVisual {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 85) {
    return {
      code: 'N5',
      label: 'Harmonioso',
      stroke: '#10B981',
      text: '#34D399',
      fill: 'rgba(16, 185, 129, 0.12)',
      dotBg: 'rgba(16, 185, 129, 0.25)',
      badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      barGradient: 'from-emerald-500 to-emerald-400',
    };
  }
  if (s >= 70) {
    return {
      code: 'N4',
      label: 'Favorável',
      stroke: '#84CC16',
      text: '#A3E635',
      fill: 'rgba(132, 204, 22, 0.12)',
      dotBg: 'rgba(132, 204, 22, 0.25)',
      badgeClass: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
      barGradient: 'from-lime-500 to-lime-400',
    };
  }
  if (s >= 50) {
    return {
      code: 'N3',
      label: 'Equilíbrio Parcial',
      stroke: '#EAB308',
      text: '#FACC15',
      fill: 'rgba(234, 179, 8, 0.12)',
      dotBg: 'rgba(234, 179, 8, 0.25)',
      badgeClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      barGradient: 'from-yellow-500 to-yellow-400',
    };
  }
  if (s >= 30) {
    return {
      code: 'N2',
      label: 'Pede Atenção',
      stroke: '#F97316',
      text: '#FB923C',
      fill: 'rgba(249, 115, 22, 0.12)',
      dotBg: 'rgba(249, 115, 22, 0.25)',
      badgeClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      barGradient: 'from-orange-600 to-orange-400',
    };
  }
  return {
    code: 'N1',
    label: 'Em Tensão',
    stroke: '#EF4444',
    text: '#F87171',
    fill: 'rgba(239, 68, 68, 0.12)',
    dotBg: 'rgba(239, 68, 68, 0.25)',
    badgeClass: 'bg-red-500/10 border-red-500/30 text-red-400',
    barGradient: 'from-red-600 to-red-500',
  };
}
