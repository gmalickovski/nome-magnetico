/**
 * Radar pentagonal do motor (5 eixos) — valores 0–100 derivados do score v3 já calculado.
 * Não altera fórmulas do motor; só normaliza para exibição.
 */

import { avaliarNome } from '../../backend/numerology/score';
import { calcularCincoNumeros } from '../../backend/numerology/numbers';
import { SCORE_CONFIG_V3 } from '../../backend/numerology/score-config';
import type { ReflexoSequencia } from '../../backend/numerology/score';

export type MotorRadarKey =
  | 'expressao'
  | 'motivacao'
  | 'destino'
  | 'harmonia_triangulo'
  | 'sequencias';

export const MOTOR_RADAR_AXIS_ORDER: MotorRadarKey[] = [
  'expressao',
  'motivacao',
  'destino',
  'harmonia_triangulo',
  'sequencias',
];

export const MOTOR_RADAR_LABELS: Record<MotorRadarKey, string> = {
  expressao: 'Expressão',
  motivacao: 'Motivação',
  destino: 'Destino',
  harmonia_triangulo: 'Harmonia do Triângulo',
  sequencias: 'Sequências',
};

export interface MotorRadarAxis {
  key: MotorRadarKey;
  label: string;
  /** 0–100 para leitura humana / testes */
  valuePercent: number;
  /** 0–1 para SVG */
  value: number;
}

/** Converte número cabalístico principal (1–9 / 11 / 22) em 0–100 (só exibição). */
export function cabalisticNumberToPercent(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n === 11 || n === 22) return 100;
  let v = Math.abs(Math.trunc(n));
  while (v > 9) {
    v = String(v)
      .split('')
      .reduce((sum, digit) => sum + Number(digit), 0);
    if (v === 11 || v === 22) return 100;
  }
  return Math.round((v / 9) * 100);
}

function pontosCategoriaSequencias(descontos: { categoria: string; codigo: string; pontos: number }[]): number {
  const bruto = descontos
    .filter((d) => d.categoria === 'sequencias_vida' && d.codigo !== 'TETO')
    .reduce((s, d) => s + d.pontos, 0);
  return Math.min(bruto, SCORE_CONFIG_V3.sequenciasVida.tetoCategoria);
}

function pontosCompatibilidade(descontos: { categoria: string; pontos: number }[]): number {
  return descontos
    .filter((d) => d.categoria === 'compatibilidade')
    .reduce((s, d) => s + d.pontos, 0);
}

/** Reflexos (triângulos pessoal/social/destino) → 0–100; 100 = sem sequências reflexas. */
export function harmoniaTrianguloFromReflexos(reflexos: ReflexoSequencia[]): number {
  if (reflexos.length === 0) return 100;
  const cfg = SCORE_CONFIG_V3.sequenciasVida;
  let bruto = 0;
  for (const r of reflexos) {
    const extras = Math.min(
      cfg.maxExtraPorCodigo,
      Math.max(0, r.linhasComSequencia - 1) * cfg.porLinhaExtraMesmoCodigo
    );
    bruto += cfg.porCodigoDistinto + extras;
  }
  const teto = cfg.tetoCategoria;
  const aplicados = Math.min(bruto, teto);
  return Math.round(100 - (aplicados / teto) * 100);
}

function descontoToPercent(pontos: number, teto: number): number {
  if (teto <= 0) return 100;
  return Math.round(100 - (Math.min(pontos, teto) / teto) * 100);
}

export function computeMotorRadarAxes(nomeCompleto: string, dataNascimento: string): MotorRadarAxis[] {
  const nome = nomeCompleto.trim();
  const avaliacao = avaliarNome(nome, dataNascimento);
  const cinco = calcularCincoNumeros(nome, dataNascimento);

  const seqPontos = pontosCategoriaSequencias(avaliacao.descontos);
  const compatPontos = pontosCompatibilidade(avaliacao.descontos);

  const expressaoPct = cabalisticNumberToPercent(cinco.expressao ?? 0);
  const motivacaoPct = cabalisticNumberToPercent(cinco.motivacao ?? 0);
  const destinoPct = cabalisticNumberToPercent(cinco.destino ?? 0);
  const sequenciasPct = descontoToPercent(seqPontos, SCORE_CONFIG_V3.sequenciasVida.tetoCategoria);

  // Harmonia: reflexos nos triângulos secundários + componente Expressão×Destino (já no score).
  const reflexoPct = harmoniaTrianguloFromReflexos(avaliacao.reflexos);
  const compatPct = descontoToPercent(compatPontos, SCORE_CONFIG_V3.compatibilidade.tetoCategoria);
  const harmoniaPct = Math.round(reflexoPct * 0.65 + compatPct * 0.35);

  const entries: Array<[MotorRadarKey, number]> = [
    ['expressao', expressaoPct],
    ['motivacao', motivacaoPct],
    ['destino', destinoPct],
    ['harmonia_triangulo', harmoniaPct],
    ['sequencias', sequenciasPct],
  ];

  return entries.map(([key, valuePercent]) => ({
    key,
    label: MOTOR_RADAR_LABELS[key],
    valuePercent: Math.max(0, Math.min(100, valuePercent)),
    value: Math.max(0, Math.min(1, valuePercent / 100)),
  }));
}

export function motorRadarToRecord(axes: MotorRadarAxis[]): Record<MotorRadarKey, number> {
  return Object.fromEntries(axes.map((a) => [a.key, a.value])) as Record<MotorRadarKey, number>;
}
