import type { APIRoute } from 'astro';
import { z } from 'zod';
import { verifyInternalHmacRequest } from '@/backend/security/hmac';
import { getSupabaseAdmin } from '@/backend/db/supabase';
import {
  LEGAL_DISCLAIMER,
  sanitizeClientNivel,
  sanitizeClientOutput,
} from '@/backend/client-mcp/sanitize';

export const prerender = false;

const ClientExplainSchema = z.object({
  userId: z.string().uuid('userId deve ser um UUID válido'),
  analysisId: z.string().uuid('analysisId deve ser um UUID válido').optional(),
  score: z.number().int().min(0).max(100).optional(),
  nivel: z.string().optional(),
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

  const parseResult = ClientExplainSchema.safeParse(parsedBody);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: parseResult.error.errors.map((e) => e.message).join(', '),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { userId, analysisId, score, nivel } = parseResult.data;
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

    let finalScore = score;
    let finalNivel = nivel;

    if (finalScore === undefined && analysisId) {
      const { data: analysis } = await supabase
        .from('analyses')
        .select('score, score_v3')
        .eq('id', analysisId)
        .eq('user_id', userId)
        .maybeSingle();

      if (analysis) {
        finalScore = Number(analysis.score_v3 ?? analysis.score ?? 0);
      }
    }

    if (finalScore === undefined) {
      finalScore = 75; // Padrão de referência
    }

    const cleanNivel = sanitizeClientNivel(
      finalNivel ?? (finalScore >= 80 ? 'Harmonioso' : finalScore >= 50 ? 'Neutro' : 'Tensão Vibracional'),
    );

    let explicacaoTexto = '';
    let recomendacoes = [];

    if (cleanNivel === 'Harmonioso') {
      explicacaoTexto =
        'Seu nome atual apresenta excelente equilíbrio vibracional. A relação entre sua vibração de Expressão e seu caminho de Destino flui com grande clareza e sinergia, facilitando a realização de metas.';
      recomendacoes = [
        'Mantenha a assinatura legível e com traçado fluido.',
        'Prefira leve inclinação ascendente (5° a 15°) ao assinar.',
        'Evite traços que cortem o próprio nome.',
      ];
    } else if (cleanNivel === 'Neutro') {
      explicacaoTexto =
        'Seu nome possui uma vibração moderada, estável e funcional. Não há impedimentos severos, porém ajustes sutis em sua assinatura social podem amplificar sua ressonância profissional e pessoal.';
      recomendacoes = [
        'Utilize a variação social sugerida em cartões, redes e assinaturas de e-mail.',
        'Assine com clareza para reforçar sua presença e autoridade.',
      ];
    } else {
      explicacaoTexto =
        'Identificamos uma Tensão Vibracional entre os padrões do nome e sua data de nascimento. Isso significa que determinados ciclos exigem maior esforço consciente para alcançar harmonia e clareza de propósito.';
      recomendacoes = [
        'Adote a variação social harmonizada para alinhar seu número de Expressão ao seu Destino.',
        'Treine sua nova assinatura de forma consciente por 21 dias.',
      ];
    }

    const safeResponse = sanitizeClientOutput({
      ok: true,
      score: finalScore,
      nivel: cleanNivel,
      explicacao: explicacaoTexto,
      recomendacoes_praticas: recomendacoes,
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
