import type { APIRoute } from 'astro';
import { supabase } from '../../../backend/db/supabase';
import { getProfile } from '../../../backend/db/users';
import { notify } from '../../../backend/notifications/notify';
import { PRODUCT_NAMES } from '../../../backend/payments/stripe';
import type { ProductType } from '../../../backend/payments/stripe';

/**
 * POST /api/internal/notify-expiring
 *
 * Chamado diariamente pelo n8n (Schedule Trigger 09:00) para disparar
 * emails de expiração de assinatura. Protegido por X-Internal-Secret.
 *
 * Configuração n8n: Schedule Trigger → HTTP Request POST com header
 *   X-Internal-Secret: <valor de INTERNAL_API_SECRET>
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || request.headers.get('X-Internal-Secret') !== secret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:4321';
  const renewUrl = `${appUrl}/comprar`;
  const now = new Date();

  const results = { expiring7d: 0, expiring1d: 0, expired: 0 };

  const range7d = saoPauloDayRange(now, 7);
  const range1d = saoPauloDayRange(now, 1);
  const rangeExpired = saoPauloDayRange(now, -1);

  const [{ data: group7d }, { data: group1d }, { data: groupExpired }] = await Promise.all([
    supabase
      
      .from('subscriptions')
      .select('user_id, product_type')
      .gte('ends_at', range7d.start.toISOString())
      .lt('ends_at', range7d.end.toISOString()),
    supabase
      
      .from('subscriptions')
      .select('user_id, product_type')
      .gte('ends_at', range1d.start.toISOString())
      .lt('ends_at', range1d.end.toISOString()),
    supabase
      
      .from('subscriptions')
      .select('user_id, product_type')
      .gte('ends_at', rangeExpired.start.toISOString())
      .lt('ends_at', rangeExpired.end.toISOString()),
  ]);

  async function notifyUser(userId: string, daysLeft: 7 | 1 | null, productType: ProductType) {
    const profile = await getProfile(userId);
    if (!profile?.email) return;

    const productName = PRODUCT_NAMES[productType];

    if (daysLeft !== null) {
      await notify('subscription.expiring_soon', {
        email: profile.email,
        firstName: profile.nome ?? undefined,
        daysLeft,
        renewUrl,
        productType,
        productName,
      }).catch(() => {});
    } else {
      await notify('subscription.expired', {
        email: profile.email,
        firstName: profile.nome ?? undefined,
        renewUrl,
        productType,
        productName,
      }).catch(() => {});
    }
  }

  const tasks: Promise<void>[] = [];

  for (const row of group7d ?? []) {
    tasks.push(notifyUser(row.user_id, 7, (row.product_type ?? 'nome_social') as ProductType));
    results.expiring7d++;
  }
  for (const row of group1d ?? []) {
    tasks.push(notifyUser(row.user_id, 1, (row.product_type ?? 'nome_social') as ProductType));
    results.expiring1d++;
  }
  for (const row of groupExpired ?? []) {
    tasks.push(notifyUser(row.user_id, null, (row.product_type ?? 'nome_social') as ProductType));
    results.expired++;
  }

  await Promise.allSettled(tasks);

  const sent = results.expiring7d + results.expiring1d + results.expired;
  return json({ sent, groups: results }, 200);
};

function saoPauloDayRange(now: Date, daysFromNow: number) {
  const offsetMs = -3 * 60 * 60 * 1000;
  const shifted = new Date(now.getTime() + offsetMs + daysFromNow * 24 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  const start = new Date(shifted.getTime() - offsetMs);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
