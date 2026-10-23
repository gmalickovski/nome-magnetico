/**
 * Mascara um endereço de e-mail preservando apenas o primeiro caractere
 * da parte local e o domínio completo.
 * Exemplo: guilherme@studiomlk.com.br -> g***@studiomlk.com.br
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '***';
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0) return '***';
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const head = local.length <= 1 ? local || '*' : local[0];
  return `${head}***@${domain}`;
}

/**
 * Remove ou mascara campos sensíveis/PII em um objeto de parâmetros
 * antes de salvar em logs ou tabela de auditoria.
 */
export function sanitizeAuditParameters(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('email') && typeof value === 'string') {
      result[key] = maskEmail(value);
    } else if (
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('key') ||
      lowerKey.includes('password')
    ) {
      result[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeAuditParameters(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}
