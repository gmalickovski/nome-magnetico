import type { AccessAttributesSubscription } from '../notifications/access-attributes-payload';
import { supabase } from './supabase';

/**
 * Dados para o payload de atributos de acesso (Brevo via n8n).
 * Lê o perfil, todas as subscriptions do usuário e se existe analyses.opt_in.
 * RENOVACOES conta renewal não reembolsado de qualquer produto; as datas
 * usam só o product_type pedido. Não grava nada.
 */
export interface AccessAttributesSnapshot {
  email: string;
  nomeCompleto: string;
  userId: string;
  productType: string;
  optIn: boolean;
  subscriptions: AccessAttributesSubscription[];
}

interface ProfileQueryRow {
  email: string | null;
  nome: string | null;
}

interface SubscriptionQueryRow {
  id: string;
  product_type: string | null;
  starts_at: string;
  ends_at: string;
  refunded_at: string | null;
  purchase_kind: string | null;
  renewed_from: string | null;
}

function mapSubscription(row: SubscriptionQueryRow): AccessAttributesSubscription {
  return {
    id: row.id,
    productType: (row.product_type ?? '').trim(),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    refundedAt: row.refunded_at,
    purchaseKind: row.purchase_kind,
    renewedFrom: row.renewed_from,
  };
}

export async function getAccessAttributesSnapshot(
  userId: string,
  productType: string,
): Promise<AccessAttributesSnapshot | null> {
  const id = userId.trim();
  if (!id) return null;

  const [profileResult, subscriptionResult, optInResult] = await Promise.all([
    supabase.from('profiles').select('email, nome').eq('id', id).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('id, product_type, starts_at, ends_at, refunded_at, purchase_kind, renewed_from')
      .eq('user_id', id),
    supabase.from('analyses').select('id').eq('user_id', id).eq('opt_in', true).limit(1),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (subscriptionResult.error) throw subscriptionResult.error;
  if (optInResult.error) throw optInResult.error;

  const profile = profileResult.data as ProfileQueryRow | null;
  const email = profile?.email?.trim() ?? '';
  if (!email) return null;

  const rows = (subscriptionResult.data ?? []) as SubscriptionQueryRow[];

  return {
    email,
    nomeCompleto: profile?.nome?.trim() ?? '',
    userId: id,
    productType: productType.trim(),
    optIn: (optInResult.data?.length ?? 0) > 0,
    subscriptions: rows.filter((row) => row.id).map(mapSubscription),
  };
}
