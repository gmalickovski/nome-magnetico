import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '@/backend/db/supabase';
import { analisarNomesSocial } from '@/backend/numerology/products/nome-social';
import { calcularTodosTriangulos } from '@/backend/numerology/triangle';

const RequestSchema = z.object({
  nome_nascimento: z.string().min(2),
  data_nascimento: z.string().optional().or(z.literal('')),
  nomes_candidatos: z.array(z.string().min(2)).optional(),
  genero_preferido: z.string().optional(),
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
    } else {
      bdDataStr = body.data_nascimento || '';
    }

    const candidatos = body.nomes_candidatos || [];

    // Executa a orquestração numerológica oficial do Nome Social
    const resultado = analisarNomesSocial(
      candidatos,
      body.nome_nascimento,
      bdDataStr,
      body.genero_preferido
    );

    // Enriquece cada candidato no ranking com os 4 triângulos pré-calculados
    const nomesCandidatosEnriquecidos = resultado.nomesCandidatos.map(c => {
      const triangulos = calcularTodosTriangulos(c.nomeCompleto, bdDataStr);
      return {
        ...c,
        triangulos,
      };
    });

    const melhorNomeEnriquecido = resultado.melhorNome
      ? {
          ...resultado.melhorNome,
          triangulos: calcularTodosTriangulos(resultado.melhorNome.nomeCompleto, bdDataStr),
        }
      : null;

    return json({
      ...resultado,
      nomesCandidatos: nomesCandidatosEnriquecidos,
      melhorNome: melhorNomeEnriquecido,
    });
  } catch (error: any) {
    console.error('[analyze-social-live] Erro:', error);
    return json({ error: 'Erro de cálculo interno', detail: error?.message }, 500);
  }
};
