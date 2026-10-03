import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createPromotion, listPromotions } from '@/backend/ops/promotions';
import { OpsRegistryError } from '@/backend/ops/registry';
import {
  discountInRange,
  discountSchema,
  pageSchema,
  productTypesSchema,
  readQuery,
  stateSchema,
} from '@/backend/ops/registrySchemas';
import { opsGate, opsJson } from '@/backend/security/opsGate';

const querySchema = z.object({
  state: stateSchema.optional(),
  ...pageSchema,
});

const createSchema = discountSchema
  .extend({
    name: z.string().trim().min(3).max(80),
    product_types: productTypesSchema,
    starts_at: z.string().datetime({ offset: true }).nullable().optional(),
    ends_at: z.string().datetime({ offset: true }),
  })
  .strict()
  .superRefine((body, ctx) => {
    if (!discountInRange(body.discount_type, body.discount_value)) {
      ctx.addIssue({ code: 'custom', path: ['discount_value'], message: 'Desconto fora do limite' });
    }
    const ends = new Date(body.ends_at).getTime();
    const starts = body.starts_at ? new Date(body.starts_at).getTime() : Date.now();
    if (ends <= starts) {
      ctx.addIssue({ code: 'custom', path: ['ends_at'], message: 'O fim deve ser depois do início' });
    }
    if (ends <= Date.now()) {
      ctx.addIssue({ code: 'custom', path: ['ends_at'], message: 'O fim deve estar no futuro' });
    }
  });

function failure(error: unknown, action: string): Response {
  if (error instanceof OpsRegistryError) return opsJson({ error: error.message }, error.status);
  console.error(`[ops/promotions] falha ao ${action}`, error instanceof Error ? error.message : 'erro');
  return opsJson({ error: `Erro ao ${action} promoção` }, 500);
}

export const GET: APIRoute = async ({ request, url, locals }) => {
  const gate = await opsGate(request, locals, 'promotions');
  if (gate instanceof Response) return gate;

  const parsed = querySchema.safeParse(readQuery(url, ['state', 'page', 'per_page']));
  if (!parsed.success) return opsJson({ error: 'Parâmetros inválidos' }, 400);

  try {
    return opsJson(
      await listPromotions({
        state: parsed.data.state,
        page: parsed.data.page,
        perPage: parsed.data.per_page,
      }),
    );
  } catch (error) {
    return failure(error, 'listar');
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const gate = await opsGate(request, locals, 'promotions');
  if (gate instanceof Response) return gate;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return opsJson({ error: 'Corpo inválido' }, 400);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return opsJson({ error: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos' }, 400);
  }

  try {
    const promotion = await createPromotion({
      name: parsed.data.name,
      productTypes: parsed.data.product_types,
      discountType: parsed.data.discount_type,
      discountValue: parsed.data.discount_value,
      startsAt: parsed.data.starts_at ?? null,
      endsAt: parsed.data.ends_at,
      actorId: gate.profile.id,
    });
    return opsJson({ promotion }, 201);
  } catch (error) {
    return failure(error, 'criar');
  }
};
