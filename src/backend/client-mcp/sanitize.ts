/**
 * Sanitização e regras de conformidade para o Client MCP (DEV-208)
 *
 * Regras Estritas:
 * 1. NUNCA expor tabelas, fórmulas ou pesos crus de cálculo (diferencial comercial).
 * 2. NUNCA expor aspectos de saúde (aspectoSaude) ou diagnósticos.
 * 3. NUNCA citar fornecedores de IA (Claude, Anthropic, Groq, OpenAI) ou Studio MLK.
 * 4. SEMPRE incluir o aviso legal padronizado do Nome Magnético.
 * 5. Substituir 'incompativel' por 'Tensão Vibracional'.
 */

export const LEGAL_DISCLAIMER =
  'Aviso Legal: O cálculo numerológico baseia-se em critérios formais e objetivos de harmonização de nomes. As interpretações têm finalidade de autoconhecimento e planejamento pessoal/profissional, não substituindo orientação médica, psicológica ou jurídica.';

export function sanitizeClientNivel(codigoOuNivel: string | null | undefined): string {
  if (!codigoOuNivel) return 'Neutro';
  const norm = codigoOuNivel.toLowerCase();
  if (norm.includes('harmonioso') || norm.includes('excelente') || norm.includes('favoravel')) {
    return 'Harmonioso';
  }
  if (norm.includes('tensao') || norm.includes('incompativel') || norm.includes('desafiador')) {
    return 'Tensão Vibracional';
  }
  return 'Neutro';
}

export function sanitizeClientCompatibilidade(compat: string | null | undefined): string {
  if (!compat) return 'Neutro';
  const norm = compat.toLowerCase();
  if (norm.includes('incompativel')) {
    return 'Tensão Vibracional';
  }
  return compat;
}

/**
 * Remove qualquer campo que contenha pesos, fórmulas, referências a saúde
 * ou nomes de provedores de IA.
 */
export function sanitizeClientOutput<T>(input: T): T {
  if (!input || typeof input !== 'object') {
    if (typeof input === 'string') {
      return input
        .replace(/incompat[ií]vel/gi, 'Tensão Vibracional')
        .replace(/anthropic|claude|groq|openai|studio\s*mlk/gi, 'Nome Magnético') as unknown as T;
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeClientOutput(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();

    // 1. Remover chaves proibidas (saúde, pesos crus, fórmulas, provedores)
    if (
      lowerKey.includes('saude') ||
      lowerKey.includes('health') ||
      lowerKey.includes('peso') ||
      lowerKey.includes('weight') ||
      lowerKey.includes('deducao') ||
      lowerKey.includes('formula') ||
      lowerKey.includes('prompt') ||
      lowerKey.includes('provider') ||
      lowerKey.includes('model') ||
      lowerKey.includes('tokens')
    ) {
      continue;
    }

    result[key] = sanitizeClientOutput(value);
  }

  return result as T;
}
