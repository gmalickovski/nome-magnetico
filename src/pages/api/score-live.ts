import type { APIRoute } from 'astro';
import { z } from 'zod';
import { evaluateLiveTyping } from '../../shared/interactive-engine/live-score';

const scoreLiveSchema = z.object({
  text: z.string().max(600).default(''),
  profile: z
    .object({
      nomeCompleto: z.string().optional(),
      dataNascimento: z.string().optional(),
      areaFoco: z.string().nullable().optional(),
      subfocoMomento: z.string().nullable().optional(),
      ondeVaiUsar: z.array(z.string()).optional(),
      sobrenomesObrigatorios: z.array(z.string()).optional(),
      sobrenomesExcluidos: z.array(z.string()).optional(),
      estiloPreferido: z.string().nullable().optional(),
      notaHoje: z.number().optional(),
      potencial: z.number().optional(),
      palpiteStatus: z.enum(['acertou', 'parcial', 'nao']).nullable().optional(),
    })
    .default({}),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const raw = await request.json();
    const parsed = scoreLiveSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { text, profile } = parsed.data;
    const result = evaluateLiveTyping(text, profile);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro no cálculo do radar ao vivo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
