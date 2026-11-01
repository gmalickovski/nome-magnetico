import type { APIRoute } from 'astro';
import { z } from 'zod';
import { hasActiveSubscription } from '../../../backend/db/subscriptions';
import type { ProductType } from '../../../backend/payments/stripe';

const querySchema = z.object({
  product: z.enum(['nome_social', 'nome_bebe', 'nome_empresa']).default('nome_social'),
});

function json(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Checagem leve de acesso ativo (uma query) — uso em poll pós-pagamento no chat gratuito. */
export const GET: APIRoute = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Não autenticado' }, 401);
  }

  const parsed = querySchema.safeParse({
    product: url.searchParams.get('product') ?? undefined,
  });
  if (!parsed.success) {
    return json({ error: 'Parâmetros inválidos' }, 400);
  }

  const product = parsed.data.product as ProductType;
  try {
    const active = await hasActiveSubscription(user.id, product);
    return json({ product, active });
  } catch (err) {
    console.error('[access/product]', err);
    return json({ error: 'Falha ao verificar acesso' }, 503);
  }
};
