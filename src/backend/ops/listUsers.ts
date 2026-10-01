import { supabase } from '../db/supabase';

export interface OpsUserRow {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  is_test: boolean;
  test_ends_at: string | null;
  created_at: string;
  active_products: string[];
}

export interface ListOpsUsersParams {
  q?: string;
  role?: 'user' | 'admin';
  isTest?: boolean;
  page: number;
  perPage: number;
}

export interface ListOpsUsersResult {
  users: OpsUserRow[];
  total: number;
  page: number;
  per_page: number;
}

function searchToken(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}@.+_\- ]/gu, '')
    .trim()
    .slice(0, 120);
}

function quoteFilter(value: string): string {
  return `"${value.replace(/"/g, '')}"`;
}

export async function listOpsUsers(params: ListOpsUsersParams): Promise<ListOpsUsersResult> {
  const from = (params.page - 1) * params.perPage;
  const to = from + params.perPage - 1;

  let query = supabase
    .from('profiles')
    .select('id, email, nome, role, is_test, test_ends_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.role) query = query.eq('role', params.role);
  if (params.isTest !== undefined) query = query.eq('is_test', params.isTest);

  const token = params.q ? searchToken(params.q) : '';
  if (token) {
    const pattern = quoteFilter(`%${token}%`);
    query = query.or(`email.ilike.${pattern},nome.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const productsByUser = new Map<string, string[]>();

  if (ids.length > 0) {
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id, product_type')
      .in('user_id', ids)
      .gt('ends_at', new Date().toISOString());

    if (subsError) throw subsError;

    for (const sub of subs ?? []) {
      const list = productsByUser.get(sub.user_id) ?? [];
      if (!list.includes(sub.product_type)) list.push(sub.product_type);
      productsByUser.set(sub.user_id, list);
    }
  }

  return {
    users: rows.map((row) => ({
      id: row.id,
      email: row.email,
      nome: row.nome,
      role: row.role,
      is_test: Boolean(row.is_test),
      test_ends_at: row.test_ends_at,
      created_at: row.created_at,
      active_products: productsByUser.get(row.id) ?? [],
    })),
    total: count ?? 0,
    page: params.page,
    per_page: params.perPage,
  };
}
