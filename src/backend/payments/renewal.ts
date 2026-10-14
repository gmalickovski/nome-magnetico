import { PRODUCT_TYPES, type ProductType } from '../../shared/product-labels';

/**
 * Renovação do acesso de 30 dias (DEV-153).
 *
 * product_type continua sendo o produto (nome_social, nome_bebe, nome_empresa).
 * A renovação é purchase_kind = 'renewal', não um product_type novo.
 *
 * Etapa do e-mail → slug sem sinais → utm_campaign = "nmrenov" + slug.
 * O "+" vira "p" para não colidir com o dia anterior (d-7 é d7, d+7 é dp7).
 *
 *   d-7  → d7   → nmrenovd7
 *   d-2  → d2   → nmrenovd2
 *   d0   → d0   → nmrenovd0
 *   d+7  → dp7  → nmrenovdp7
 *   d+1  → dp1  → nmrenovdp1
 *   d+15 → dp15 → nmrenovdp15
 *
 * utm_source=brevo e utm_medium=email acompanham a campanha no Checkout.
 * Revogação segue passiva: ends_at > now. Não há job.
 */

export const RENEWAL_ETAPAS = ['d+1', 'd+15', 'd-7', 'd-2', 'd0', 'd+7'] as const;

export type RenewalEtapa = (typeof RENEWAL_ETAPAS)[number];

export type PurchaseKind = 'new' | 'renewal';

/** 30 dias corridos, o mesmo intervalo de createSubscription. */
export const ACCESS_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export const RENEWAL_UTM_CAMPAIGNS = {
  'd-7': 'nmrenovd7',
  'd-2': 'nmrenovd2',
  d0: 'nmrenovd0',
  'd+7': 'nmrenovdp7',
  'd+1': 'nmrenovdp1',
  'd+15': 'nmrenovdp15',
} as const satisfies Record<RenewalEtapa, string>;

/** product_type da assinatura mais recente; fora da lista, nome_social. */
export function renewalProductType(value: string | null | undefined): ProductType {
  if (value && (PRODUCT_TYPES as readonly string[]).includes(value)) {
    return value as ProductType;
  }
  return 'nome_social';
}

export function parsePurchaseKind(value: string | null | undefined): PurchaseKind {
  return value?.trim() === 'renewal' ? 'renewal' : 'new';
}

/**
 * Aceita a etapa canônica, variação de caixa e o "+" que o query string
 * transforma em espaço (etapa=d+7 chega como "d 7" se não vier encodado).
 */
export function parseRenewalEtapa(value: string | null | undefined): RenewalEtapa | null {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '+');
  if (!normalized) return null;
  return (RENEWAL_ETAPAS as readonly string[]).includes(normalized)
    ? (normalized as RenewalEtapa)
    : null;
}

export function renewalUtmCampaign(etapa: RenewalEtapa): string {
  return RENEWAL_UTM_CAMPAIGNS[etapa];
}

export interface RenewalSubscriptionSnapshot {
  id: string;
  endsAt: Date | string;
  createdAt?: Date | string | null;
  refundedAt?: Date | string | null;
}

export interface RenewalWindow {
  startsAt: Date;
  endsAt: Date;
  purchaseKind: PurchaseKind;
  renewedFrom: string | null;
}

function instant(value: Date | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

/**
 * Janela da nova subscription.
 *
 * A lista já é do mesmo usuário e product_type. Se há acesso vigente
 * (ends_at > now, não reembolsado), a nova linha começa nesse ends_at e
 * termina 30 dias depois — vale para renewal e para compra nova.
 * renewed_from aponta essa linha. Sem acesso vigente, renewal ainda grava
 * renewed_from na assinatura mais recente (mesmo expirada ou reembolsada);
 * compra nova deixa renewed_from nulo e começa agora.
 */
export function computeRenewalWindow(input: {
  now: Date;
  purchaseKind: PurchaseKind;
  subscriptions: RenewalSubscriptionSnapshot[];
}): RenewalWindow {
  const nowMs = input.now.getTime();
  const purchaseKind: PurchaseKind = input.purchaseKind === 'renewal' ? 'renewal' : 'new';

  let latest: RenewalSubscriptionSnapshot | null = null;
  let latestRecency = Number.NEGATIVE_INFINITY;
  let active: RenewalSubscriptionSnapshot | null = null;
  let activeEnds = Number.NEGATIVE_INFINITY;

  for (const row of input.subscriptions) {
    if (!row?.id) continue;
    const recency = instant(row.createdAt) ?? instant(row.endsAt) ?? 0;
    if (recency >= latestRecency) {
      latest = row;
      latestRecency = recency;
    }

    if (instant(row.refundedAt) != null) continue;
    const ends = instant(row.endsAt);
    if (ends == null || ends <= nowMs) continue;
    const activeRecency = active
      ? (instant(active.createdAt) ?? instant(active.endsAt) ?? 0)
      : Number.NEGATIVE_INFINITY;
    if (!active || ends > activeEnds || (ends === activeEnds && recency >= activeRecency)) {
      active = row;
      activeEnds = ends;
    }
  }

  if (active) {
    const startsAt = new Date(activeEnds);
    return {
      startsAt,
      endsAt: new Date(startsAt.getTime() + ACCESS_PERIOD_MS),
      purchaseKind,
      renewedFrom: active.id,
    };
  }

  return {
    startsAt: new Date(nowMs),
    endsAt: new Date(nowMs + ACCESS_PERIOD_MS),
    purchaseKind,
    renewedFrom: purchaseKind === 'renewal' ? (latest?.id ?? null) : null,
  };
}
