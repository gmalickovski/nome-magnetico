import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  memoize,
  invalidate,
  invalidatePrefix,
  clearCache,
  invalidateProductPricesCache,
  invalidateFaqCache,
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

    await memoize('user_subs:user-123', 5000, fetcher);
    invalidateUserSubscriptionsCache('user-123');
    await memoize('user_subs:user-123', 5000, fetcher);
    assert.equal(count, 6);
  });
});
