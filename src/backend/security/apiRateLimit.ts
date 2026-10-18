import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { readServerEnv } from '../env/runtime';

export interface RateLimitKeyRule {
  key: string;
  limit: number;
  windowSeconds: number;
}

export type EnforceRateLimitResult =
  | { allowed: true }
  | { allowed: false; status: 429; retryAfterSeconds: number; message: string };

/**
 * Obtém o IP do cliente de forma confiável (proxies / headers Cloudflare / VPS nginx).
 */
export function getClientIp(request: Request, clientAddress?: string): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    forwardedFor ||
    clientAddress ||
    'unknown'
  );
}

/**
 * Gera hash SHA-256 seguro do IP usando o salt do servidor.
 */
export function hashClientIp(ip: string): string {
  const salt =
    readServerEnv('RATE_LIMIT_SALT') ||
    readServerEnv('SUPABASE_SERVICE_ROLE_KEY') ||
    'nome-magnetico-rate-limit';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

/**
 * Aplica rate limit por regras baseadas em chave (IP ou Usuário),
 * persistindo no Supabase (reaproveita tabela public_analysis_rate_limits).
 * Ao exceder o limite, retorna 429 com retryAfterSeconds sugerido.
 */
export async function enforceApiRateLimits(
  supabase: SupabaseClient,
  rules: RateLimitKeyRule[],
  label?: string
): Promise<EnforceRateLimitResult> {
  const now = Date.now();

  for (const rule of rules) {
    const windowStart = new Date(now - rule.windowSeconds * 1000).toISOString();

    const { count, error } = await supabase
      .from('public_analysis_rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', rule.key)
      .gte('created_at', windowStart);

    if (error) {
      console.error(`[enforceApiRateLimits] Falha ao consultar rate limit (${rule.key}):`, error.message);
      // Fail open para não bloquear usuários caso ocorra instabilidade temporária no banco
      continue;
    }

    if ((count ?? 0) >= rule.limit) {
      return {
        allowed: false,
        status: 429,
        retryAfterSeconds: rule.windowSeconds,
        message: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
      };
    }
  }

  // Registra as tentativas para cada chave aplicável
  await Promise.all(
    rules.map(async (rule) => {
      const { error: insertError } = await supabase
        .from('public_analysis_rate_limits')
        .insert({
          ip_hash: rule.key,
          nome_consultado: (label ?? rule.key).slice(0, 150),
        });

      if (insertError) {
        console.error(`[enforceApiRateLimits] Falha ao registrar hit (${rule.key}):`, insertError.message);
      }
    })
  );

  return { allowed: true };
}
