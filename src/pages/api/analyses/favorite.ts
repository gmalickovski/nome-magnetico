import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '../../../backend/db/supabase';

const FavoriteBodySchema = z.object({
  analysisId: z.string().uuid('ID de análise inválido').nullable(),
});

function jsonResponse(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return jsonResponse({ error: 'Autenticação necessária' }, 401);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse({ error: 'Body inválido' }, 400);
  }

  const parsed = FavoriteBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonResponse({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, 400);
  }

  const { analysisId } = parsed.data;

  if (analysisId !== null) {
    const { data: target, error: targetError } = await supabase
      .from('analyses')
      .select('id, user_id, product_type, is_free, status')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (targetError) {
      return jsonResponse({ error: targetError.message }, 500);
    }

    if (!target) {
      return jsonResponse({ error: 'Análise não encontrada' }, 404);
    }

    if (target.is_free === true || target.product_type === 'analise_gratuita') {
      return jsonResponse(
        { error: 'A análise inicial do nome de nascimento não pode ser favoritada como principal.' },
        400,
      );
    }

    if (target.status !== 'complete') {
      return jsonResponse(
        { error: 'Apenas análises concluídas podem ser marcadas como principais.' },
        400,
      );
    }
  }

  const { data: rows, error: listError } = await supabase
    .from('analyses')
    .select('id, frequencias_numeros, product_type, is_free')
    .eq('user_id', user.id)
    .eq('status', 'complete');

  if (listError) {
    return jsonResponse({ error: listError.message }, 500);
  }

  const eligibleRows = (rows ?? []).filter(
    (row) => row.is_free !== true && row.product_type !== 'analise_gratuita',
  );

  for (const row of eligibleRows) {
    const shouldBeFavorite = analysisId !== null && row.id === analysisId;
    const freqObj =
      row.frequencias_numeros && typeof row.frequencias_numeros === 'object' && !Array.isArray(row.frequencias_numeros)
        ? (row.frequencias_numeros as Record<string, unknown>)
        : {};
    const currentlyFavorite = Boolean(freqObj.is_favorite);

    if (currentlyFavorite === shouldBeFavorite) continue;

    const nextFreq = {
      ...freqObj,
      is_favorite: shouldBeFavorite,
    };

    const { error: updateError } = await supabase
      .from('analyses')
      .update({ frequencias_numeros: nextFreq })
      .eq('id', row.id)
      .eq('user_id', user.id);

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }
  }

  return jsonResponse({ ok: true, favoriteAnalysisId: analysisId }, 200);
};
