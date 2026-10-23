import type { APIRoute } from 'astro';
import { z } from 'zod';
import { verifyInternalHmacRequest } from '@/backend/security/hmac';
import { getSupabaseAdmin } from '@/backend/db/supabase';
import {
  LEGAL_DISCLAIMER,
  sanitizeClientNivel,
  sanitizeClientCompatibilidade,
  sanitizeClientOutput,
} from '@/backend/client-mcp/sanitize';

export const prerender = false;

const ClientScoreSchema = z.object({
  userId: z.string().uuid('userId deve ser um UUID válido'),
  analysisId: z.string().uuid('analysisId deve ser um UUID válido').optional(),
});

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

  const parseResult = ClientScoreSchema.safeParse(parsedBody);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: parseResult.error.errors.map((e) => e.message).join(', '),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { userId, analysisId } = parseResult.data;
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  try {
    // 1. Validar se o usuário possui compra / assinatura ativa
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

    // 2. Buscar análise do usuário
    let analysisQuery = supabase
      .from('analyses')
      .select(
        'id, product_type, nome_completo, data_nascimento, score, score_v3, score_version, numero_expressao, numero_destino, numero_motivacao, numero_missao, numero_impressao, created_at',
      )
      .eq('user_id', userId);

    if (analysisId) {
      analysisQuery = analysisQuery.eq('id', analysisId);
    } else {
      analysisQuery = analysisQuery.order('created_at', { ascending: false }).limit(1);
    }

    const { data: analysis, error: analysisErr } = await analysisQuery.maybeSingle();
    if (analysisErr) throw analysisErr;

    if (!analysis) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Análise não encontrada para este usuário' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const finalScore = Number(analysis.score_v3 ?? analysis.score ?? 0);
    const nivelCalculado =
      finalScore >= 80 ? 'Harmonioso' : finalScore >= 50 ? 'Neutro' : 'Tensão Vibracional';

    const expressao = Number(analysis.numero_expressao ?? 0);
    const destino = Number(analysis.numero_destino ?? 0);
    const compatibilidade =
      expressao === destino
        ? 'Total'
        : [9, 11, 22].includes(expressao + destino)
        ? 'Complementar'
        : Math.abs(expressao - destino) === 1
        ? 'Aceitável'
        : 'Tensão Vibracional';

    const safeResponse = sanitizeClientOutput({
      ok: true,
      analysis_id: analysis.id,
      product_type: analysis.product_type,
      nome_avaliado: analysis.nome_completo,
      score: finalScore,
      nivel: sanitizeClientNivel(nivelCalculado),
      compatibilidade: sanitizeClientCompatibilidade(compatibilidade),
      numeros_principais: {
        expressao: analysis.numero_expressao,
        destino: analysis.numero_destino,
        motivacao: analysis.numero_motivacao,
        missao: analysis.numero_missao,
        impressao: analysis.numero_impressao,
      },
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
