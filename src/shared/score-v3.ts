/**
 * Definições compartilhadas do cálculo de Nível e Score v3 para Frontend e Backend.
 * Compatível com TypeScript e sem importações proibidas de backend em React islands.
 */

export type NivelCodigo = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

export interface NivelInfo {
  codigo: NivelCodigo;
  rotulo: string;
  min: number;
  max: number;
  descricao: string;
  corTexto: string;
  corBarra: string;
  corBg: string;
}

export const NIVEIS_SCORE_V3: Record<NivelCodigo, NivelInfo> = {
  N5: {
    codigo: 'N5',
    rotulo: 'Harmonioso',
    min: 85,
    max: 100,
    descricao: 'Vibração altamente favorável e integrada, com fluxo magnético aberto e ausência de bloqueios primários.',
    corTexto: 'text-emerald-400',
    corBarra: 'from-emerald-500 to-emerald-400',
    corBg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  N4: {
    codigo: 'N4',
    rotulo: 'Favorável',
    min: 70,
    max: 84,
    descricao: 'Boa vibração geral com fluxo positivo predominante sobre tensões menores.',
    corTexto: 'text-lime-400',
    corBarra: 'from-lime-500 to-lime-400',
    corBg: 'bg-lime-500/10 border-lime-500/30',
  },
  N3: {
    codigo: 'N3',
    rotulo: 'Equilíbrio Parcial',
    min: 50,
    max: 69,
    descricao: 'Padrão funcional com equilíbrio intermediário, onde pontos de atenção e oportunidades de harmonização convivem.',
    corTexto: 'text-yellow-400',
    corBarra: 'from-yellow-500 to-yellow-400',
    corBg: 'bg-yellow-500/10 border-yellow-500/30',
  },
  N2: {
    codigo: 'N2',
    rotulo: 'Pede Atenção',
    min: 30,
    max: 49,
    descricao: 'Presença de resistências ou sequências no nome que demandam cuidado e reorganização vibracional.',
    corTexto: 'text-orange-400',
    corBarra: 'from-orange-500 to-orange-400',
    corBg: 'bg-orange-500/10 border-orange-500/30',
  },
  N1: {
    codigo: 'N1',
    rotulo: 'Em Tensão',
    min: 0,
    max: 29,
    descricao: 'Densidade vibracional acentuada com bloqueios ativos que geram forte resistência no campo magnético.',
    corTexto: 'text-red-400',
    corBarra: 'from-red-600 to-red-500',
    corBg: 'bg-red-500/10 border-red-500/30',
  },
};

export function obterNivelV3(score: number): NivelInfo {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped >= 85) return NIVEIS_SCORE_V3.N5;
  if (clamped >= 70) return NIVEIS_SCORE_V3.N4;
  if (clamped >= 50) return NIVEIS_SCORE_V3.N3;
  if (clamped >= 30) return NIVEIS_SCORE_V3.N2;
  return NIVEIS_SCORE_V3.N1;
}

export function getScoreV3Level(score: number): NivelCodigo {
  return obterNivelV3(score).codigo;
}

export function getScoreV3LevelBadgeClass(nivel: NivelCodigo): string {
  return NIVEIS_SCORE_V3[nivel]?.corBg ?? 'bg-white/10 text-white border-white/20';
}

export function getScoreV3LevelDescription(nivel: NivelCodigo): string {
  return NIVEIS_SCORE_V3[nivel]?.rotulo ?? '';
}

export function formatScoreV3Points(points: number): string {
  return points > 0 ? `-${points}` : `${points}`;
}

export const SCORE_CONFIG_V3 = Object.freeze({
  versao: '3.0.0',
  piso: 5,
  base: 100,
  sequenciasVida: Object.freeze({
    pontosPorCodigo: 15,
    pontosPorLinhaExtra: 2,
    teto: 45,
  }),
  compatibilidade: Object.freeze({
    descontoTensaoVibracional: 18,
    descontoNeutro: 6,
    teto: 18,
  }),
  debitos: Object.freeze({
    descontoPorOrigem: 8,
    descontoAcentuada: 4,
    teto: 20,
  }),
  tendenciasOcultas: Object.freeze({
    pontosPorTendencia: 3,
    teto: 9,
  }),
  licoesCarmicas: Object.freeze({
    pontosPorLicao: 2,
    teto: 8,
  }),
});

export function isAnaliseV3(analysis: { score_version?: string | null } | null | undefined): boolean {
  return analysis?.score_version === 'v3';
}
