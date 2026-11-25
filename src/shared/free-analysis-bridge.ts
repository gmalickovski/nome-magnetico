/**
 * Ponte da análise gratuita para a harmonização (DEV-343).
 *
 * Regra de produto: a análise grátis é um documento útil por si só, só com o nome de nascimento.
 * O incentivo é a distância entre a nota de hoje e a nota que o nome pode alcançar. Sem prévia
 * borrada de sugestões. Nada aqui recebe nem devolve nome, data ou e-mail (sem PII em URL ou evento).
 */

/** Nota a partir da qual o nome já é considerado em boa harmonia (ninguém acima disso comprou). */
export const NOTA_ALTA = 70;

/** Caminho do chat para harmonizar o nome. Quem não tem sessão passa pelo login e volta para cá. */
export const CHAT_HARMONIZAR_PATH = '/app/analise/nome-social?caminho=dia_a_dia';

export type NotaBucket = 'baixa' | 'media' | 'alta';

/** Pontos que separam a nota de hoje da nota que o nome pode alcançar. 0 quando não há ganho. */
export function ganhoEmPontos(score: number, potencialMax: number | null | undefined): number {
  if (!Number.isFinite(score) || potencialMax == null || !Number.isFinite(potencialMax)) return 0;
  return Math.max(0, Math.round(potencialMax - score));
}

export function notaBucket(score: number): NotaBucket {
  if (score >= NOTA_ALTA) return 'alta';
  if (score >= 40) return 'media';
  return 'baixa';
}

export function ehNotaAlta(score: number): boolean {
  return score >= NOTA_ALTA;
}

/** "29 pontos" / "1 ponto". */
export function textoPontos(pontos: number): string {
  return `${pontos} ${pontos === 1 ? 'ponto' : 'pontos'}`;
}

/** Link do CTA para o chat, com origem para medir no PostHog. Sem dados pessoais. */
export function buildChatCtaHref(from: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ from, ...extra });
  return `${CHAT_HARMONIZAR_PATH}&${params.toString()}`;
}
