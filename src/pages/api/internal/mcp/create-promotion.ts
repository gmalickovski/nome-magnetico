import type { APIRoute } from 'astro';
import { z } from 'zod';
import { verifyInternalHmacRequest } from '@/backend/security/hmac';
import { createPromotion } from '@/backend/ops/promotions';
import {
  assertPromotionRespectsFloors,
  fetchProductPriceMap,
} from '@/backend/pricing/product-prices-db';
import type { ProductType } from '@/backend/payments/stripe';

export const prerender = false;

const CreatePromotionSchema = z
  .object({
    name: z.string().min(3).max(80),
    productTypes: z
      .array(z.enum(['nome_social', 'nome_bebe', 'nome_empresa']))
      .optional()
      .default([]),
    discountType: z.enum(['percent', 'fixed']),
    discountValue: z.number().int().positive(),
    startsAt: z.string().datetime({ offset: true }).nullable().optional(),
    endsAt: z.string().datetime({ offset: true }),
    bannerText: z.string().max(200).nullable().optional(),
    dryRun: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.discountType === 'percent') {
        return data.discountValue >= 1 && data.discountValue <= 100;
      }
      return true;
    },
    { message: 'Desconto percentual deve estar entre 1 e 100%' },
  );

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('X-Internal-Signature');
  const timestampHeader = request.headers.get('X-Internal-Timestamp');

  const auth = verifyInternalHmacRequest({
    rawBody,
    signatureHeader,
    timestampHeader,
  });

  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: auth.error }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let parsedBody: unknown;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parseResult = CreatePromotionSchema.safeParse(parsedBody);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: parseResult.error.errors.map((e) => e.message).join(', '),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const {
    name,
    productTypes,
    discountType,
    discountValue,
    startsAt,
    endsAt,
    bannerText,
    dryRun,
  } = parseResult.data;

  try {
    const priceMap = await fetchProductPriceMap();
    const targets =
      productTypes.length > 0
        ? (productTypes as ProductType[])
        : (['nome_social', 'nome_bebe', 'nome_empresa'] as ProductType[]);

    // Validação estrita do piso de preço (DEV-178)
    assertPromotionRespectsFloors(targets, priceMap, discountType, discountValue);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          ok: true,
          dry_run: true,
          status: 'simulated',
          message: 'Promoção válida e em conformidade com os pisos de preço (DEV-178).',
          simulation: {
            name,
            product_types: targets,
            discount_type: discountType,
            discount_value: discountValue,
            starts_at: startsAt ?? new Date().toISOString(),
            ends_at: endsAt,
            banner_text: bannerText ?? null,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const promotion = await createPromotion({
      name,
      productTypes: targets,
      discountType,
      discountValue,
      startsAt: startsAt ?? null,
      endsAt,
      bannerText: bannerText ?? null,
      actorId: 'nm_mcp_bot',
    });

    return new Response(
      JSON.stringify({
        ok: true,
        dry_run: false,
        status: 'created',
        promotion,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes('piso') || message.includes('floor') ? 422 : 500;
    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
      }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
