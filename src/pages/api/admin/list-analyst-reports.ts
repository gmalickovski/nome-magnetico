import type { APIRoute } from 'astro';
import { supabase } from '@/backend/db/supabase';

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ locals }) => {
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

  try {
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('id, nome_completo, data_nascimento, product_type, score, created_at')
      .eq('is_analyst_generated', true)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    return json({ success: true, analyses: analyses || [] });
  } catch (error: any) {
    console.error('[list-analyst-reports] Erro:', error);
    return json({ error: 'Erro de banco de dados', detail: error?.message }, 500);
  }
};
