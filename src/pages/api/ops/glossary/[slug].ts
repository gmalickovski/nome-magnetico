import type { APIRoute } from 'astro';
import { glossaryPatchSchema, glossarySlugSchema, updateGlossaryTerm } from '@/backend/ops/glossary';
import { GlossaryOpsError } from '@/backend/ops/glossary';
import { opsGate, opsJson } from '@/backend/security/opsGate';

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  const gate = await opsGate(request, locals, 'glossary');
  if (gate instanceof Response) return gate;

  const slug = glossarySlugSchema.safeParse(params.slug);
  if (!slug.success) return opsJson({ error: 'Termo inválido' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return opsJson({ error: 'Corpo inválido' }, 400);
  }
  const parsed = glossaryPatchSchema.safeParse(body);
  if (!parsed.success) {
    return opsJson({ error: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos' }, 400);
  }

  try {
    const term = await updateGlossaryTerm(slug.data, parsed.data, gate.profile.id);
    return opsJson({ term });
  } catch (error) {
    if (error instanceof GlossaryOpsError) return opsJson({ error: error.message }, error.status);
    return opsJson({ error: 'Erro ao salvar o termo' }, 500);
  }
};
