import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { notify } from './notify';
import {
  buildPaymentConfirmedPayload,
  resolvePaymentRecipientEmail,
} from './payment-confirmed-payload';

const SECRET_KEY = 'N8N_EVENTS_WEBHOOK_SECRET';
const WEBHOOK_KEY = 'N8N_WEBHOOK_TRANSACIONAL';

const baseInput = {
  userId: 'user-1',
  productType: 'nome_social',
  productName: 'Nome Social',
  accessUrl: 'https://example.test/app/nome-social',
};

describe('buildPaymentConfirmedPayload (DEV-259)', () => {
  it('usa o e-mail do perfil e inclui amount numérico e payment_id', () => {
    const p = buildPaymentConfirmedPayload({
      ...baseInput,
      session: { id: 'cs_1', amount_total: 4990 },
      profile: { email: 'a@example.com', nome: 'Ana' },
      paymentIntentId: 'pi_1',
    });
    assert.equal(p?.email, 'a@example.com');
    assert.equal(p?.firstName, 'Ana');
    assert.equal(p?.amount, 4990);
    assert.equal(p?.payment_id, 'pi_1');
    assert.equal(p?.userId, 'user-1');
  });

  it('usa só customer_details.email quando perfil e customer_email não têm e-mail', () => {
    const session = { id: 'cs_2', customer_details: { email: 'cd@example.com' } };
    assert.equal(resolvePaymentRecipientEmail(session, { email: '' }), 'cd@example.com');
    const p = buildPaymentConfirmedPayload({ ...baseInput, session, profile: null });
    assert.equal(p?.email, 'cd@example.com');
    assert.equal(p?.firstName, 'cd');
    assert.equal(p?.amount, 0);
    assert.equal(p?.payment_id, 'cs_2');
  });

  it('devolve null sem e-mail (não deve enviar)', () => {
    assert.equal(
      buildPaymentConfirmedPayload({ ...baseInput, session: { id: 'cs_3' }, profile: null }),
      null,
    );
  });
});

describe('envelope dos eventos de pagamento no n8n (DEV-259)', () => {
  const originalFetch = globalThis.fetch;
  const prevSecret = process.env[SECRET_KEY];
  const prevWebhook = process.env[WEBHOOK_KEY];

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (prevSecret === undefined) delete process.env[SECRET_KEY];
    else process.env[SECRET_KEY] = prevSecret;
    if (prevWebhook === undefined) delete process.env[WEBHOOK_KEY];
    else process.env[WEBHOOK_KEY] = prevWebhook;
  });

  async function capture(event: 'payment.confirmed' | 'refund.requested' | 'payment.refunded', payload: Record<string, unknown>) {
    process.env[WEBHOOK_KEY] = 'http://n8n.test/webhook';
    process.env[SECRET_KEY] = 'fake-secret';
    let sent: { headers?: Record<string, string>; body: Record<string, any> } | undefined;
    globalThis.fetch = mock.fn(async (_u: RequestInfo | URL, init?: RequestInit) => {
      sent = {
        headers: init?.headers as Record<string, string>,
        body: JSON.parse(String(init?.body)),
      };
      return { ok: true } as Response;
    });
    assert.equal(await notify(event, payload), true);
    assert.ok(sent);
    return sent;
  }

  const cases: [Parameters<typeof capture>[0], Record<string, unknown>, number, string][] = [
    ['payment.confirmed', { email: 'a@example.com', amount: 4990, payment_id: 'pi_1', userId: 'u1' }, 4990, 'R$ 49,90'],
    ['refund.requested', { email: 'a@example.com', amount: 0, userId: 'u1' }, 0, 'R$ 0,00'],
    ['payment.refunded', { email: 'a@example.com', amount: 0, userId: 'u1' }, 0, 'R$ 0,00'],
  ];

  for (const [event, payload, amount, formatted] of cases) {
    it(`${event}: envelope, e-mail, amount e Authorization`, async () => {
      const sent = await capture(event, payload);
      assert.equal(sent.body.event, event);
      assert.ok(typeof sent.body.timestamp === 'string');
      assert.ok(sent.body.payload.email);
      assert.equal(sent.body.payload.amount, amount);
      assert.equal(typeof sent.body.payload.amount, 'number');
      assert.equal(sent.body.payload.amount_formatted.replace(/\u00a0/g, ' '), formatted);
      assert.equal(sent.headers?.Authorization, 'fake-secret');
      if (event === 'payment.confirmed') assert.ok(sent.body.payload.payment_id);
      if (event === 'payment.refunded') assert.ok(sent.body.payload.userId);
    });
  }
});
