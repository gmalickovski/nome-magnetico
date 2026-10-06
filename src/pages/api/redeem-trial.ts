import type { APIRoute } from 'astro';
import { z } from 'zod';
import { redeemAccessTrial } from '../../backend/payments/trial-redeem';

const schema = z.object({
  trialCode: z.string().min(1),
  trialDays: z.number().int().min(0).optional(),
  productType: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Nao autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body invalido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Parametros invalidos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await redeemAccessTrial({
    trialCode: parsed.data.trialCode,
    userId: user.id,
    userEmail: user.email,
  });

  if (!result.ok) {
    return new Response(
      JSON.stringify({
        error: result.error,
        alreadyActive: result.alreadyActive,
        success: false,
      }),
      { status: result.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      endsAt: result.endsAt,
      skippedActiveProducts: result.skippedActiveProducts,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
