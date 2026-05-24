import { supabase } from './supabase';
import type { ProductType } from '../payments/stripe';

export interface Subscription {
  id: string;
  user_id: string;
  product_type: ProductType;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_provider: 'stripe' | 'asaas';
  asaas_payment_id: string | null;
  amount_paid: number | null;
  currency: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  refunded_at?: string | null;
  refund_stripe_refund_id?: string | null;
  refund_reason?: string | null;
}

/**
 * Verifica se o usuário tem subscription ativa para um produto.
 * Retorna true para admins e usuários teste com período válido.
 */
export async function hasActiveSubscription(
  userId: string,
  productType: ProductType = 'nome_social'
): Promise<boolean> {
  // 1. Verificar role, is_test e test_ends_at
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_test, test_ends_at')
    .eq('id', userId)
    .single();

  if (profile?.role === 'admin') return true;

  // 2. Verificar assinatura normal/trial para o produto pedido
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, ends_at')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .gt('ends_at', now)
    .limit(1);

  if (!error && (data?.length ?? 0) > 0) return true;

  // 3. Compatibilidade com usuários teste legados/globais.
  // Se existem assinaturas trial ativas, elas definem o escopo por produto.
  // Sem assinatura trial ativa, profiles.is_test continua significando acesso geral.
  const isActiveTest =
    profile?.is_test === true &&
    (profile.test_ends_at === null || new Date(profile.test_ends_at) > new Date());

  if (!isActiveTest) return false;

  const { data: activeTrialSubs } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .gt('ends_at', now)
    .like('stripe_session_id', 'trial_%')
    .limit(1);

  return (activeTrialSubs?.length ?? 0) === 0;
}

/**
 * Retorna a subscription ativa mais recente do usuário.
 */
export async function getActiveSubscription(
  userId: string,
  productType: ProductType = 'nome_social'
): Promise<Subscription | null> {
  const { data, error } = await supabase
    
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .gt('ends_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as Subscription;
}

/**
 * Cria uma nova subscription após pagamento confirmado.
 */
export async function createSubscription(params: {
  userId: string;
  productType: ProductType;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  paymentProvider?: 'stripe' | 'asaas';
  asaasPaymentId?: string;
  amountPaid?: number;
  currency?: string;
}): Promise<Subscription> {
  const { data, error } = await supabase

    .from('subscriptions')
    .insert({
      user_id: params.userId,
      product_type: params.productType,
      stripe_session_id: params.stripeSessionId,
      stripe_payment_intent_id: params.stripePaymentIntentId ?? null,
      payment_provider: params.paymentProvider ?? 'stripe',
      asaas_payment_id: params.asaasPaymentId ?? null,
      amount_paid: params.amountPaid ?? null,
      currency: params.currency ?? 'brl',
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Subscription;
}

/**
 * Verifica se o usuário já teve alguma subscription (incluindo expiradas).
 */
export async function hasAnySubscription(
  userId: string,
  productType?: ProductType
): Promise<boolean> {
  let query = supabase
    
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId);
  if (productType) query = query.eq('product_type', productType);
  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

export interface RevenueStats {
  grossBRL: number;
  stripeFeeBRL: number;
  iaCostBRL: number;
  netBRL: number;
  avgMonthlyNetBRL: number;
  totalTransactions: number;
}

const STRIPE_PCT = 0.0399;
const STRIPE_FIXED_BRL = 0.39;
const USD_TO_BRL = 5.70;

/**
 * Calcula estatísticas de receita do negócio baseado em todo o histórico.
 */
export async function getRevenueStats(allTimeIaCostUsd: number): Promise<RevenueStats> {
  const { data, error } = await supabase
    
    .from('subscriptions')
    .select('amount_paid, created_at')
    .not('amount_paid', 'is', null);

  if (error || !data || data.length === 0) {
    return { grossBRL: 0, stripeFeeBRL: 0, iaCostBRL: 0, netBRL: 0, avgMonthlyNetBRL: 0, totalTransactions: 0 };
  }

  const totalCents = data.reduce((sum, s) => sum + (s.amount_paid ?? 0), 0);
  const totalTransactions = data.length;
  const firstPurchase = new Date(Math.min(...data.map(s => new Date(s.created_at).getTime())));

  const grossBRL = totalCents / 100;
  const stripeFeeBRL = grossBRL * STRIPE_PCT + totalTransactions * STRIPE_FIXED_BRL;
  const iaCostBRL = allTimeIaCostUsd * USD_TO_BRL;
  const netBRL = grossBRL - stripeFeeBRL - iaCostBRL;

  const monthsSinceFirst = Math.max(
    1,
    (Date.now() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const avgMonthlyNetBRL = netBRL / monthsSinceFirst;

  return { grossBRL, stripeFeeBRL, iaCostBRL, netBRL, avgMonthlyNetBRL, totalTransactions };
}

/**
 * Retorna um Map de userId → produtos ativos para uma lista de usuários.
 */
export async function getActiveProductsPerUser(
  userIds: string[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (userIds.length === 0) return result;

  const { data, error } = await supabase
    
    .from('subscriptions')
    .select('user_id, product_type')
    .in('user_id', userIds)
    .gt('ends_at', new Date().toISOString());

  if (error || !data) return result;

  for (const row of data) {
    const list = result.get(row.user_id) ?? [];
    if (!list.includes(row.product_type)) list.push(row.product_type);
    result.set(row.user_id, list);
  }
  return result;
}

/**
 * Retorna subscriptions elegíveis para reembolso:
 * compradas há menos de 7 dias e ainda não reembolsadas.
 */
export async function getRefundableSubscriptions(userId: string): Promise<Subscription[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .gte('starts_at', sevenDaysAgo)
    .is('refunded_at', null)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []) as Subscription[];
}

/**
 * Registra o reembolso de uma subscription e revoga o acesso imediatamente
 * (seta ends_at = now() e preenche campos de rastreio).
 */
export async function refundSubscription(
  subscriptionId: string,
  stripeRefundId: string | null,
  reason?: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('subscriptions')
    .update({
      refunded_at: now,
      ends_at: now,
      refund_stripe_refund_id: stripeRefundId,
      refund_reason: reason ?? null,
    })
    .eq('id', subscriptionId);

  if (error) throw error;
}

/**
 * Busca subscription por stripe_payment_intent_id (usado pelo webhook charge.refunded).
 */
export async function getSubscriptionByPaymentIntent(
  paymentIntentId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .is('refunded_at', null)
    .limit(1)
    .single();

  if (error) return null;
  return data as Subscription;
}

/**
 * Lista todas as subscriptions de um usuário.
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Subscription[];
}
