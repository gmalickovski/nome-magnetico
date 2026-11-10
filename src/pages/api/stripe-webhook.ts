import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import { buildPaymentConfirmedPayload } from '../../backend/notifications/payment-confirmed-payload';
import { constructWebhookEvent, createCheckoutSession, PRODUCT_NAMES } from '../../backend/payments/stripe';
import {
  failedPaymentDeduplicator,
  isValidHttpsCheckoutUrl,
  hasNoConcatenatedUtm,
  MOTIVO_CART_ABANDONED,
  resolvePaymentMethodFromIntent,
} from '../../backend/payments/cart-recovery';
import {
  emitCartAbandonedIfEligible,
  isRecoveryCheckout,
} from '../../backend/payments/cart-recovery-emit';
import {
  createSubscription,
  refundSubscription,
  getSubscriptionByPaymentIntent,
} from '../../backend/db/subscriptions';
import { getProfile } from '../../backend/db/users';
import { notify, publishAccessAttributes } from '../../backend/notifications/notify';
import { recordAccessCouponUse } from '../../backend/payments/prices';
import type { ProductType } from '../../backend/payments/stripe';
import { confirmEmailAfterPayment } from '../../backend/auth/confirmEmail';
import { trackPurchaseConfirmed } from '../../backend/analytics/ga4';
import {
  captureServerEvent,
  posthogEventUuid,
  resolveCheckoutDistinctId,
} from '../../backend/analytics/posthog-server';
import { resolveGaClientId, sendGa4Purchase } from '../../backend/analytics/ga4-mp';
import { parsePurchaseKind } from '../../backend/payments/renewal';
import { captureFluxoException } from '../../sentry/fluxo';
import { invalidateUserSubscriptionsCache } from '../../backend/cache/memo';
import { getPublicBaseUrl } from '../../utils/public-url';
import { productAnalysisAppPath } from '../../backend/payments/checkout-access';
import { shouldNotifyAdminSlackForProvider } from '../../backend/payments/admin-slack';
import { supabase } from '../../backend/db/supabase';
import { parseChatCheckoutMetadata } from '../../backend/payments/chat-checkout-metadata';

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

  // Log estruturado de todo evento recebido (tipo e id), sem PII
  console.log(
    JSON.stringify({
      scope: 'stripe-webhook',
      event_type: event.type,
      event_id: event.id,
    }),
  );

  async function resolveRecoveryCheckoutUrl(params: {
    userId: string;
    userEmail: string;
    productType: ProductType;
    unitAmount: number;
    baseCents?: number;
    promoId?: string | null;
    discountSource?: 'none' | 'promotion' | 'coupon';
    couponCode?: string;
    chosenSignature?: string;
    analysisId?: string;
    source?: 'card_pdf' | 'paywall_free';
  }): Promise<string | null> {
    const baseUrl = getPublicBaseUrl();
    try {
      const session = await createCheckoutSession({
        userId: params.userId,
        userEmail: params.userEmail,
        productType: params.productType,
        unitAmount: params.unitAmount,
        baseCents: params.baseCents,
        promoId: params.promoId,
        discountSource: params.discountSource,
        couponCode: params.couponCode,
        successUrl: `${baseUrl}/obrigado?session_id={CHECKOUT_SESSION_ID}&produto=${params.productType}`,
        cancelUrl: `${baseUrl}/comprar?checkout=cancel`,
        chosenSignature: params.chosenSignature,
        analysisId: params.analysisId,
        source: params.source,
        recovery: true,
      });

      const url = session.url ?? null;
      if (url && isValidHttpsCheckoutUrl(url) && hasNoConcatenatedUtm(url)) {
        return url;
      }
      return null;
    } catch (err) {
      console.error('[stripe-webhook] Erro ao gerar nova sessão para recuperação:', err);
      return null;
    }
  }

  // Tipo base para sessões de checkout
  type CheckoutSession = {
    metadata?: {
      user_id?: string;
      product_type?: string;
      coupon_code?: string;
      base_cents?: string;
      final_cents?: string;
      promo_id?: string;
      ga_client_id?: string;
      ph_distinct_id?: string;
      purchase_kind?: string;
      chosen_signature?: string;
      analysis_id?: string;
      source?: string;
      discount_source?: string;
      recovery?: string;
    };
    id: string;
    payment_intent?: string | { id: string } | null;
    amount_total?: number | null;
    currency?: string;
    customer_email?: string;
    customer_details?: { email?: string | null } | null;
    payment_status?: string;
  };

  /**
   * PostHog do checkout. Não lança e não altera a liberação de acesso.
   * purchase só entra pelos ramos pagos; o uuid é determinístico por evento + sessão.
   */
  async function captureCheckoutPostHog(
    eventName: 'purchase' | 'payment_confirmed' | 'checkout_error' | 'checkout_abandoned',
    session: CheckoutSession,
    paymentMethod?: string,
  ): Promise<void> {
    try {
      const distinctId = resolveCheckoutDistinctId({
        phDistinctId: session.metadata?.ph_distinct_id,
        userId: session.metadata?.user_id,
        email: session.customer_email || session.customer_details?.email,
      });

      if (!distinctId) {
        console.warn('[stripe-webhook] PostHog sem distinct_id:', eventName, session.id);
        return;
      }

      const product = session.metadata?.product_type?.trim() || undefined;
      const plan =
        product && product in PRODUCT_NAMES ? PRODUCT_NAMES[product as ProductType] : product;
      const cents = typeof session.amount_total === 'number' ? session.amount_total : 0;
      const metaBase = session.metadata?.base_cents ? Number(session.metadata.base_cents) : null;
      const metaFinal = session.metadata?.final_cents ? Number(session.metadata.final_cents) : null;
      const properties: Record<string, string | number> = {
        value: Number((cents / 100).toFixed(2)),
        currency: (session.currency || 'brl').toUpperCase(),
        session_id: session.id,
        base_cents: metaBase ?? cents,
        final_cents: metaFinal ?? cents,
        promo_id: session.metadata?.promo_id ?? '',
        promo_code: session.metadata?.coupon_code ?? '',
      };
      if (paymentMethod) properties.payment_method = paymentMethod;
      if (product) {
        properties.product = product;
        properties.product_type = product;
      }
      if (plan) properties.plan = plan;
      if (eventName === 'purchase') {
        properties.purchase_kind = parsePurchaseKind(session.metadata?.purchase_kind);
        const parsedChatMeta = parseChatCheckoutMetadata(session.metadata);
        if (parsedChatMeta?.source) {
          properties.source = parsedChatMeta.source;
        }
      }

      await captureServerEvent({
        distinctId,
        event: eventName,
        properties,
        uuid: posthogEventUuid(eventName, session.id),
      });
    } catch (err) {
      console.error('[stripe-webhook] Falha ao enviar PostHog:', eventName, err);
    }
  }

  /**
   * Processa pagamento confirmado: cria subscription, notifica usuário e sistemas.
   * Reutilizado por checkout.session.completed (cartão) e async_payment_succeeded (PIX).
   */
  async function processPaymentSuccess(
    session: CheckoutSession,
    paymentMethod: 'card' | 'pix' | null,
  ): Promise<void> {
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

    const purchaseKind = parsePurchaseKind(session.metadata?.purchase_kind);
    const { subscription, created } = await createSubscription({
      userId,
      productType,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      amountPaid: session.amount_total ?? undefined,
      currency: session.currency ?? 'brl',
      purchaseKind,
    });
    invalidateUserSubscriptionsCache(userId);
    // stripe_session_id é único. Retry do cartão ou do Pix não repete acesso nem purchase.
    if (!created) {
      console.log('[stripe-webhook] Sessão já processada:', session.id);
      return;
    }

    const chatChoice = parseChatCheckoutMetadata(session.metadata);
    if (chatChoice) {
      try {
        const { error: choiceErr } = await supabase
          .from('chat_checkout_choices')
          .upsert(
            {
              user_id: userId,
              analysis_id: chatChoice.analysisId,
              chosen_signature: chatChoice.chosenSignature,
              source: chatChoice.source,
              stripe_session_id: session.id,
            },
            { onConflict: 'stripe_session_id', ignoreDuplicates: true },
          );
        if (choiceErr) {
          console.error('[stripe-webhook] Falha ao gravar chat_checkout_choices:', choiceErr);
        }
      } catch (err) {
        console.error('[stripe-webhook] Erro ao gravar chat_checkout_choices:', err);
      }
    }

    // Atributos do Brevo logo após a linha nova. Falha aqui não interrompe o resto.
    try {
      await publishAccessAttributes({
        event: 'marketing.payment_confirmed',
        origem: 'compra',
        userId,
        productType,
        subscription,
      });
    } catch (err) {
      console.error('[stripe-webhook] Falha ao enviar atributos de acesso:', err);
    }

    await confirmEmailAfterPayment(userId);

    await recordAccessCouponUse({
      couponCode: session.metadata?.coupon_code,
      userId,
      userEmail: session.customer_email,
      productType,
    }).catch((err) => console.error('[stripe-webhook] Falha ao registrar cupom:', err));

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

    if (paymentMethod) {
      await captureCheckoutPostHog('payment_confirmed', session, paymentMethod);
      await captureCheckoutPostHog('purchase', session, paymentMethod);
    }

    const purchaseValue =
      !session.amount_total || session.amount_total <= 0
        ? 0
        : Number((session.amount_total / 100).toFixed(2));
    const coupon = session.metadata?.coupon_code?.trim() || undefined;
    await sendGa4Purchase({
      clientId: resolveGaClientId(session.id, session.metadata?.ga_client_id),
      transactionId: session.id,
      value: purchaseValue,
      currency: (session.currency || 'brl').toUpperCase(),
      items: [
        {
          item_id: productType,
          item_name: PRODUCT_NAMES[productType] ?? productType,
          item_brand: 'Nome Magnetico',
          item_category: 'Numerologia cabalistica',
          price: purchaseValue,
          quantity: 1,
          coupon,
        },
      ],
      userId,
      coupon,
      paymentProvider: 'stripe',
      productType,
      purchaseKind,
    });

    const profile = await getProfile(userId);
    const baseUrl = getPublicBaseUrl();
    const accessUrl = `${baseUrl}${productAnalysisAppPath(productType)}`;

    // Único envio ao n8n: notify() monta o envelope { event, payload, timestamp } com Authorization.
    const paymentPayload = buildPaymentConfirmedPayload({
      session,
      profile,
      userId,
      productType,
      productName: PRODUCT_NAMES[productType],
      accessUrl,
      paymentIntentId,
    });

    if (paymentPayload) {
      const paymentConfirmedOk = await notify('payment.confirmed', paymentPayload);
      if (!paymentConfirmedOk) {
        console.error(
          JSON.stringify({
            scope: 'stripe-webhook',
            event: 'payment.confirmed',
            ok: false,
            userId,
            productType,
            stripeSessionId: session.id,
          }),
        );
        captureFluxoException('notify_transacional', new Error('payment.confirmed_notify_failed'), {
          product_type: productType,
        });
      }
    } else {
      console.error(
        JSON.stringify({
          scope: 'stripe-webhook',
          event: 'payment.confirmed',
          ok: false,
          reason: 'no_recipient_email',
          userId,
          stripeSessionId: session.id,
        }),
      );
    }

    if (shouldNotifyAdminSlackForProvider(subscription.payment_provider)) {
      const adminNotifyOk = await notify('admin.new_payment', {
        userId,
        productType,
        amount: session.amount_total ?? undefined,
      });
      if (!adminNotifyOk) {
        console.warn(
          JSON.stringify({
            scope: 'stripe-webhook',
            event: 'admin.new_payment',
            ok: false,
            userId,
            productType,
          }),
        );
      }
    }

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

        // Cartão: payment_status = 'paid' → liberar acesso imediatamente.
        // Outros status síncronos (ex.: no_payment_required) seguem liberando acesso,
        // mas o purchase só sai quando o pagamento está paid.
        await processPaymentSuccess(session, session.payment_status === 'paid' ? 'card' : null);
        break;
      }

      // PIX confirmado pelo banco → liberar acesso
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as CheckoutSession;
        console.log('[stripe-webhook] PIX confirmado:', session.id);
        await processPaymentSuccess(session, 'pix');
        break;
      }

      // PIX expirou ou falhou → notificar usuário e emitir cart.abandoned
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as CheckoutSession;
        if (isRecoveryCheckout(session.metadata)) {
          console.log(
            JSON.stringify({
              scope: 'stripe-webhook',
              event_type: 'checkout.session.async_payment_failed',
              event_id: event.id,
              action: 'skip_recovery_loop',
              session_id: session.id,
            }),
          );
          await captureCheckoutPostHog('checkout_error', session, 'pix');
          break;
        }
        const userId = session.metadata?.user_id;
        const failedProductType = (session.metadata?.product_type ?? 'nome_social') as ProductType;
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;
        const paymentId = paymentIntentId || session.id;

        if (failedPaymentDeduplicator.shouldProcess([session.id, paymentIntentId, userId ? `${userId}:${failedProductType}` : null])) {
          if (userId) {
            const profile = await getProfile(userId);
            if (profile) {
              const amountCents = typeof session.amount_total === 'number' ? session.amount_total : undefined;
              await notify('payment.failed', {
                email: profile.email,
                firstName: profile.nome || '',
                productType: failedProductType,
                productName: PRODUCT_NAMES[failedProductType] ?? 'Nome Social',
                reason_type: 'expired',
                payment_id: paymentId,
                reason: 'pix_expired',
                payment_method: 'pix',
                amount: amountCents,
                user_id: userId,
              });

              await emitCartAbandonedIfEligible({
                userId,
                productType: failedProductType,
                profile,
                paymentId,
                reasonType: 'expired',
                paymentMethod: 'pix',
                motivo: MOTIVO_CART_ABANDONED.pix_expired,
                sessionMetadata: session.metadata,
                amountTotalCents: session.amount_total,
                resolveRecoveryCheckoutUrl,
              });
            }
          }
        }
        await captureCheckoutPostHog('checkout_error', session, 'pix');
        break;
      }

      // Sessão expirou sem pagamento (cliente abandonou o Checkout).
      case 'checkout.session.expired': {
        const session = event.data.object as CheckoutSession;
        if (isRecoveryCheckout(session.metadata)) {
          console.log(
            JSON.stringify({
              scope: 'stripe-webhook',
              event_type: 'checkout.session.expired',
              event_id: event.id,
              action: 'skip_recovery_loop',
              session_id: session.id,
            }),
          );
          await captureCheckoutPostHog('checkout_abandoned', session);
          break;
        }

        const userId = session.metadata?.user_id;
        const failedProductType = (session.metadata?.product_type ?? 'nome_social') as ProductType;
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;
        const paymentId = session.id;

        // Ponto 5 da revisão: emissão de cart.abandoned é exclusiva para nome_social
        // Ponto 3: não emitir se o usuário já tem assinatura ativa no mesmo produto
        if (failedPaymentDeduplicator.shouldProcess([session.id, paymentIntentId, userId ? `${userId}:${failedProductType}` : null])) {
          if (userId) {
            const profile = await getProfile(userId);
            if (profile) {
              const amountCents = typeof session.amount_total === 'number' ? session.amount_total : undefined;
              await notify('payment.failed', {
                email: profile.email,
                firstName: profile.nome || '',
                productType: failedProductType,
                productName: PRODUCT_NAMES[failedProductType] ?? 'Nome Social',
                reason_type: 'expired',
                payment_id: paymentId,
                reason: 'checkout_expired',
                amount: amountCents,
                user_id: userId,
              });

              await emitCartAbandonedIfEligible({
                userId,
                productType: failedProductType,
                profile,
                paymentId,
                reasonType: 'expired',
                motivo: MOTIVO_CART_ABANDONED.checkout_expired,
                sessionMetadata: session.metadata,
                amountTotalCents: session.amount_total,
                resolveRecoveryCheckoutUrl,
              });
            }
          }
        }
        await captureCheckoutPostHog('checkout_abandoned', session);
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
            invalidateUserSubscriptionsCache(subscription.user_id);
            console.log('[stripe-webhook] Acesso revogado por reembolso manual:', subscription.id);
            try {
              await publishAccessAttributes({
                event: 'marketing.access_refunded',
                origem: 'reembolso',
                userId: subscription.user_id,
                productType: subscription.product_type,
                subscription,
              });
            } catch (err) {
              console.error('[stripe-webhook] Falha ao enviar atributos de acesso:', err);
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (isRecoveryCheckout(pi.metadata)) {
          console.log(
            JSON.stringify({
              scope: 'stripe-webhook',
              event_type: 'payment_intent.payment_failed',
              event_id: event.id,
              action: 'skip_recovery_loop',
              payment_intent_id: pi.id,
            }),
          );
          break;
        }
        const userId = pi.metadata?.user_id;
        const failedProductType = (pi.metadata?.product_type ?? 'nome_social') as ProductType;
        const paymentId = pi.id;

        if (failedPaymentDeduplicator.shouldProcess([pi.id, userId ? `${userId}:${failedProductType}` : null])) {
          if (userId) {
            const profile = await getProfile(userId);
            if (profile) {
              const lastErr = pi.last_payment_error;
              const isPixExpired = lastErr?.code === 'payment_intent_payment_attempt_expired';
              const paymentMethod: 'pix' | 'card' = resolvePaymentMethodFromIntent(pi);
              const reasonType: 'expired' | 'declined' = isPixExpired ? 'expired' : 'declined';
              const reasonMessage = lastErr?.decline_code ?? lastErr?.message ?? 'payment_failed';
              const amountCents = typeof pi.amount === 'number' ? pi.amount : undefined;

              await notify('payment.failed', {
                email: profile.email,
                firstName: profile.nome || '',
                productType: failedProductType,
                productName: PRODUCT_NAMES[failedProductType] ?? 'Nome Social',
                reason_type: reasonType,
                payment_id: paymentId,
                reason: reasonMessage,
                payment_method: paymentMethod,
                amount: amountCents,
                user_id: userId,
              });

              const motivo = isPixExpired
                ? MOTIVO_CART_ABANDONED.pix_expired
                : MOTIVO_CART_ABANDONED.card_declined;

              await emitCartAbandonedIfEligible({
                userId,
                productType: failedProductType,
                profile,
                paymentId,
                reasonType,
                paymentMethod,
                motivo,
                sessionMetadata: pi.metadata,
                amountTotalCents: pi.amount,
                resolveRecoveryCheckoutUrl,
              });
            }
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] Erro ao processar evento:', event.type, err);
    // Assinatura inválida já devolveu 400 acima. Aqui é falha de Stripe/Supabase/n8n.
    captureFluxoException('stripe_webhook', err, { tipo_evento: event.type });
    // Retornar 200 para o Stripe não reenviar — logar o erro internamente
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
