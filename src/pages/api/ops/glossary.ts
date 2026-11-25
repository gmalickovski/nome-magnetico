import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createGlossaryTerm, glossaryCreateSchema, listGlossaryOps } from '@/backend/ops/glossary';
import { GlossaryOpsError } from '@/backend/ops/glossary';
import { opsGate, opsJson } from '@/backend/security/opsGate';

const querySchema = z.object({
  q: z.string().trim().max(80).optional(),
  published: z.enum(['true', 'false']).optional(),
});

export const GET: APIRoute = async ({ request, locals, url }) => {
  const gate = await opsGate(request, locals, 'glossary');
  if (gate instanceof Response) return gate;

  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return opsJson({ error: 'Parâmetros inválidos' }, 400);

  try {
    const terms = await listGlossaryOps({
      q: parsed.data.q,
      published: parsed.data.published === undefined ? undefined : parsed.data.published === 'true',
    });
    return opsJson({ terms });
  } catch (error) {
    if (error instanceof GlossaryOpsError) return opsJson({ error: error.message }, error.status);
    return opsJson({ error: 'Erro ao listar o glossário' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const gate = await opsGate(request, locals, 'glossary');
  if (gate instanceof Response) return gate;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return opsJson({ error: 'Corpo inválido' }, 400);
  }
  const parsed = glossaryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return opsJson({ error: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos' }, 400);
  }

  try {
    const term = await createGlossaryTerm(parsed.data, gate.profile.id);
    return opsJson({ term }, 201);
  } catch (error) {
    if (error instanceof GlossaryOpsError) return opsJson({ error: error.message }, error.status);
    return opsJson({ error: 'Erro ao criar o termo' }, 500);
  }
};
