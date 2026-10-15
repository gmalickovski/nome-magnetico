import type { SupabaseClient } from '@supabase/supabase-js';
import {
  FreeAnalysisRequestSchema,
  MAX_BODY_BYTES,
  fakeHoneypotSuccessBody,
  getClientIp,
  hashIp,
  isAllowedPublicOrigin,
  isHoneypotTripped,
  isPlausibleBirthDate,
  normalizeEmailDedupKey,
} from './guards';
import { checkFreeAnalysisEmailEligibility } from './email-lead-guard';
import { checkPublicFreeAnalysisIpRateLimit } from './rate-limit';
import { verifyTurnstileToken } from './turnstile';

export type PreflightJsonResponse = { status: number; body: Record<string, unknown> };

export type PreflightSuccess = {
  ok: true;
  dedupEmail: string;
  nome_completo: string;
  data_nascimento: string;
  ipHash: string;
  opt_in: boolean | undefined;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

export type PreflightResult = PreflightJsonResponse | PreflightSuccess;

function reject(status: number, body: Record<string, unknown>): PreflightJsonResponse {
  return { status, body };
}

export async function runFreeAnalysisPreflight(
  request: Request,
  supabase: SupabaseClient,
  options?: { clientAddress?: string; allowLocalhostOrigins?: boolean; now?: number },
): Promise<PreflightResult> {
  if (!isAllowedPublicOrigin(request, options?.allowLocalhostOrigins)) {
    return reject(403, { error: 'Origem não permitida' });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return reject(413, { error: 'Payload muito grande' });
  }

  let bodyUnknown: unknown;
  try {
    bodyUnknown = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return reject(400, { error: 'Body inválido' });
  }

  if (!bodyUnknown || typeof bodyUnknown !== 'object' || Array.isArray(bodyUnknown)) {
    return reject(400, { error: 'Body inválido' });
  }

  const bodyRecord = bodyUnknown as Record<string, unknown>;

  if (isHoneypotTripped(bodyRecord)) {
    return reject(200, fakeHoneypotSuccessBody());
  }

  const parsed = FreeAnalysisRequestSchema.safeParse(bodyRecord);
  if (!parsed.success) {
    return reject(400, {
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    });
  }

  const {
    nome_completo,
    data_nascimento,
    email,
    opt_in,
    utm_source,
    utm_medium,
    utm_campaign,
  } = parsed.data;
  if (!isPlausibleBirthDate(data_nascimento, options?.now ? new Date(options.now) : undefined)) {
    return reject(400, { error: 'Data de nascimento inválida' });
  }

  const clientIp = getClientIp(request, options?.clientAddress);
  const turnstile = await verifyTurnstileToken(
    parsed.data['cf-turnstile-response'],
    clientIp,
  );
  if (!turnstile.ok) {
    return reject(400, { error: turnstile.reason });
  }

  const dedupEmail = normalizeEmailDedupKey(email);
  const ipHash = hashIp(clientIp);

  const rateLimit = await checkPublicFreeAnalysisIpRateLimit(supabase, ipHash);
  if (!rateLimit.allowed) {
    return reject(rateLimit.status, {
      error: rateLimit.message,
      code: 'public_rate_limit',
    });
  }

  const emailGuard = await checkFreeAnalysisEmailEligibility(
    supabase,
    dedupEmail,
    options?.now,
  );
  if (!emailGuard.allowed) {
    if (emailGuard.status === 409) {
      return reject(409, { error: 'already_requested' });
    }
    return reject(emailGuard.status, {
      error: emailGuard.message,
      code: 'email_cooldown',
    });
  }

  return {
    ok: true,
    dedupEmail,
    nome_completo,
    data_nascimento,
    ipHash,
    opt_in,
    utm_source,
    utm_medium,
    utm_campaign,
  };
}
