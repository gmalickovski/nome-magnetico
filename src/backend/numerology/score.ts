/**
 * Score Unificado — fonte única da verdade para todos os produtos.
 *
 * Fórmula determinística:
 *   score = 100
 *     - (bloqueios            × 15)   ← por código único de bloqueio
 *     - (ocorrenciasExtras    × 3)    ← repetições do mesmo bloqueio além da 1ª ocorrência
 *     - (debitosCarmicos      × 12)   ← TODOS os débitos penalizam (fixos + variáveis)
 *     - (tendenciasOcultas    × 2)
 *     - (licoesCarmicas       × 1)
 *     - penalidade_compat      ← 0 se total/complementar | -5 se aceitável | -15 se incompatível
 *
 * Débitos FIXOS (dia de nascimento + Destino) também penalizam o score, pois
 * refletem a realidade kármica permanente da pessoa. O score máximo atingível
 * por qualquer nome = calcularScoreTeto(debitosFixos).
 * `debitosCarmicoFixos` em ScoreParams é mantido para que a UI possa mostrar o teto.
 *
 * Para nome_empresa: compatibilidadeSecundaria (destino da empresa) aplica penalidade / 2.
 */

export interface ScoreParams {
  bloqueios: number;
  licoesCarmicas: number;
  tendenciasOcultas: number;
  /** Total de débitos kármicos (para exibição). */
  debitosCarmicos: number;
  /** Débitos que vêm APENAS de dia de nascimento e/ou Destino (imutáveis). Usado para calcular o scoreTeto. */
  debitosCarmicoFixos?: number;
  /**
   * Ocorrências extras além da primeira por código único.
   * Ex.: bloqueio 444 aparece 2× no Destino + 1× na Vida → totalOcorrencias=3, bloqueios=1, ocorrenciasExtras=2.
   * Cada ocorrência extra desconta -3 (menor que a primeira aparição, que desconta -15).
   */
  ocorrenciasExtras?: number;
  compatibilidade: 'favoravel' | 'neutro' | 'desfavoravel';
  /** Usado apenas no produto nome_empresa (destino da empresa). */
  compatibilidadeSecundaria?: 'favoravel' | 'neutro' | 'desfavoravel';
}

const COMPAT_PENALTY: Record<string, number> = {
  favoravel: 0,
  neutro: -5,
  desfavoravel: -15,
};

export function calcularScore(p: ScoreParams): number {
  let score = 100;

  score -= p.bloqueios * 15;
  score -= (p.ocorrenciasExtras ?? 0) * 3; // repetições do mesmo bloqueio no mesmo triângulo
  score -= p.debitosCarmicos * 12; // todos os débitos penalizam (fixos + variáveis)
  score -= p.tendenciasOcultas * 2;
  score -= p.licoesCarmicas * 1;
  score += COMPAT_PENALTY[p.compatibilidade] ?? -15;

  if (p.compatibilidadeSecundaria !== undefined) {
    score += Math.round((COMPAT_PENALTY[p.compatibilidadeSecundaria] ?? -15) / 2);
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Retorna o score máximo possível para uma pessoa, considerando seus
 * débitos kármicos fixos (imutáveis pela data de nascimento).
 *
 * O teto representa o melhor score que qualquer nome pode atingir para esta
 * pessoa — mesmo com o nome perfeito (sem bloqueios, sem débitos variáveis,
 * compatibilidade total), os débitos fixos já estão "embutidos" no teto.
 *
 * Exemplos:
 *   0 débitos fixos → teto = 100
 *   1 débito fixo   → teto = 88
 *   2 débitos fixos → teto = 76
 */
export function calcularScoreTeto(debitosFixos: number): number {
  return Math.max(0, 100 - debitosFixos * 12);
}
