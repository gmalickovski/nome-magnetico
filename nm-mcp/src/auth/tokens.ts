import { createHash, timingSafeEqual } from 'node:crypto';
import type { AgentTokenConfig, McpScope } from '../config.js';

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim()).digest('hex').toLowerCase();
}

export function safeCompareHashes(hashA: string, hashB: string): boolean {
  if (!hashA || !hashB) return false;
  const bufA = Buffer.from(hashA.toLowerCase(), 'hex');
  const bufB = Buffer.from(hashB.toLowerCase(), 'hex');
  if (bufA.length !== bufB.length || bufA.length !== 32) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export type AuthResult =
  | { ok: true; principal: { agent: string; scopes: McpScope[]; tokenHash: string } }
  | { ok: false; error: string };

export function authenticateBearerToken(
  authHeader: string | null | undefined,
  tokens: AgentTokenConfig[],
): AuthResult {
  if (!authHeader) {
    return { ok: false, error: 'missing authorization header' };
  }

  const trimmed = authHeader.trim();
  if (!trimmed.startsWith('Bearer ')) {
    return { ok: false, error: 'invalid authorization format (expected Bearer <token>)' };
  }

  const rawToken = trimmed.slice(7).trim();
  if (!rawToken) {
    return { ok: false, error: 'empty bearer token' };
  }

  const incomingHash = hashToken(rawToken);

  for (const item of tokens) {
    if (item.is_active === false) continue;
    if (safeCompareHashes(incomingHash, item.token_hash)) {
      return {
        ok: true,
        principal: {
          agent: item.agent,
          scopes: item.scopes,
          tokenHash: item.token_hash,
        },
      };
    }
  }

  return { ok: false, error: 'unauthorized: token invalid or revoked' };
}

export function hasScope(scopes: McpScope[], requiredScope: McpScope): boolean {
  if (scopes.includes('*' as any)) return true;
  return scopes.includes(requiredScope);
}

export function hasAnyScope(scopes: McpScope[], requiredScopes: McpScope[]): boolean {
  if (scopes.includes('*' as any)) return true;
  return requiredScopes.some((req) => scopes.includes(req));
}
