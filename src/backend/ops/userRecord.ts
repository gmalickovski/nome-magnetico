import { supabase } from '../db/supabase';
import type { OpsUserRow } from './listUsers';

const PROFILE_COLUMNS =
  'id, email, nome, phone, role, is_test, test_ends_at, created_at, updated_at, last_login_at, birth_name, birth_date, gender, email_verified_at, app_source';

export interface OpsUserDetail extends OpsUserRow {
  phone: string | null;
  updated_at: string | null;
  last_login_at: string | null;
  birth_name: string | null;
  birth_date: string | null;
  gender: string | null;
  email_verified_at: string | null;
  app_source: string | null;
}

export class OpsWriteError extends Error {
  status: 404 | 409;

  constructor(status: 404 | 409, message: string) {
    super(message);
    this.name = 'OpsWriteError';
    this.status = status;
  }
}

type ProfileRow = {
  id: string;
  email: string;
  nome: string | null;
  phone: string | null;
  role: string;
  is_test: boolean | null;
  test_ends_at: string | null;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
  birth_name: string | null;
  birth_date: string | null;
  gender: string | null;
  email_verified_at: string | null;
  app_source: string | null;
};

async function activeProducts(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('product_type')
    .eq('user_id', userId)
    .is('refunded_at', null)
    .gt('ends_at', new Date().toISOString());

  if (error) throw error;

  const products: string[] = [];
  for (const row of data ?? []) {
    if (!products.includes(row.product_type)) products.push(row.product_type);
  }
  return products;
}

function toDetail(row: ProfileRow, products: string[]): OpsUserDetail {
  return {
    id: row.id,
    email: row.email,
    nome: row.nome,
    phone: row.phone,
    role: row.role,
    is_test: Boolean(row.is_test),
    test_ends_at: row.test_ends_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login_at: row.last_login_at,
    birth_name: row.birth_name,
    birth_date: row.birth_date,
    gender: row.gender,
    email_verified_at: row.email_verified_at,
    app_source: row.app_source,
    active_products: products,
  };
}

export async function getOpsUser(userId: string): Promise<OpsUserDetail | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const products = await activeProducts(userId);
  return toDetail(data as ProfileRow, products);
}

export interface UpdateOpsUserInput {
  userId: string;
  actorId: string;
  role?: 'user' | 'admin';
  isTest?: boolean;
  testEndsAt?: string | null;
  testEndsAtSet: boolean;
}

export async function updateOpsUser(input: UpdateOpsUserInput): Promise<OpsUserDetail> {
  const { data: current, error: readError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', input.userId)
    .maybeSingle();

  if (readError) throw readError;
  if (!current) throw new OpsWriteError(404, 'Usuário não encontrado');

  if (input.role === 'user' && current.role === 'admin') {
    if (input.userId === input.actorId) {
      throw new OpsWriteError(409, 'Não é possível tirar o próprio papel de admin.');
    }

    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (countError) throw countError;
    if ((count ?? 0) <= 1) {
      throw new OpsWriteError(409, 'É preciso manter pelo menos um admin.');
    }
  }

  const patch: Record<string, string | boolean | null> = {
    updated_at: new Date().toISOString(),
  };

  if (input.role) patch.role = input.role;

  if (input.isTest === false) {
    patch.is_test = false;
    patch.test_ends_at = null;
  } else if (input.isTest === true) {
    patch.is_test = true;
    if (input.testEndsAtSet) patch.test_ends_at = input.testEndsAt ?? null;
  } else if (input.testEndsAtSet) {
    patch.test_ends_at = input.testEndsAt ?? null;
  }

  const { data: updated, error: writeError } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', input.userId)
    .select('id')
    .maybeSingle();

  if (writeError) throw writeError;
  if (!updated) throw new OpsWriteError(404, 'Usuário não encontrado');

  console.info('[ops/users] update', {
    actorId: input.actorId,
    userId: input.userId,
    fields: Object.keys(patch).filter((key) => key !== 'updated_at'),
  });

  const detail = await getOpsUser(input.userId);
  if (!detail) throw new OpsWriteError(404, 'Usuário não encontrado');
  return detail;
}
