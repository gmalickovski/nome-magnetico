/**
 * POST /api/internal/ai-polish
 *
 * Polir texto de suporte usando o sistema de IA (Groq → OpenAI fallback).
 * Registra em ai_usage com user_id = null e task = 'support_polish'.
 *
 * Usado pelo N8N no workflow de suporte antes de enviar respostas ao cliente.
 * Protegido por X-Internal-Secret.
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { generateSupportPolish } from '../../../backend/ai/brain';
import { authorizeInternalRequest } from '../../../backend/env/internal-auth';

const schema = z.object({
  mensagem: z.string().min(1).max(4000),
  nomeCliente: z.string().max(100).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const auth = authorizeInternalRequest(request.headers.get('X-Internal-Secret'));
  if (!auth.ok) {
    return json({ error: auth.error }, auth.status);
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return json({ error: 'Body inválido' }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message }, 400);
  }

  const { mensagem, nomeCliente } = parsed.data;

  try {
    const polished = await generateSupportPolish(mensagem, nomeCliente);
    return json({ polished }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai-polish] Erro:', msg);
    return json({ error: msg, polished: mensagem }, 500);
  }
};

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
