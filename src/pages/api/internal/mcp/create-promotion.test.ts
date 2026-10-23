import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { signInternalPayload } from '../../../../backend/security/hmac';

process.env.INTERNAL_HMAC_SECRET = 'test-hmac-secret-xyz';

const { POST } = await import('./create-promotion');

describe('POST /api/internal/mcp/create-promotion', () => {
  const secret = 'test-hmac-secret-xyz';

  it('rejeita requisições sem assinatura HMAC (401)', async () => {
    const req = new Request('http://localhost:4321/api/internal/mcp/create-promotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Promoção Teste' }),
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.ok, false);
  });

  it('rejeita payload inválido ou violação do piso de preço (DEV-178)', async () => {
    const now = Date.now();
    // Desconto absurdo de 99% que viola os pisos de preço
    const body = JSON.stringify({
      name: 'Super Promo Abusiva',
      productTypes: ['nome_social'],
      discountType: 'percent',
      discountValue: 99,
      endsAt: new Date(now + 86400000).toISOString(),
      dryRun: true,
    });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/mcp/create-promotion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(now),
      },
      body,
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 422);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.match(data.error, /piso|floor/i);
  });

  it('simula criação com sucesso em dryRun: true respeitando os pisos de preço', async () => {
    const now = Date.now();
    const body = JSON.stringify({
      name: 'Black Friday 10%',
      productTypes: ['nome_social'],
      discountType: 'percent',
      discountValue: 10,
      endsAt: new Date(now + 86400000 * 7).toISOString(),
      bannerText: 'Desconto especial de 10%',
      dryRun: true,
    });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/mcp/create-promotion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(now),
      },
      body,
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.dry_run, true);
    assert.equal(data.status, 'simulated');
    assert.equal(data.simulation.name, 'Black Friday 10%');
    assert.equal(data.simulation.discount_value, 10);
  });
});
