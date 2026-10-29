import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  getRefundableSubscriptions,
  refundSubscription,
} from '../../backend/db/subscriptions';
import { createRefund, PRODUCT_NAMES } from '../../backend/payments/stripe';
import { getProfile } from '../../backend/db/users';
import { notify, publishAccessAttributes } from '../../backend/notifications/notify';
import { shouldNotifyAdminSlackForProvider } from '../../backend/payments/admin-slack';
import type { ProductType } from '../../backend/payments/stripe';

const schema = z.object({
  subscriptionId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validação do payload
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Buscar subscriptions elegíveis e verificar que a solicitada pertence ao usuário
  const refundable = await getRefundableSubscriptions(user.id);
  const subscription = refundable.find(s => s.id === body.subscriptionId);

  if (!subscription) {
    return new Response(
      JSON.stringify({ error: 'Subscription não elegível para reembolso ou não encontrada.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Buscar perfil para notificações
  const profile = await getProfile(user.id);
  if (profile) {
    await notify('refund.requested', {
      email: profile.email,
      firstName: profile.nome ?? profile.email.split('@')[0],
      userId: user.id,
      subscriptionId: subscription.id,
      productType: subscription.product_type,
      productName: PRODUCT_NAMES[subscription.product_type as ProductType],
      amount: subscription.amount_paid ?? undefined,
      purchasedAt: subscription.starts_at,
      requestedAt: new Date().toISOString(),
      reason: body.reason ?? null,
      paymentProvider: subscription.payment_provider,
      skipAdminSlack: !shouldNotifyAdminSlackForProvider(subscription.payment_provider),
    });
  }

  // Processar reembolso no Stripe (bypass para usuários teste sem payment_intent)
  let stripeRefundId: string | null = null;

  if (subscription.stripe_payment_intent_id) {
    try {
      const refund = await createRefund(subscription.stripe_payment_intent_id);
      stripeRefundId = refund.id;
    } catch (err) {
      console.error('[request-refund] Erro ao criar refund no Stripe:', err);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar reembolso no Stripe. Tente novamente ou contate o suporte.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Deativar subscription no Supabase
  try {
    await refundSubscription(subscription.id, stripeRefundId, body.reason);
  } catch (err) {
    console.error('[request-refund] Erro ao deativar subscription:', err);
    return new Response(
      JSON.stringify({ error: 'Reembolso processado no Stripe mas falhou ao atualizar acesso. Contate o suporte.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Notificar usuário via n8n
  if (profile) {
    await notify('payment.refunded', {
      email: profile.email,
      firstName: profile.nome ?? profile.email.split('@')[0],
      productType: subscription.product_type,
      productName: PRODUCT_NAMES[subscription.product_type as ProductType],
      amount: subscription.amount_paid ?? undefined,
      skipAdminSlack: !shouldNotifyAdminSlackForProvider(subscription.payment_provider),
    });
  }

  try {
    await publishAccessAttributes({
      event: 'marketing.access_refunded',
      origem: 'reembolso',
      userId: user.id,
      productType: subscription.product_type,
      subscription,
    });
  } catch (err) {
    console.error('[request-refund] Falha ao enviar atributos de acesso:', err);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
