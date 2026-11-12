import type { APIRoute } from 'astro';
import { isAdaptiveInterviewEnabled } from '../../shared/interactive-engine/adaptive/config';
import { adaptiveInterviewRequestSchema } from '../../shared/interactive-engine/adaptive/schemas';
import { runAdaptiveInterviewStep } from '../../shared/interactive-engine/adaptive/interview-engine';

export const POST: APIRoute = async ({ request }) => {
  if (!isAdaptiveInterviewEnabled()) {
    return new Response(
      JSON.stringify({
        error: 'Entrevista adaptativa desligada.',
        hint: 'Defina NM_CHAT_ADAPTIVE_JEV=true para habilitar (Parte 1 usa apenas mocks).',
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = adaptiveInterviewRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = runAdaptiveInterviewStep(parsed.data);

    if (!result.sessionGuardOk) {
      return new Response(
        JSON.stringify({
          ...result,
          fallback: 'deterministic',
          providerPath: [...result.decision.providerPath, 'session-guard:limit'],
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[api/adaptive-interview]', err);
    return new Response(JSON.stringify({ error: 'Falha ao avançar entrevista adaptativa.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
