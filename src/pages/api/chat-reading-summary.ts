import type { APIRoute } from 'astro';
import { z } from 'zod';
import { buildChatReadingSummary } from '@/backend/numerology/chat-reading-summary';

const RequestSchema = z.object({
  nome_completo: z.string().min(2).max(150),
  data_nascimento: z.string().min(8).max(20),
});

function normalizeDateToPtBr(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }
  return null;
}

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!(locals as { user?: unknown }).user) {
    return json({ error: 'Não autorizado' }, 401);
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return json({ error: 'Dados inválidos' }, 400);
  }

  const dataPtBr = normalizeDateToPtBr(body.data_nascimento);
  if (!dataPtBr) {
    return json({ error: 'Data de nascimento inválida.' }, 400);
  }

  try {
    const readingSummary = buildChatReadingSummary(body.nome_completo, dataPtBr);
    return json({ readingSummary });
  } catch (err) {
    console.error('[api/chat-reading-summary]', err);
    return json({ error: 'Não foi possível calcular o resumo.' }, 500);
  }
};
