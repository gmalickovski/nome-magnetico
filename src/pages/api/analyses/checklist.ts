import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '../../../backend/db/supabase';

const ChecklistStateSchema = z.object({
  pdf: z.boolean(),
  treino_assinatura: z.boolean(),
  registro_identidade: z.boolean(),
  redes_email: z.boolean(),
  cartao_visita: z.boolean(),
  primeiro_documento: z.boolean(),
});

const ChecklistBodySchema = z.object({
  analysisId: z.string().uuid('ID de análise inválido'),
  slideKey: z.string().trim().min(1).max(120),
  checklist: ChecklistStateSchema,
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

  const parsed = ChecklistBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonResponse({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, 400);
  }

  const { analysisId, slideKey, checklist } = parsed.data;

  const { data: row, error: fetchError } = await supabase
    .from('analyses')
    .select('id, user_id, frequencias_numeros')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    return jsonResponse({ error: fetchError.message }, 500);
  }

  if (!row) {
    return jsonResponse({ error: 'Análise não encontrada' }, 404);
  }

  const freqObj =
    row.frequencias_numeros &&
    typeof row.frequencias_numeros === 'object' &&
    !Array.isArray(row.frequencias_numeros)
      ? (row.frequencias_numeros as Record<string, unknown>)
      : {};

  const prevChecklistBySlide =
    freqObj.checklist_by_slide &&
    typeof freqObj.checklist_by_slide === 'object' &&
    !Array.isArray(freqObj.checklist_by_slide)
      ? (freqObj.checklist_by_slide as Record<string, unknown>)
      : {};

  const prevProgressBySlide =
    freqObj.checklist_progress &&
    typeof freqObj.checklist_progress === 'object' &&
    !Array.isArray(freqObj.checklist_progress)
      ? (freqObj.checklist_progress as Record<string, unknown>)
      : {};

  const values = Object.values(checklist);
  const doneCount = values.filter(Boolean).length;
  const percentage = Math.round((doneCount / values.length) * 100);

  const nextFreq = {
    ...freqObj,
    checklist_by_slide: {
      ...prevChecklistBySlide,
      [slideKey]: {
        ...checklist,
        updated_at: new Date().toISOString(),
      },
    },
    checklist_progress: {
      ...prevProgressBySlide,
      [slideKey]: {
        doneCount,
        totalCount: values.length,
        percentage,
        updated_at: new Date().toISOString(),
      },
    },
  };

  const { error: updateError } = await supabase
    .from('analyses')
    .update({ frequencias_numeros: nextFreq })
    .eq('id', analysisId)
    .eq('user_id', user.id);

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  return jsonResponse(
    {
      ok: true,
      analysisId,
      slideKey,
      doneCount,
      totalCount: values.length,
      percentage,
    },
    200,
  );
};
