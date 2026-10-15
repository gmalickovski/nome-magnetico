import type { SupabaseClient } from '@supabase/supabase-js';
import { RATE_LIMIT_DAILY, RATE_LIMIT_HOURLY, RATE_LIMIT_MESSAGE } from './guards';

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; status: 429; message: string };

export async function checkPublicFreeAnalysisIpRateLimit(
  supabase: SupabaseClient,
  ipHash: string,
): Promise<RateLimitResult> {
  const hourSince = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const daySince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: hourCount, error: hourError }, { count: dayCount, error: dayError }] =
    await Promise.all([
      supabase
        .from('public_analysis_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', hourSince),
      supabase
        .from('public_analysis_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', daySince),
    ]);

  if (hourError) {
    console.error('[teste-bloqueio] rate limit hour count failed:', hourError.message);
  } else if ((hourCount ?? 0) >= RATE_LIMIT_HOURLY) {
    return { allowed: false, status: 429, message: RATE_LIMIT_MESSAGE };
  }

  if (dayError) {
    console.error('[teste-bloqueio] rate limit day count failed:', dayError.message);
  } else if ((dayCount ?? 0) >= RATE_LIMIT_DAILY) {
    return { allowed: false, status: 429, message: RATE_LIMIT_MESSAGE };
  }

  return { allowed: true };
}

export async function recordPublicFreeAnalysisIpHit(
  supabase: SupabaseClient,
  ipHash: string,
  label: string,
): Promise<void> {
  const { error } = await supabase.from('public_analysis_rate_limits').insert({
    ip_hash: ipHash,
    nome_consultado: label.slice(0, 150),
  });
  if (error) {
    console.error('[teste-bloqueio] rate limit insert failed:', error.message);
  }
}
