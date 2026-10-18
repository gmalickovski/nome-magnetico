import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { supabase as globalSupabase } from '../../backend/db/supabase';

export const PRODUCT_VOTE_OPTIONS = ['nome_bebe', 'nome_empresa', 'outro'] as const;
export type ProductVoteOption = (typeof PRODUCT_VOTE_OPTIONS)[number];

/**
 * Schema estrito (.strict()):
 * - Só aceita `option` dentre os 3 valores fechados ('nome_bebe' | 'nome_empresa' | 'outro').
 * - Rejeita qualquer campo extra (ex: texto aberto em 'outro', email, distinct_id, fingerprint).
 */
export const productVoteSchema = z
  .object({
    option: z.enum(PRODUCT_VOTE_OPTIONS, {
      errorMap: () => ({ message: 'Opção de voto inválida.' }),
    }),
  })
  .strict({ message: 'Campos adicionais ou texto livre não são permitidos.' });

// ── Anti-abuso efêmero em memória (nunca persistido, sem IP em claro) ──────────
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const RATE_LIMIT_MAX_VOTES = 5;
const EPHEMERAL_SALT = randomBytes(16).toString('hex');
const ephemeralBuckets = new Map<string, { count: number; resetAt: number }>();

export function resetVoteRateLimiterForTests(): void {
  ephemeralBuckets.clear();
}

function getEphemeralRateKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const cfIp = request.headers.get('cf-connecting-ip')?.trim() ?? '';
  const rawSource = cfIp || forwarded || 'anon';
  return createHash('sha256').update(`${EPHEMERAL_SALT}:${rawSource}`).digest('hex').slice(0, 24);
}

function checkEphemeralRateLimit(key: string, now = Date.now()): boolean {
  if (ephemeralBuckets.size > 2000) {
    for (const [k, v] of ephemeralBuckets.entries()) {
      if (v.resetAt <= now) ephemeralBuckets.delete(k);
    }
  }
  const current = ephemeralBuckets.get(key);
  if (!current || current.resetAt <= now) {
    ephemeralBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_LIMIT_MAX_VOTES) {
    return false;
  }
  current.count += 1;
  return true;
}

export interface VotePersistenceAdapter {
  incrementVote: (option: ProductVoteOption) => Promise<number>;
  getCounts?: () => Promise<Record<ProductVoteOption, number>>;
}

const defaultAdapter: VotePersistenceAdapter = {
  async incrementVote(option: ProductVoteOption): Promise<number> {
    const { data, error } = await globalSupabase.rpc('increment_product_vote', {
      p_option: option,
    });
    if (error) throw error;
    return typeof data === 'number' ? data : Number(data ?? 0);
  },
  async getCounts(): Promise<Record<ProductVoteOption, number>> {
    const { data, error } = await globalSupabase
      .from('product_votes')
      .select('option, votes_count');
    if (error) throw error;
    const counts: Record<ProductVoteOption, number> = {
      nome_bebe: 0,
      nome_empresa: 0,
      outro: 0,
    };
    for (const row of data ?? []) {
      const opt = row.option as ProductVoteOption;
      if (opt in counts) {
        counts[opt] = Number(row.votes_count ?? 0);
      }
    }
    return counts;
  },
};

export async function handleProductVotePost(
  request: Request,
  adapter: VotePersistenceAdapter = defaultAdapter
): Promise<Response> {
  // Nunca lê cookies; cabeçalhos de resposta sem Set-Cookie
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  const rateKey = getEphemeralRateKey(request);
  if (!checkEphemeralRateLimit(rateKey)) {
    return new Response(
      JSON.stringify({ error: 'Muitos votos em sequência. Tente novamente mais tarde.' }),
      { status: 429, headers }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Payload inválido.' }), {
      status: 400,
      headers,
    });
  }

  const parsed = productVoteSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Opção inválida.' }),
      { status: 400, headers }
    );
  }

  const { option } = parsed.data;

  try {
    const total = await adapter.incrementVote(option);
    return new Response(
      JSON.stringify({ ok: true, option, votes_count: total }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('[product-vote] Erro ao contabilizar voto agregado:', err);
    return new Response(
      JSON.stringify({ error: 'Não foi possível registrar o voto no momento.' }),
      { status: 500, headers }
    );
  }
}

export const POST: APIRoute = async ({ request }) => {
  return handleProductVotePost(request);
};

export const GET: APIRoute = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30',
  };
  try {
    const counts = await defaultAdapter.getCounts!();
    return new Response(JSON.stringify({ ok: true, counts }), { status: 200, headers });
  } catch {
    return new Response(
      JSON.stringify({ ok: true, counts: { nome_bebe: 0, nome_empresa: 0, outro: 0 } }),
      { status: 200, headers }
    );
  }
};
