import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { supabase } from '../../../backend/db/supabase';
import { paidAttributionEnabled, paidPreferencesSchema, paidVisitorFromRequest } from '../../../backend/analytics/paid-attribution';
import { hasSamePublicRequestOrigin } from '../../../backend/public-free-analysis/guards';
import { enforceApiRateLimits, getClientIp, hashClientIp } from '../../../backend/security/apiRateLimit';
import { ATTRIBUTION_WINDOW_SECONDS, PAID_ATTRIBUTION_COOKIE } from '../../../shared/paid-attribution';

export const POST: APIRoute = async ({ request, url, cookies, clientAddress }) => {
  if (!hasSamePublicRequestOrigin(request, url) ||
      !request.headers.get('content-type')?.startsWith('application/json')) {
    return new Response(null, { status: 403 });
  }
  if (Number(request.headers.get('content-length')) > 2048) return new Response(null, { status: 413 });

  const body = await request.text();
  if (body.length > 2048) return new Response(null, { status: 413 });
  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = paidPreferencesSchema.safeParse(input);
  if (!parsed.success) return new Response(null, { status: 400 });
  const value = parsed.data;
  const previousId = paidVisitorFromRequest(request);
  const revoking = value.type === 'preferences' && Boolean(previousId) && (!value.ads || !value.analytics);
  if (!paidAttributionEnabled() && !revoking) return new Response(null, { status: 204 });
  if (!previousId && value.type === 'observe') return new Response(null, { status: 428 });
  if (!previousId && value.type === 'preferences' && !value.analytics) return new Response(null, { status: 204 });
  const visitorId = previousId ?? randomUUID();

  try {
    const ip = hashClientIp(getClientIp(request, clientAddress));
    const limit = await enforceApiRateLimits(supabase, [
      { key: `paid-preferences:ip:${ip}`, limit: 180, windowSeconds: 60 },
    ], 'paid-preferences');
    if (!limit.allowed) return new Response(null, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });
    const { error } = await supabase.rpc('nm_paid_update_visitor', {
      p_id: visitorId,
      p_analytics: value.type === 'preferences' ? value.analytics : null,
      p_ads: value.type === 'preferences' ? value.analytics && value.ads : null,
      p_touch: value.touch ?? null,
      p_ga: value.type === 'observe' ? value.ga ?? null : null,
    });
    if (error) throw error;
    if (value.type === 'observe' || value.analytics) {
      cookies.set(PAID_ATTRIBUTION_COOKIE, visitorId, {
        path: '/', httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:',
        maxAge: ATTRIBUTION_WINDOW_SECONDS + 3 * 86400,
      });
    } else {
      cookies.delete(PAID_ATTRIBUTION_COOKIE, { path: '/' });
    }
    return new Response(null, { status: 204 });
  } catch {
    console.warn('[paid-attribution] Preferência indisponível');
    return new Response(null, { status: 503 });
  }
};
