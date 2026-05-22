import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '@/backend/db/supabase';
import { analisarNomesEmpresa } from '@/backend/numerology/products/nome-empresa';

const RequestSchema = z.object({
  nomes_candidatos: z.array(z.string().min(2)).min(1),
  nome_socio_principal: z.string().min(2),
  data_nascimento_socio: z.string().optional().or(z.literal('')),
  data_fundacao: z.string().optional().nullable().or(z.literal('')),
  nome_socio2: z.string().optional(),
  data_nascimento_socio2: z.string().optional().nullable().or(z.literal('')),
  ramo_atividade: z.string().optional(),
  descricao_negocio: z.string().optional(),
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
    const parseBirthdate = (dateStr?: string | null) => {
      if (!dateStr || !dateStr.includes('-')) return null;
      const partes = dateStr.split('-');
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };

    const bdSocioStr = parseBirthdate(body.data_nascimento_socio) || '';
    const bdFundacaoStr = parseBirthdate(body.data_fundacao);
    const bdSocio2Str = parseBirthdate(body.data_nascimento_socio2) || undefined;

    const resultado = analisarNomesEmpresa(
      body.nomes_candidatos,
      body.nome_socio_principal,
      bdSocioStr,
      bdFundacaoStr,
      body.nome_socio2 || undefined,
      bdSocio2Str,
      body.ramo_atividade,
      body.descricao_negocio
    );

    return json(resultado);
  } catch (error: any) {
    console.error('[analyze-company-live] Erro:', error);
    return json({ error: 'Erro de cálculo interno', detail: error?.message }, 500);
  }
};
