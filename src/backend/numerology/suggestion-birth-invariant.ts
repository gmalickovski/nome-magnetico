/**
 * DEV-275 — Elegibilidade de sugestões vs. nota do nascimento (mesmo motor v3).
 * DEV-301 — Motor v4: zero bloqueio, piso 70 e sempre acima do nascimento.
 * Não altera a fórmula do score; só filtra e ordena candidatos.
 */

import { readServerEnv } from '../env/runtime';
import { SUGESTAO_CONFIG_V4 } from './score-config';

export interface CandidatoComScore {
  nomeCompleto: string;
  score: number;
}

/** Ganho mínimo configurável (pontos acima do nascimento). Default 0 = estritamente maior. */
export function getGanhoMinimoPontos(): number {
  const raw = readServerEnv('NOME_SOCIAL_GANHO_MINIMO_PONTOS');
  if (raw === undefined) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Candidato elegível quando score > nascimento + ganhoMinimo (comparação direta dos inteiros do motor). */
export function passaGanhoMinimo(
  scoreCandidato: number,
  scoreBase: number,
  ganhoMinimoPontos = getGanhoMinimoPontos(),
): boolean {
  return scoreCandidato > scoreBase + ganhoMinimoPontos;
}

export function filtrarCandidatosElegiveis<T extends CandidatoComScore>(
  candidatos: T[],
  scoreBase: number,
  ganhoMinimoPontos = getGanhoMinimoPontos(),
): T[] {
  return candidatos.filter((c) => passaGanhoMinimo(c.score, scoreBase, ganhoMinimoPontos));
}

/** Preserva a ordem de entrada; remove duplicatas por nome (primeira ocorrência vence). */
export function dedupeCandidatosEstavel<T extends CandidatoComScore>(candidatos: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const c of candidatos) {
    const key = c.nomeCompleto.trim().toLowerCase();
    if (key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/** Ordem decrescente de nota; desempate estável por nome. */
export function compararPorNotaDescEstavel<T extends CandidatoComScore>(a: T, b: T): number {
  if (a.score !== b.score) return b.score - a.score;
  return a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR');
}

export function ordenarPorNotaDescEstavel<T extends CandidatoComScore>(candidatos: T[]): T[] {
  return [...candidatos].sort(compararPorNotaDescEstavel);
}

// ── DEV-301 · Motor v4 ────────────────────────────────────────────────────────

/** Flag de rollback. `NOME_SOCIAL_MOTOR_V4=false` volta ao comportamento DEV-275. */
export function isMotorV4(): boolean {
  const raw = readServerEnv('NOME_SOCIAL_MOTOR_V4')?.toLowerCase();
  return !(raw === 'false' || raw === '0' || raw === 'off');
}

/**
 * Menor nota que uma sugestão pode ter.
 * v4: max(70, nascimento + 1 + ganho). Legado: nascimento + 1 + ganho.
 * A env de ganho só sobe o mínimo; nunca baixa o piso.
 */
export function scoreMinimoSugestao(
  scoreBase: number,
  ganhoMinimoPontos = getGanhoMinimoPontos(),
): number {
  const acimaDoNascimento = scoreBase + ganhoMinimoPontos + 1;
  return isMotorV4()
    ? Math.max(SUGESTAO_CONFIG_V4.pisoAbsoluto, acimaDoNascimento)
    : acimaDoNascimento;
}

export function passaPisoSugestao(
  scoreCandidato: number,
  scoreBase: number,
  ganhoMinimoPontos = getGanhoMinimoPontos(),
): boolean {
  return scoreCandidato >= scoreMinimoSugestao(scoreBase, ganhoMinimoPontos);
}

export interface SugestaoValidavel {
  score: number;
  temBloqueio: boolean;
}

export type MotivoNaoOfertavel =
  | 'bloqueio'
  | 'abaixo_do_nascimento'
  | 'abaixo_do_piso';

/** R1 + R2. `null` = pode ser oferecida. */
export function motivoNaoOfertavel(
  candidato: SugestaoValidavel,
  scoreBase: number,
  ganhoMinimoPontos = getGanhoMinimoPontos(),
): MotivoNaoOfertavel | null {
  if (isMotorV4() && candidato.temBloqueio) return 'bloqueio';
  if (candidato.score < scoreBase + ganhoMinimoPontos + 1) return 'abaixo_do_nascimento';
  if (!passaPisoSugestao(candidato.score, scoreBase, ganhoMinimoPontos)) return 'abaixo_do_piso';
  return null;
}

export function validarSugestaoOfertavel(
  candidato: SugestaoValidavel,
  scoreBase: number,
  ganhoMinimoPontos = getGanhoMinimoPontos(),
): { ok: boolean; motivo: MotivoNaoOfertavel | null } {
  const motivo = motivoNaoOfertavel(candidato, scoreBase, ganhoMinimoPontos);
  return { ok: motivo === null, motivo };
}

export function filtrarOfertaveis<T extends SugestaoValidavel>(
  candidatos: T[],
  scoreBase: number,
  ganhoMinimoPontos = getGanhoMinimoPontos(),
): T[] {
  return candidatos.filter((c) => motivoNaoOfertavel(c, scoreBase, ganhoMinimoPontos) === null);
}

/** Mensagem para o usuário (sem "incompatível"). */
export function mensagemNaoOfertavel(
  motivo: MotivoNaoOfertavel,
  scoreMinimo: number,
): string {
  switch (motivo) {
    case 'bloqueio':
      return 'Esta assinatura tem bloqueios nos triângulos. Escolha outra opção ou ajuste suas preferências.';
    case 'abaixo_do_nascimento':
      return 'Esta assinatura não tem nota acima da do seu nome de nascimento. Escolha outra opção ou ajuste suas preferências.';
    default:
      return `Esta assinatura fica abaixo da nota mínima de ${scoreMinimo}. Escolha outra opção ou ajuste suas preferências.`;
  }
}
