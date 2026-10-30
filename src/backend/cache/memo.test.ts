import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  memoize,
  invalidate,
  invalidatePrefix,
  clearCache,
  getCacheEntry,
  invalidateProductPricesCache,
  invalidateFaqCache,
  invalidatePromotionsCache,
  invalidateUserSubscriptionsCache,
} from './memo';

describe('memoize cache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('retorna o valor e não chama fn novamente dentro do TTL', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { data: 'teste' };
    };

    const res1 = await memoize('test:1', 1000, fetcher);
    const res2 = await memoize('test:1', 1000, fetcher);

    assert.deepEqual(res1, { data: 'teste' });
    assert.deepEqual(res2, { data: 'teste' });
    assert.equal(callCount, 1);
  });

  it('reexecuta a função após expirar o TTL', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return `exec_${callCount}`;
    };

    const res1 = await memoize('test:exp', 20, fetcher);
    assert.equal(res1, 'exec_1');

    await new Promise((r) => setTimeout(r, 30));

    const res2 = await memoize('test:exp', 20, fetcher);
    assert.equal(res2, 'exec_2');
    assert.equal(callCount, 2);
  });

  it('suporta TTL dinâmico por resultado (função) e getCacheEntry', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      // Primeira chamada retorna vazio (falha), segunda chamada retorna dados
      return callCount === 1 ? [] : ['item1'];
    };

    const ttlResolver = (result: string[]) => (result.length === 0 ? 30_000 : 300_000);

    const res1 = await memoize('test:dynamic_ttl', ttlResolver, fetcher);
    assert.deepEqual(res1, []);
    assert.equal(callCount, 1);

    const entry1 = getCacheEntry('test:dynamic_ttl');
    assert.ok(entry1, 'Entrada de cache deve existir');
    assert.deepEqual(entry1.value, []);
    const remainingMs1 = entry1.expiresAt - Date.now();
    // O TTL para falha/vazio deve ser <= 30s
    assert.ok(remainingMs1 <= 30_000, `TTL da falha deve ser <= 30s, deu ${remainingMs1}ms`);
    assert.ok(remainingMs1 >= 28_000, `TTL da falha deve ser próximo a 30s, deu ${remainingMs1}ms`);

    // Invalida e simula sucesso
    invalidate('test:dynamic_ttl');
    const res2 = await memoize('test:dynamic_ttl', ttlResolver, fetcher);
    assert.deepEqual(res2, ['item1']);
    assert.equal(callCount, 2);

    const entry2 = getCacheEntry('test:dynamic_ttl');
    assert.ok(entry2);
    assert.deepEqual(entry2.value, ['item1']);
    const remainingMs2 = entry2.expiresAt - Date.now();
    // O TTL para sucesso deve ser de 5 min (300s)
    assert.ok(remainingMs2 > 30_000, 'TTL de sucesso deve ser maior que 30s');
    assert.ok(remainingMs2 >= 295_000, `TTL de sucesso deve ser próximo a 300s, deu ${remainingMs2}ms`);
  });

  it('invalida por chave específica', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return callCount;
    };

    await memoize('key:a', 5000, fetcher);
    await memoize('key:b', 5000, fetcher);
    assert.equal(callCount, 2);

    invalidate('key:a');

    await memoize('key:a', 5000, fetcher);
    await memoize('key:b', 5000, fetcher);

    // key:a reexecutou, key:b usou cache
    assert.equal(callCount, 3);
  });

  it('invalida por prefixo', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return callCount;
    };

    await memoize('faq:item1', 5000, fetcher);
    await memoize('faq:item2', 5000, fetcher);
    await memoize('outro:1', 5000, fetcher);
    assert.equal(callCount, 3);

    invalidatePrefix('faq:');

    await memoize('faq:item1', 5000, fetcher);
    await memoize('outro:1', 5000, fetcher);

    // faq:item1 reexecutou, outro:1 usou cache
    assert.equal(callCount, 4);
  });

  it('deduplica chamadas concorrentes enquanto pendente', async () => {
    let callCount = 0;
    const slowFetcher = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return 'done';
    };

    const [a, b, c] = await Promise.all([
      memoize('concurrent:1', 5000, slowFetcher),
      memoize('concurrent:1', 5000, slowFetcher),
      memoize('concurrent:1', 5000, slowFetcher),
    ]);

    assert.equal(a, 'done');
    assert.equal(b, 'done');
    assert.equal(c, 'done');
    assert.equal(callCount, 1);
  });

  it('helpers de invalidação de domínio funcionam', async () => {
    let count = 0;
    const fetcher = async () => ++count;

    await memoize('product_prices:rows', 5000, fetcher);
    invalidateProductPricesCache();
    await memoize('product_prices:rows', 5000, fetcher);
    assert.equal(count, 2);

    await memoize('faq:all', 5000, fetcher);
    invalidateFaqCache();
    await memoize('faq:all', 5000, fetcher);
    assert.equal(count, 4);

    await memoize('promotions:active', 5000, fetcher);
    invalidatePromotionsCache();
    await memoize('promotions:active', 5000, fetcher);
    assert.equal(count, 6);

    await memoize('user_subs:user-123', 5000, fetcher);
    invalidateUserSubscriptionsCache('user-123');
    await memoize('user_subs:user-123', 5000, fetcher);
    assert.equal(count, 8);
  });
});
