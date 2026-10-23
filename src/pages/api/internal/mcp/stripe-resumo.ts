import type { APIRoute } from 'astro';
import { z } from 'zod';
import { verifyInternalHmacRequest } from '@/backend/security/hmac';
import { getSupabaseAdmin } from '@/backend/db/supabase';
import { stripe } from '@/backend/payments/stripe';

export const prerender = false;

const StripeResumoSchema = z.object({
  periodo: z.enum(['mes', 'semana', 'total']).optional().default('mes'),
});

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('X-Internal-Signature');
  const timestampHeader = request.headers.get('X-Internal-Timestamp');

  const auth = verifyInternalHmacRequest({
    rawBody,
    signatureHeader,
    timestampHeader,
  });

  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: auth.error }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let parsedBody: unknown = {};
  try {
    if (rawBody.trim()) {
      parsedBody = JSON.parse(rawBody);
    }
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parseResult = StripeResumoSchema.safeParse(parsedBody);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: parseResult.error.errors.map((e) => e.message).join(', '),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { periodo } = parseResult.data;
  const now = new Date();
  let startDate: Date;

  if (periodo === 'mes') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (periodo === 'semana') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(0); // 'total'
  }

  const startIso = startDate.toISOString();
  const supabase = getSupabaseAdmin();

  try {
    // 1. Vendas no período (não reembolsadas)
    const { data: sales, error: salesErr } = await supabase
      .from('subscriptions')
      .select('amount_paid, product_type, created_at')
      .gte('created_at', startIso)
      .is('refunded_at', null);

    if (salesErr) throw salesErr;

    const totalVendas = sales?.length ?? 0;
    const receitaCentavos = (sales ?? []).reduce(
      (sum, s) => sum + (Number(s.amount_paid) || 0),
      0,
    );

    // 2. Reembolsos no período
    const { data: refunds, error: refundsErr } = await supabase
      .from('subscriptions')
      .select('amount_paid, refunded_at, refund_reason')
      .gte('refunded_at', startIso);

    if (refundsErr) throw refundsErr;

    const totalReembolsos = refunds?.length ?? 0;
    const reembolsosCentavos = (refunds ?? []).reduce(
      (sum, r) => sum + (Number(r.amount_paid) || 0),
      0,
    );

    // 3. Assinaturas ativas e MRR estimado (ciclo 30 dias)
    const nowIso = now.toISOString();
    const { data: activeSubs, error: activeErr } = await supabase
      .from('subscriptions')
      .select('amount_paid')
      .gt('ends_at', nowIso)
      .is('refunded_at', null);

    if (activeErr) throw activeErr;

    const assinaturasAtivas = activeSubs?.length ?? 0;
    const mrrCentavos = (activeSubs ?? []).reduce(
      (sum, s) => sum + (Number(s.amount_paid) || 0),
      0,
    );

    // 4. Saldo em conta Stripe (só leitura)
    let stripeBalance: {
      disponivel_centavos: number | null;
      pendente_centavos: number | null;
      moeda: string;
      status: 'ok' | 'unavailable';
    } = {
      disponivel_centavos: null,
      pendente_centavos: null,
      moeda: 'BRL',
      status: 'unavailable',
    };

    try {
      if (stripe && typeof stripe.balance?.retrieve === 'function') {
        const balance = await stripe.balance.retrieve();
        const brlAvailable = balance.available.find((b) => b.currency.toLowerCase() === 'brl');
        const brlPending = balance.pending.find((b) => b.currency.toLowerCase() === 'brl');
        stripeBalance = {
          disponivel_centavos: brlAvailable ? brlAvailable.amount : 0,
          pendente_centavos: brlPending ? brlPending.amount : 0,
          moeda: 'BRL',
          status: 'ok',
        };
      }
    } catch (stripeErr) {
      console.warn('[stripe-resumo] Aviso ao consultar saldo Stripe:', stripeErr);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        periodo,
        since: startIso,
        vendas: {
          total: totalVendas,
          receita_centavos: receitaCentavos,
          receita_reais: Number((receitaCentavos / 100).toFixed(2)),
        },
        reembolsos: {
          total: totalReembolsos,
          valor_centavos: reembolsosCentavos,
          valor_reais: Number((reembolsosCentavos / 100).toFixed(2)),
        },
        mrr: {
          assinaturas_ativas: assinaturasAtivas,
          mrr_estimado_centavos: mrrCentavos,
          mrr_estimado_reais: Number((mrrCentavos / 100).toFixed(2)),
        },
        stripe_balance: stripeBalance,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
