import type { APIRoute } from 'astro';
import { z } from 'zod';
import { verifyInternalHmacRequest } from '@/backend/security/hmac';
import { getSupabaseAdmin } from '@/backend/db/supabase';
import { analisarNomesSocial } from '@/backend/numerology/products/nome-social';
import { SCORE_CONFIG_V3 } from '@/backend/numerology/score-config';
import {
  LEGAL_DISCLAIMER,
  sanitizeClientNivel,
  sanitizeClientCompatibilidade,
  sanitizeClientOutput,
} from '@/backend/client-mcp/sanitize';

export const prerender = false;

function getNivelCodigo(score: number): string {
  for (const n of SCORE_CONFIG_V3.niveis) {
    if (score >= n.min && score <= n.max) {
      return n.codigo;
    }
  }
  return 'N1';
}

const ClientGenerateSchema = z.object({
  userId: z.string().uuid('userId deve ser um UUID válido'),
  nomeCompleto: z.string().min(3).max(120),
  dataNascimento: z.string().min(8).max(10),
  nomesCandidatos: z.array(z.string()).optional().default([]),
});

function toDateBr(val: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return val;
}

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('X-Internal-Signature');
  const timestampHeader = request.headers.get('X-Internal-Timestamp');

  const auth = verifyInternalHmacRequest({
    rawBody,
    signatureHeader,
    timestampHeader,
  });

  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: auth.error }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let parsedBody: unknown;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parseResult = ClientGenerateSchema.safeParse(parsedBody);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: parseResult.error.errors.map((e) => e.message).join(', '),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { userId, nomeCompleto, dataNascimento, nomesCandidatos } = parseResult.data;
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  try {
    // 1. Validar assinatura ativa
    const { data: activeSub, error: subErr } = await supabase
      .from('subscriptions')
      .select('id, product_type, ends_at, refunded_at')
      .eq('user_id', userId)
      .gt('ends_at', nowIso)
      .is('refunded_at', null)
      .order('ends_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr) throw subErr;

    if (!activeSub) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Usuário não possui assinatura ativa ou compra elegível',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const dataBr = toDateBr(dataNascimento);
    const resultadoBruto = analisarNomesSocial(
      nomesCandidatos,
      nomeCompleto,
      dataBr,
      { aceitaEncurtarOuApelido: true },
    );

    // 2. Extrair dados limpos para o cliente (sem expor fórmulas ou saúde)
    const melhor = resultadoBruto.melhorNome
      ? {
          nome_completo: resultadoBruto.melhorNome.nomeCompleto,
          score: resultadoBruto.melhorNome.score,
          nivel: sanitizeClientNivel(getNivelCodigo(resultadoBruto.melhorNome.score)),
          compatibilidade: sanitizeClientCompatibilidade(
            resultadoBruto.melhorNome.compatibilidade,
          ),
          criterios_assinatura: {
            inclinacao_ascendente: true,
            legibilidade: true,
            sem_tracos_cortantes: true,
          },
        }
      : null;

    const candidatos = (resultadoBruto.nomesCandidatos ?? []).map((c) => ({
      nome_completo: c.nomeCompleto,
      score: c.score,
      nivel: sanitizeClientNivel(getNivelCodigo(c.score)),
      compatibilidade: sanitizeClientCompatibilidade(c.compatibilidade),
    }));

    const safeResponse = sanitizeClientOutput({
      ok: true,
      nome_original: nomeCompleto,
      data_nascimento: dataBr,
      melhor_nome: melhor,
      candidatos_avaliados: candidatos,
      aviso_legal: LEGAL_DISCLAIMER,
    });

    return new Response(JSON.stringify(safeResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
