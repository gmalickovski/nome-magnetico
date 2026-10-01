import { supabase } from '../db/supabase';
import { quoteFilter, searchToken } from './search';

export interface OpsSubscriptionRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_nome: string | null;
  product_type: string;
  payment_provider: string | null;
  amount_paid: number | null;
  currency: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
  refunded_at: string | null;
  is_active: boolean;
  is_trial: boolean;
  asaas_payment_id: string | null;
  stripe_session_id: string | null;
}

export interface ListOpsSubscriptionsParams {
  q?: string;
  userId?: string;
  productType?: 'nome_social' | 'nome_bebe' | 'nome_empresa';
  status?: 'active' | 'expired' | 'refunded';
  provider?: 'stripe' | 'asaas';
  kind?: 'trial' | 'paid';
  page: number;
  perPage: number;
}

export interface ListOpsSubscriptionsResult {
  subscriptions: OpsSubscriptionRow[];
  total: number;
  page: number;
  per_page: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SubscriptionQueryRow = {
  id: string;
  user_id: string | null;
  product_type: string;
  payment_provider: string | null;
  amount_paid: number | null;
  currency: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
  refunded_at: string | null;
  asaas_payment_id: string | null;
  stripe_session_id: string | null;
};

async function profileIdsForSearch(q: string): Promise<string[] | null> {
  const token = searchToken(q);
  if (!token) return [];

  const pattern = quoteFilter(`%${token}%`);
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .or(`email.ilike.${pattern},nome.ilike.${pattern}`)
    .limit(100);

  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

export async function listOpsSubscriptions(
  params: ListOpsSubscriptionsParams,
): Promise<ListOpsSubscriptionsResult> {
  const now = new Date().toISOString();
  const from = (params.page - 1) * params.perPage;
  const to = from + params.perPage - 1;

  let userIds: string[] | null = null;
  const token = params.q ? searchToken(params.q) : '';
  const tokenIsUuid = Boolean(token && UUID_RE.test(token));

  if (params.q && !tokenIsUuid) {
    userIds = await profileIdsForSearch(params.q);
    if (!userIds || userIds.length === 0) {
      return { subscriptions: [], total: 0, page: params.page, per_page: params.perPage };
    }
  }

  let query = supabase
    .from('subscriptions')
    .select(
      'id, user_id, product_type, payment_provider, amount_paid, currency, starts_at, ends_at, created_at, refunded_at, asaas_payment_id, stripe_session_id',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.userId) query = query.eq('user_id', params.userId);
  if (params.productType) query = query.eq('product_type', params.productType);
  if (params.provider) query = query.eq('payment_provider', params.provider);

  if (params.status === 'refunded') {
    query = query.not('refunded_at', 'is', null);
  } else if (params.status === 'active') {
    query = query.is('refunded_at', null).gt('ends_at', now);
  } else if (params.status === 'expired') {
    query = query.is('refunded_at', null).lte('ends_at', now);
  }

  if (params.kind === 'trial') {
    query = query.like('stripe_session_id', 'trial_%');
  } else if (params.kind === 'paid') {
    query = query.or('stripe_session_id.is.null,stripe_session_id.not.like.trial_%');
  }

  if (tokenIsUuid) {
    const id = token.toLowerCase();
    query = query.or(`id.eq.${id},user_id.eq.${id}`);
  } else if (userIds) {
    query = query.in('user_id', userIds);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as SubscriptionQueryRow[];
  const ownerIds = [...new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)))];
  const owners = new Map<string, { email: string; nome: string | null }>();

  if (ownerIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, nome')
      .in('id', ownerIds);

    if (profileError) throw profileError;
    for (const profile of profiles ?? []) {
      owners.set(profile.id, { email: profile.email, nome: profile.nome });
    }
  }

  return {
    subscriptions: rows.map((row) => {
      const owner = row.user_id ? owners.get(row.user_id) : undefined;
      const trial = (row.stripe_session_id ?? '').startsWith('trial_');
      const active = !row.refunded_at && new Date(row.ends_at).getTime() > Date.now();
      return {
        id: row.id,
        user_id: row.user_id,
        user_email: owner?.email ?? null,
        user_nome: owner?.nome ?? null,
        product_type: row.product_type,
        payment_provider: row.payment_provider,
        amount_paid: row.amount_paid,
        currency: row.currency,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        created_at: row.created_at,
        refunded_at: row.refunded_at,
        is_active: active,
        is_trial: trial,
        asaas_payment_id: row.asaas_payment_id,
        stripe_session_id: trial ? null : row.stripe_session_id,
      };
    }),
    total: count ?? 0,
    page: params.page,
    per_page: params.perPage,
  };
}
