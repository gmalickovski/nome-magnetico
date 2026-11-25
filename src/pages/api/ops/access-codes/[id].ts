import type { APIRoute } from 'astro';
import { z } from 'zod';
import { setAccessCodeActive, setCouponEligibility } from '@/backend/ops/accessCodes';
import { OpsRegistryError } from '@/backend/ops/registry';
import { couponEligibilitySchema, toggleSchema } from '@/backend/ops/registrySchemas';
import { opsGate, opsJson } from '@/backend/security/opsGate';

const idSchema = z.string().uuid();
const eligibilitySchema = couponEligibilitySchema.strict();
const patchSchema = z.union([toggleSchema, eligibilitySchema]);

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  const gate = await opsGate(request, locals, 'access-codes');
  if (gate instanceof Response) return gate;

  const id = idSchema.safeParse(params.id);
  if (!id.success) return opsJson({ error: 'Código inválido' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return opsJson({ error: 'Corpo inválido' }, 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const eligibility = eligibilitySchema.safeParse(body);
    const uuidError = eligibility.error?.issues.find((issue) =>
      issue.path[0] === 'excluded_user_ids' && issue.path.length > 1,
    );
    return opsJson({ error: uuidError?.message ?? 'Parâmetros inválidos' }, 400);
  }

  try {
    const update = parsed.data;
    const accessCode = 'is_active' in update
      ? await setAccessCodeActive(id.data, update.is_active, gate.profile.id)
      : await setCouponEligibility(id.data, update, gate.profile.id);
    return opsJson({ access_code: accessCode });
  } catch (error) {
    if (error instanceof OpsRegistryError) return opsJson({ error: error.message }, error.status);
    console.error('[ops/access-codes] falha ao atualizar', error instanceof Error ? error.message : 'erro');
    return opsJson({ error: 'Erro ao atualizar código' }, 500);
  }
};
