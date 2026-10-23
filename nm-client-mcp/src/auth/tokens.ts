import { createHash } from 'node:crypto';
import { getClientMcpDbClient } from '../db/client.js';
import type { ClientPrincipal } from '../context.js';

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim()).digest('hex').toLowerCase();
}

export type ClientAuthResult =
  | { ok: true; principal: ClientPrincipal }
  | { ok: false; error: string; status: number };

export async function authenticateClientToken(
  authHeader: string | null | undefined,
  cost: number = 1,
): Promise<ClientAuthResult> {
  if (!authHeader) {
    return { ok: false, error: 'Cabeçalho de autorização ausente', status: 401 };
  }

  const trimmed = authHeader.trim();
  if (!trimmed.startsWith('Bearer ')) {
    return { ok: false, error: 'Formato de autorização inválido (esperado Bearer <token>)', status: 401 };
  }

  const rawToken = trimmed.slice(7).trim();
  if (!rawToken) {
    return { ok: false, error: 'Token de cliente vazio', status: 401 };
  }

  const tokenHash = hashToken(rawToken);

  try {
    const db = getClientMcpDbClient();
    const { data, error } = await db.rpc('verify_client_access', {
      p_token_hash: tokenHash,
      p_cost: cost,
    });

    if (error) {
      return { ok: false, error: `Erro na verificação de acesso: ${error.message}`, status: 500 };
    }

    const res = typeof data === 'string' ? JSON.parse(data) : data;
    if (!res || res.ok === false) {
      const errMessage = res?.error ?? 'Acesso não autorizado ou cota excedida';
      const status = errMessage.includes('Cota') ? 429 : 403;
      return { ok: false, error: errMessage, status };
    }

    return {
      ok: true,
      principal: {
        tokenHash,
        userId: res.user_id,
        subscriptionId: res.subscription_id,
        remainingQuota: res.remaining_quota,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Falha interna de autenticação: ${message}`, status: 500 };
  }
}
