import type { APIRoute } from 'astro';
import { z } from 'zod';
import { setAccessCodeActive } from '@/backend/ops/accessCodes';
import { OpsRegistryError } from '@/backend/ops/registry';
import { toggleSchema } from '@/backend/ops/registrySchemas';
import { opsGate, opsJson } from '@/backend/security/opsGate';

const idSchema = z.string().uuid();

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

  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) return opsJson({ error: 'Parâmetros inválidos' }, 400);

  try {
    const accessCode = await setAccessCodeActive(id.data, parsed.data.is_active, gate.profile.id);
    return opsJson({ access_code: accessCode });
  } catch (error) {
    if (error instanceof OpsRegistryError) return opsJson({ error: error.message }, error.status);
    console.error('[ops/access-codes] falha ao atualizar', error instanceof Error ? error.message : 'erro');
    return opsJson({ error: 'Erro ao atualizar código' }, 500);
  }
};
