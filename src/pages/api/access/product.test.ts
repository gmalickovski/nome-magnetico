import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

let hasActive = false;

mock.module('../../../backend/db/subscriptions', {
  namedExports: {
    hasActiveSubscription: async () => hasActive,
  },
});

const { GET } = await import('./product.ts');

describe('GET /api/access/product', () => {
  it('exige sessão', async () => {
    const res = await GET({
      url: new URL('http://localhost/api/access/product?product=nome_social'),
      locals: {},
    } as Parameters<typeof GET>[0]);
    assert.equal(res.status, 401);
  });

  it('reflete hasActiveSubscription no servidor', async () => {
    hasActive = true;
    const res = await GET({
      url: new URL('http://localhost/api/access/product?product=nome_social'),
      locals: { user: { id: 'user-1' } },
    } as Parameters<typeof GET>[0]);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.active, true);
    assert.equal(body.product, 'nome_social');
  });
});
