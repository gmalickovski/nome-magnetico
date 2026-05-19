import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import { constructWebhookEvent, PRODUCT_NAMES } from '../../backend/payments/stripe';
import {
  createSubscription,
  refundSubscription,
  getSubscriptionByPaymentIntent,
} from '../../backend/db/subscriptions';
import { getProfile } from '../../backend/db/users';
import { notify } from '../../backend/notifications/notify';
import { recordHqAccessCouponUse } from '../../backend/payments/prices';
import type { ProductType } from '../../backend/payments/stripe';
import { confirmEmailAfterPayment } from '../../backend/auth/confirmEmail';
import { trackPurchaseConfirmed } from '../../backend/analytics/ga4';

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Assinatura ausente', { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('[stripe-webhook] Assinatura inválida:', err);
    return new Response('Assinatura inválida', { status: 400 });
  }

  // Tipo base para sessões de checkout
  type CheckoutSession = {
    metadata?: { user_id?: string; product_type?: string; coupon_code?: string; ga_client_id?: string };
    id: string;
    payment_intent?: string | { id: string } | null;
    amount_total?: number | null;
    currency?: string;
    customer_email?: string;
    payment_status?: string;
  };

  /**
   * Processa pagamento confirmado: cria subscription, notifica usuário e sistemas.
   * Reutilizado por checkout.session.completed (cartão) e async_payment_succeeded (PIX).
   */
  async function processPaymentSuccess(session: CheckoutSession): Promise<void> {
    const userId = session.metadata?.user_id;
    const productType = session.metadata?.product_type as ProductType;

    if (!userId || !productType) {
      console.error('[stripe-webhook] Metadados ausentes na sessão');
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

    await createSubscription({
      userId,
      productType,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      amountPaid: session.amount_total ?? undefined,
      currency: session.currency ?? 'brl',
    });
    await confirmEmailAfterPayment(userId);

    await recordHqAccessCouponUse({
      couponCode: session.metadata?.coupon_code,
      userId,
      userEmail: session.customer_email,
      productType,
    }).catch((err) => console.error('[stripe-webhook] Falha ao registrar cupom no HQ:', err));

    await trackPurchaseConfirmed({
      userId,
      productType,
      transactionId: session.id,
      amountCents: session.amount_total,
      currency: session.currency,
      paymentProvider: 'stripe',
      couponCode: session.metadata?.coupon_code,
      gaClientId: session.metadata?.ga_client_id,
    });

    const n8nUrl = process.env.N8N_WEBHOOK_TRANSACIONAL;
    if (n8nUrl) {
      fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeEvent: event,
          userId,
          productType,
          customerEmail: session.customer_email,
          amountPaid: session.amount_total,
          currency: session.currency,
          stripeSessionId: session.id,
        }),
      }).catch(err => console.error('[stripe-webhook] Falha ao notificar n8n:', err));
    }

    const profile = await getProfile(userId);
    if (profile) {
      await notify('payment.confirmed', {
        email: profile.email,
        firstName: profile.nome ?? profile.email.split('@')[0],
        accessUrl: `${process.env.APP_URL}/app`,
        productType,
        productName: PRODUCT_NAMES[productType],
      });
    }

    await notify('admin.new_payment', {
      userId,
      productType,
      amount: session.amount_total ?? undefined,
    });

  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as CheckoutSession;

        // PIX: payment_status = 'unpaid' enquanto aguarda confirmação bancária.
        // O acesso só é liberado em checkout.session.async_payment_succeeded.
        if (session.payment_status === 'unpaid') {
          console.log('[stripe-webhook] PIX pendente — aguardando async_payment_succeeded', session.id);
          break;
        }

        // Cartão: payment_status = 'paid' → liberar acesso imediatamente
        await processPaymentSuccess(session);
        break;
      }

      // PIX confirmado pelo banco → liberar acesso
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as CheckoutSession;
        console.log('[stripe-webhook] PIX confirmado:', session.id);
        await processPaymentSuccess(session);
        break;
      }

      // PIX expirou ou falhou → notificar usuário
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as CheckoutSession;
        const userId = session.metadata?.user_id;
        const failedProductType = (session.metadata?.product_type ?? 'nome_social') as ProductType;
        if (userId) {
          const profile = await getProfile(userId);
          if (profile) {
            await notify('payment.failed', {
              email: profile.email,
              firstName: profile.nome ?? profile.email.split('@')[0],
              productType: failedProductType,
              productName: PRODUCT_NAMES[failedProductType],
            });
          }
        }
        break;
      }

      // Reembolso manual feito diretamente no Dashboard Stripe → revogar acesso
      case 'charge.refunded': {
        const charge = event.data.object as {
          payment_intent?: string | null;
          refunds?: { data?: Array<{ id: string }> };
        };
        const paymentIntentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : null;

        if (paymentIntentId) {
          const subscription = await getSubscriptionByPaymentIntent(paymentIntentId);
          if (subscription) {
            const stripeRefundId = charge.refunds?.data?.[0]?.id ?? null;
            await refundSubscription(subscription.id, stripeRefundId, 'Reembolso via Stripe Dashboard');
            console.log('[stripe-webhook] Acesso revogado por reembolso manual:', subscription.id);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as {
          metadata?: { user_id?: string; product_type?: string };
        };
        const userId = pi.metadata?.user_id;
        const failedProductType = (pi.metadata?.product_type ?? 'nome_social') as ProductType;
        if (userId) {
          const profile = await getProfile(userId);
          if (profile) {
            await notify('payment.failed', {
              email: profile.email,
              firstName: profile.nome ?? profile.email.split('@')[0],
              productType: failedProductType,
              productName: PRODUCT_NAMES[failedProductType],
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] Erro ao processar evento:', event.type, err);
    // Retornar 200 para o Stripe não reenviar — logar o erro internamente
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
