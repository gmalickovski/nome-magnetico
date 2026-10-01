import { supabase } from '../db/supabase';

export const OPS_USERS_PER_PAGE = 25;

export type OpsUserRow = {
  id: string;
  email: string;
  nome: string | null;
  role: 'user' | 'admin' | string;
  is_test: boolean;
  test_ends_at: string | null;
  created_at: string;
  last_login_at: string | null;
  active_products: string[];
};

export type OpsUserList = {
  users: OpsUserRow[];
  total: number;
  page: number;
  perPage: number;
};

export type OpsOverview = {
  users: number;
  admins: number;
  testUsers: number;
};

function sanitizeSearch(raw: string): string {
  return raw
    .trim()
    .slice(0, 80)
    .replace(/[%_,"\\()]/g, '')
    .replace(/\s+/g, ' ');
}

export function parseOpsUsersQuery(pageRaw: string | null, qRaw: string | null): { page: number; q: string } {
  const parsed = Number(pageRaw ?? '1');
  const page = Number.isFinite(parsed) ? Math.min(10_000, Math.max(1, Math.trunc(parsed))) : 1;
  return { page, q: sanitizeSearch(qRaw ?? '') };
}

/**
 * Lista de usuários somente leitura para o painel staff.
 * Não devolve telefone, nascimento, pagamento nem metadata.
 */
export async function listOpsUsers(input: { page: number; q: string }): Promise<OpsUserList> {
  const page = input.page;
  const q = sanitizeSearch(input.q);
  const perPage = OPS_USERS_PER_PAGE;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('profiles')
    .select('id, email, nome, role, is_test, test_ends_at, created_at, last_login_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (q) {
    const pattern = `%${q}%`;
    query = query.or(`email.ilike."${pattern}",nome.ilike."${pattern}"`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const ids = rows.map((row) => row.id as string);
  const productsByUser = new Map<string, string[]>();

  if (ids.length > 0) {
    const { data: subs, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, product_type, ends_at')
      .in('user_id', ids)
      .gt('ends_at', new Date().toISOString());

    if (subError) throw subError;

    for (const sub of subs ?? []) {
      const userId = sub.user_id as string;
      const product = sub.product_type as string;
      const current = productsByUser.get(userId) ?? [];
      if (!current.includes(product)) current.push(product);
      productsByUser.set(userId, current);
    }
  }

  return {
    users: rows.map((row) => ({
      id: row.id as string,
      email: row.email as string,
      nome: (row.nome as string | null) ?? null,
      role: row.role as string,
      is_test: Boolean(row.is_test),
      test_ends_at: (row.test_ends_at as string | null) ?? null,
      created_at: row.created_at as string,
      last_login_at: (row.last_login_at as string | null) ?? null,
      active_products: productsByUser.get(row.id as string) ?? [],
    })),
    total: count ?? 0,
    page,
    perPage,
  };
}

export async function getOpsOverview(): Promise<OpsOverview> {
  const [users, admins, testUsers] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_test', true),
  ]);

  if (users.error) throw users.error;
  if (admins.error) throw admins.error;
  if (testUsers.error) throw testUsers.error;

  return {
    users: users.count ?? 0,
    admins: admins.count ?? 0,
    testUsers: testUsers.count ?? 0,
  };
}
