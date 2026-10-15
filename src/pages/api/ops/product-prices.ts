import type { APIRoute } from 'astro';
import { z } from 'zod';
import { opsGate, opsJson } from '@/backend/security/opsGate';
import { OpsRegistryError } from '@/backend/ops/registry';
import {
  fetchProductPriceRows,
  listProductPriceHistory,
  updateProductPrice,
} from '@/backend/pricing/product-prices-db';
import { getEffectivePriceCore } from '@/backend/pricing/service';
import { fetchActivePromotion } from '@/backend/pricing/promotions-db';
import type { ProductType } from '@/backend/payments/stripe';

const productTypeSchema = z.enum(['nome_social', 'nome_bebe', 'nome_empresa']);

const patchSchema = z
  .object({
    product_type: productTypeSchema,
    base_cents: z.number().int().positive(),
    min_cents: z.number().int().positive(),
  })
  .strict()
  .refine((body) => body.min_cents <= body.base_cents, {
    message: 'O piso não pode ser maior que o preço base.',
    path: ['min_cents'],
  });

function failure(error: unknown, action: string): Response {
  if (error instanceof OpsRegistryError) return opsJson({ error: error.message }, error.status);
  console.error(`[ops/product-prices] ${action}`, error instanceof Error ? error.message : error);
  return opsJson({ error: `Erro ao ${action} preços` }, 500);
}

export const GET: APIRoute = async ({ request, url, locals }) => {
  const gate = await opsGate(request, locals, 'promotions');
  if (gate instanceof Response) return gate;

  const productType = url.searchParams.get('product_type');
  const parsedType = productType ? productTypeSchema.safeParse(productType) : null;
  if (productType && !parsedType?.success) {
    return opsJson({ error: 'Produto inválido' }, 400);
  }

  try {
    const rows = await fetchProductPriceRows();
    const promotion = await fetchActivePromotion().catch(() => null);

    const withPreview = await Promise.all(
      rows.map(async (row) => {
        const effective = await getEffectivePriceCore({
          productType: row.product_type as ProductType,
          productRow: row,
          promotion,
        });
        return { ...row, effective_preview: effective };
      }),
    );

    let history = undefined;
    if (parsedType?.success) {
      history = await listProductPriceHistory(parsedType.data);
    }

    return opsJson({ prices: withPreview, history: history ?? null });
  } catch (error) {
    return failure(error, 'listar');
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const gate = await opsGate(request, locals, 'promotions');
  if (gate instanceof Response) return gate;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return opsJson({ error: 'Corpo inválido' }, 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return opsJson({ error: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos' }, 400);
  }

  try {
    const row = await updateProductPrice({
      productType: parsed.data.product_type,
      baseCents: parsed.data.base_cents,
      minCents: parsed.data.min_cents,
      actorId: gate.profile.id,
    });
    const promotion = await fetchActivePromotion().catch(() => null);
    const effective = await getEffectivePriceCore({
      productType: parsed.data.product_type,
      productRow: row,
      promotion,
    });
    return opsJson({ price: row, effective_preview: effective });
  } catch (error) {
    return failure(error, 'atualizar');
  }
};
