import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createAccessCode, listAccessCodes } from '@/backend/ops/accessCodes';
import { OpsRegistryError } from '@/backend/ops/registry';
import {
  discountInRange,
  pageSchema,
  productTypesSchema,
  readQuery,
  stateSchema,
} from '@/backend/ops/registrySchemas';
import { opsGate, opsJson } from '@/backend/security/opsGate';

const KINDS = ['trial', 'gift', 'coupon'] as const;

const querySchema = z.object({
  q: z.string().trim().max(60).optional(),
  kind: z.enum(KINDS).optional(),
  state: stateSchema.exclude(['scheduled']).optional(),
  ...pageSchema,
});

const createSchema = z
  .object({
    code: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .pipe(z.string().regex(/^[A-Z0-9_-]{3,40}$/, 'Código com 3 a 40 letras, números, - ou _')),
    kind: z.enum(KINDS),
    product_types: productTypesSchema,
    trial_days: z.number().int().min(1).max(365).nullable().optional(),
    discount_type: z.enum(['percent', 'fixed']).nullable().optional(),
    discount_value: z.number().int().positive().nullable().optional(),
    expires_at: z.string().datetime({ offset: true }).nullable().optional(),
    note: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional()
      .transform((value) => value || null),
  })
  .strict()
  .superRefine((body, ctx) => {
    if (body.kind === 'coupon') {
      if (!body.discount_type || !body.discount_value) {
        ctx.addIssue({ code: 'custom', path: ['discount_value'], message: 'Informe o desconto do cupom' });
      } else if (!discountInRange(body.discount_type, body.discount_value)) {
        ctx.addIssue({ code: 'custom', path: ['discount_value'], message: 'Desconto fora do limite' });
      }
      if (body.trial_days) {
        ctx.addIssue({ code: 'custom', path: ['trial_days'], message: 'Cupom não tem dias de acesso' });
      }
    } else {
      if (!body.trial_days) {
        ctx.addIssue({ code: 'custom', path: ['trial_days'], message: 'Informe os dias de acesso' });
      }
      if (body.discount_type || body.discount_value) {
        ctx.addIssue({ code: 'custom', path: ['discount_value'], message: 'Acesso liberado não tem desconto' });
      }
    }
    if (body.expires_at && new Date(body.expires_at).getTime() <= Date.now()) {
      ctx.addIssue({ code: 'custom', path: ['expires_at'], message: 'A validade deve estar no futuro' });
    }
  });

function failure(error: unknown, action: string): Response {
  if (error instanceof OpsRegistryError) return opsJson({ error: error.message }, error.status);
  console.error(`[ops/access-codes] falha ao ${action}`, error instanceof Error ? error.message : 'erro');
  return opsJson({ error: `Erro ao ${action} código` }, 500);
}

export const GET: APIRoute = async ({ request, url, locals }) => {
  const gate = await opsGate(request, locals, 'access-codes');
  if (gate instanceof Response) return gate;

  const parsed = querySchema.safeParse(readQuery(url, ['q', 'kind', 'state', 'page', 'per_page']));
  if (!parsed.success) return opsJson({ error: 'Parâmetros inválidos' }, 400);

  try {
    return opsJson(
      await listAccessCodes({
        q: parsed.data.q || undefined,
        kind: parsed.data.kind,
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
  const gate = await opsGate(request, locals, 'access-codes');
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

  const data = parsed.data;
  try {
    const accessCode = await createAccessCode({
      code: data.code,
      kind: data.kind,
      productTypes: data.product_types,
      trialDays: data.kind === 'coupon' ? null : (data.trial_days ?? null),
      discountType: data.kind === 'coupon' ? (data.discount_type ?? null) : null,
      discountValue: data.kind === 'coupon' ? (data.discount_value ?? null) : null,
      expiresAt: data.expires_at ?? null,
      note: data.note ?? null,
      actorId: gate.profile.id,
    });
    return opsJson({ access_code: accessCode }, 201);
  } catch (error) {
    return failure(error, 'criar');
  }
};
