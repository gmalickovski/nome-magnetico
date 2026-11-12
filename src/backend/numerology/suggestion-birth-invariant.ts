/**
 * DEV-275 — Elegibilidade de sugestões vs. nota do nascimento (mesmo motor v3).
 * Não altera a fórmula do score; só filtra e ordena candidatos.
 */

export interface CandidatoComScore {
  nomeCompleto: string;
  score: number;
}

/** Ganho mínimo configurável (pontos acima do nascimento). Default 0 = estritamente maior. */
export function getGanhoMinimoPontos(): number {
  const raw = process.env.NOME_SOCIAL_GANHO_MINIMO_PONTOS;
  if (raw === undefined || raw.trim() === '') return 0;
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
