import type { User } from '@supabase/supabase-js';
import { supabase } from '../db/supabase';

export class StaffAuthError extends Error {
  status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = 'StaffAuthError';
    this.status = status;
  }
}

export interface StaffContext {
  user: User;
  profile: {
    id: string;
    email: string;
    nome: string | null;
    role: 'admin';
  };
}

/** Exige sessão já resolvida no middleware e `profiles.role = admin`. */
export async function assertStaff(locals: App.Locals): Promise<StaffContext> {
  const user = locals.user;
  if (!user) {
    throw new StaffAuthError(401, 'Não autorizado');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, nome, role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error('Falha ao consultar o perfil');
  }

  if (!data || data.role !== 'admin') {
    throw new StaffAuthError(403, 'Acesso restrito à equipe');
  }

  return {
    user,
    profile: {
      id: data.id,
      email: data.email,
      nome: data.nome,
      role: 'admin',
    },
  };
}
