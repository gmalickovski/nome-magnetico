/**
 * Validação de copy com afirmações numerológicas — só números/códigos do motor.
 */

export interface MotorReadingFacts {
  /** Strings numéricas permitidas no texto (ex.: "66", "8", "95"). */
  allowedNumbers: string[];
  /** Códigos de bloqueio reais (ex.: "444"). */
  allowedBloqueioCodes: string[];
}

export function buildMotorReadingFacts(params: {
  destino?: number;
  expressao?: number;
  motivacao?: number;
  missao?: number;
  impressao?: number;
  notaHoje?: number;
  notaEscolhida?: number;
  potencial?: number;
  bloqueiosCodigos?: string[];
  /** Contagens derivadas do motor (ex.: bloqueios eliminados). */
  extraNumbers?: number[];
}): MotorReadingFacts {
  const nums = new Set<string>();
  for (const n of [
    params.destino,
    params.expressao,
    params.motivacao,
    params.missao,
    params.impressao,
    params.notaHoje,
    params.notaEscolhida,
    params.potencial,
    ...(params.extraNumbers ?? []),
  ]) {
    if (typeof n === 'number' && !Number.isNaN(n)) nums.add(String(n));
  }
  return {
    allowedNumbers: [...nums],
    allowedBloqueioCodes: [...new Set(params.bloqueiosCodigos ?? [])],
  };
}

const SEQ_INVENTADA = /\b(?:sequência|sequencia|bloqueio|triângulo|triangulo)\s*(?:da vida|de)?\s*\d{3}\b/i;
const BLOQUEIO_3DIG = /\b[1-9]{3}\b/g;

/**
 * Rejeita números ou códigos de bloqueio que não estejam na whitelist do motor.
 */
export function validateTextAgainstMotorFacts(text: string, facts: MotorReadingFacts): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const allowedNum = new Set(facts.allowedNumbers);
  const allowedBloc = new Set(facts.allowedBloqueioCodes);

  const numbers = trimmed.match(/\d+/g) ?? [];
  for (const n of numbers) {
    if (!allowedNum.has(n)) return false;
  }

  const triplets = trimmed.match(BLOQUEIO_3DIG) ?? [];
  for (const code of triplets) {
    if (code.length === 3 && !allowedBloc.has(code) && !allowedNum.has(code)) {
      return false;
    }
  }

  if (SEQ_INVENTADA.test(trimmed)) {
    const codesInText = trimmed.match(BLOQUEIO_3DIG) ?? [];
    if (codesInText.some((c) => !allowedBloc.has(c))) return false;
  }

  return true;
}
