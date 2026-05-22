import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '@/backend/db/supabase';
import { analisarNomesBebe } from '@/backend/numerology/products/nome-bebe';

const RequestSchema = z.object({
  nomes_candidatos: z.array(z.string().min(2)).min(1),
  sobrenomes_disponiveis: z.array(z.string()),
  data_nascimento: z.string().optional().or(z.literal('')),
  genero_preferido: z.string().optional(),
  nome_ja_escolhido: z.boolean().optional(),
});

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) {
    return json({ error: 'Não autorizado' }, 401);
  }

  // Verificar se o usuário é administrador
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return json({ error: 'Acesso restrito para administradores' }, 403);
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch (err: any) {
    return json({ error: 'Dados inválidos', details: err?.errors }, 400);
  }

  try {
    let bdDataStr = '';
    if (body.data_nascimento && body.data_nascimento.includes('-')) {
      const partes = body.data_nascimento.split('-');
      bdDataStr = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    const resultado = analisarNomesBebe(
      body.nomes_candidatos,
      body.sobrenomes_disponiveis,
      bdDataStr,
      body.genero_preferido,
      body.nome_ja_escolhido
    );

    return json(resultado);
  } catch (error: any) {
    console.error('[analyze-baby-live] Erro:', error);
    return json({ error: 'Erro de cálculo interno', detail: error?.message }, 500);
  }
};
