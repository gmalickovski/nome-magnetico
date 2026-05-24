import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createUserClient } from '@/backend/db/supabase';

const RequestSchema = z.object({
  birth_name: z.string().min(2, 'Nome curto demais').max(150, 'Nome longo demais'),
  birth_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data no formato DD/MM/AAAA'),
  gender: z.enum(['Masculino', 'Feminino', 'Neutro']).optional(),
});

const AccountSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatorio').max(120, 'Nome longo demais'),
  phone: z.string().max(40, 'Telefone longo demais').optional().or(z.literal('')),
});

function dbDateToInput(dbDate: string | null): string {
  if (!dbDate) return '';
  const parts = dbDate.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function inputDateToDb(inputDate: string): string {
  const parts = inputDate.split('/');
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export const GET: APIRoute = async ({ locals }) => {
  const { user, accessToken } = locals as any;

  if (!user || !accessToken) {
    return json({ error: 'Nao autorizado' }, 401);
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from('profiles')
    .select('nome, email, phone, birth_name, birth_date, gender, email_verified_at')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[api/user/save-base-profile] GET error:', error);
    return json({ error: 'Erro ao carregar perfil' }, 500);
  }

  return json({
    profile: {
      nome: data?.nome ?? '',
      email: data?.email ?? user.email ?? '',
      phone: data?.phone ?? '',
      birth_name: data?.birth_name ?? '',
      birth_date: dbDateToInput(data?.birth_date ?? null),
      gender: data?.gender ?? '',
      email_verified_at: data?.email_verified_at ?? null,
    },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, accessToken } = locals as any;

  if (!user || !accessToken) {
    return json({ error: 'Nao autorizado' }, 401);
  }

  const supabase = createUserClient(accessToken);

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return json({ error: 'Dados invalidos' }, 400);
  }

  const updates: Record<string, string> = {
    birth_name: body.birth_name.trim(),
    birth_date: inputDateToDb(body.birth_date),
    updated_at: new Date().toISOString(),
  };

  if (body.gender) {
    updates.gender = body.gender;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('[api/user/save-base-profile] Error:', error);
    return json({ error: 'Erro ao salvar perfil' }, 500);
  }

  return json({ success: true });
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const { user, accessToken } = locals as any;

  if (!user || !accessToken) {
    return json({ error: 'Nao autorizado' }, 401);
  }

  let body: z.infer<typeof AccountSchema>;
  try {
    body = AccountSchema.parse(await request.json());
  } catch {
    return json({ error: 'Dados invalidos' }, 400);
  }

  const supabase = createUserClient(accessToken);
  const { error } = await supabase
    .from('profiles')
    .update({
      nome: body.nome.trim(),
      phone: body.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[api/user/save-base-profile] PATCH error:', error);
    return json({ error: 'Erro ao salvar cadastro' }, 500);
  }

  return json({ success: true });
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
