/**
 * Validação da saída do escritor LLM (Leitura do momento · DEV-235).
 */

const JARGON = /\b(score|ranking)\b/i;
const FORBIDDEN = /\b(vai ganhar|garante|atr[aá]i dinheiro|resolve|sa[uú]de|doen[cç]a|cura|ansiedade|religi[aã]o|intelig[eê]ncia artificial|gpt|openai|claude|groq|mudar documento)\b/i;
const MULTIPLY = /[×x]\s*\d|\d\s*[×x]/i;
const DASH = /[—–]/;

export interface MomentReadingValidationContext {
  notaHoje: number;
  destino: number;
}

export function validateMomentReadingText(
  text: string,
  ctx: MomentReadingValidationContext
): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 280) return false;
  if (DASH.test(trimmed)) return false;
  if (MULTIPLY.test(trimmed)) return false;
  if (JARGON.test(trimmed)) return false;
  if (FORBIDDEN.test(trimmed)) return false;

  const allowed = new Set([String(ctx.notaHoje), String(ctx.destino)]);
  const numbers = trimmed.match(/\d+/g) ?? [];
  for (const n of numbers) {
    if (!allowed.has(n)) return false;
  }
  return true;
}
