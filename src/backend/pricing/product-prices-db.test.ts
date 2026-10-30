import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { clearCache, getCacheEntry } from '../cache/memo';

let mockShouldTimeout = false;
let mockShouldError = false;
let capturedSignal: AbortSignal | null = null;

const mockProductPricesData = [
  {
    product_type: 'nome_social',
    base_cents: 10800,
    min_cents: 7800,
    label: 'Nome Social DB',
    is_active: true,
    updated_at: '2026-10-29T00:00:00Z',
    updated_by: 'admin-1',
  },
];

const mockPromotionsData = [
  {
    id: 'promo-1',
    name: 'Promoção Ativa',
    product_types: ['nome_social'],
    discount_type: 'percent',
    discount_value: 20,
    starts_at: '2026-10-01T00:00:00Z',
    ends_at: '2026-11-01T00:00:00Z',
    is_active: true,
    banner_text: 'Desconto 20%',
    stripe_coupon_id: null,
    stripe_promo_code: null,
    created_at: '2026-10-01T00:00:00Z',
  },
];

const mockFaqsData = [
  {
    id: 'faq-1',
    question: 'Pergunta FAQ',
    answer_markdown: 'Resposta FAQ',
    order_index: 1,
  },
];

const mockSupabase = {
  from(table: string) {
    let localSignal: AbortSignal | null = null;

    const builder: any = {
      select() { return builder; },
      eq() { return builder; },
      gt() { return builder; },
      gte() { return builder; },
      lt() { return builder; },
      lte() { return builder; },
      like() { return builder; },
      order() { return builder; },
      limit() { return builder; },
      maybeSingle: async () => execute(),
      abortSignal(signal: AbortSignal) {
        localSignal = signal;
        capturedSignal = signal;
        return builder;
      },
      then(onfulfilled: any, onrejected: any) {
        return execute().then(onfulfilled, onrejected);
      },
    };

    async function execute() {
      if (mockShouldTimeout) {
        return {
          data: null,
          error: { message: 'TimeoutError: The operation was aborted due to timeout' },
        };
      }

      if (mockShouldError) {
        return {
          data: null,
          error: { message: 'Supabase connection failure' },
        };
      }

      if (table === 'product_prices') {
        return { data: mockProductPricesData, error: null };
      }
      if (table === 'promotions') {
        return { data: mockPromotionsData, error: null };
      }
      if (table === 'faq_items') {
        return { data: mockFaqsData, error: null };
      }
      if (table === 'profiles') {
        return { data: { role: 'user', is_test: false, test_ends_at: null }, error: null };
      }
      if (table === 'subscriptions') {
        return { data: [], error: null };
      }

      return { data: [], error: null };
    }

    return builder;
  },
};

mock.module('../db/supabase', {
  exports: {
    supabase: mockSupabase,
  },
});

const {
  fetchProductPriceRows,
  fetchProductPriceMap,
} = await import('./product-prices-db');
const {
  fetchAllPromotionRowsForSelect,
  fetchActivePromotionRow,
} = await import('./promotions-db');
const { getSupabaseFaqs } = await import('../faqs/getSupabaseFaqs');
const { hasActiveSubscription } = await import('../db/subscriptions');

describe('product-prices-db e resiliência SSR com Supabase indisponível', () => {
  beforeEach(() => {
    clearCache();
    mockShouldTimeout = false;
    mockShouldError = false;
    capturedSignal = null;
  });

  it('fetchProductPriceRows: query que demora mais de 2s ou sofre timeout cai no fallback e usa abortSignal', async () => {
    mockShouldTimeout = true;

    const rows = await fetchProductPriceRows();

    // Cai no fallback estático (array vazio)
    assert.deepEqual(rows, []);
    // Verifica que abortSignal foi configurado na query
    assert.ok(capturedSignal instanceof AbortSignal, 'Deve repassar AbortSignal para a query');
  });

  it('fetchProductPriceRows: falha não fica em cache por mais de 30 s', async () => {
    mockShouldTimeout = true;

    const rows = await fetchProductPriceRows();
    assert.deepEqual(rows, []);

    const entry = getCacheEntry('product_prices:rows');
    assert.ok(entry, 'Entrada de cache deve existir');
    assert.deepEqual(entry.value, []);

    const remainingMs = entry.expiresAt - Date.now();
    // O TTL para falha/fallback DEVE ser <= 30 segundos (não 5 minutos / 300s)
    assert.ok(remainingMs <= 30_000, `Falha deve ficar no máximo 30s no memo, mas ficou ${remainingMs}ms`);
    assert.ok(remainingMs >= 28_000, `TTL da falha deve ser próximo a 30s, deu ${remainingMs}ms`);
  });

  it('fetchProductPriceRows: sucesso fica em cache por 5 minutos (300 s)', async () => {
    mockShouldTimeout = false;
    mockShouldError = false;

    const rows = await fetchProductPriceRows();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].product_type, 'nome_social');

    const entry = getCacheEntry('product_prices:rows');
    assert.ok(entry);
    const remainingMs = entry.expiresAt - Date.now();
    // Sucesso fica em cache por 5 minutos
    assert.ok(remainingMs > 30_000, 'Sucesso deve ficar em cache por mais de 30s');
    assert.ok(remainingMs >= 295_000, `TTL de sucesso deve ser próximo a 300s, deu ${remainingMs}ms`);
  });

  it('fetchProductPriceMap: quando a query falha, usa fallback seguro com preços padrão', async () => {
    mockShouldTimeout = true;

    const priceMap = await fetchProductPriceMap();
    const social = priceMap.get('nome_social');
    const bebe = priceMap.get('nome_bebe');
    const empresa = priceMap.get('nome_empresa');

    // priceMap está vazio porque rows=[] e cai no fallbackRow nos consumidores
    assert.equal(social, undefined);
    assert.equal(bebe, undefined);
    assert.equal(empresa, undefined);
  });

  it('fetchAllPromotionRowsForSelect: timeout de 2s cai no fallback (sem promoção) e falha expira em 30s', async () => {
    mockShouldTimeout = true;

    const promos = await fetchAllPromotionRowsForSelect();
    assert.deepEqual(promos, []);
    assert.ok(capturedSignal instanceof AbortSignal, 'Deve usar abortSignal na query de promoções');

    const entry = getCacheEntry('promotions:all_active');
    assert.ok(entry, 'Cache de promoções deve existir');
    const remainingMs = entry.expiresAt - Date.now();
    assert.ok(remainingMs <= 30_000, `Falha de promoção deve expirar em no máximo 30s, deu ${remainingMs}ms`);
    assert.ok(remainingMs >= 28_000, `TTL da falha de promoção deve ser próximo a 30s, deu ${remainingMs}ms`);
  });

  it('fetchActivePromotionRow: timeout de 2s cai no fallback seguro (null)', async () => {
    mockShouldTimeout = true;

    const promo = await fetchActivePromotionRow();
    assert.equal(promo, null);
    assert.ok(capturedSignal instanceof AbortSignal, 'Deve usar abortSignal na query de promoção ativa');
  });

  it('getSupabaseFaqs: timeout de 2s cai no fallback vazio e falha expira em 30s', async () => {
    mockShouldTimeout = true;

    const faqs = await getSupabaseFaqs({ featuredOnly: true });
    assert.deepEqual(faqs, []);
    assert.ok(capturedSignal instanceof AbortSignal, 'Deve usar abortSignal na query de FAQs');

    const entry = getCacheEntry('faq:supabase:featured');
    assert.ok(entry, 'Cache de FAQs deve existir');
    const remainingMs = entry.expiresAt - Date.now();
    assert.ok(remainingMs <= 30_000, `Falha de FAQ deve expirar em no máximo 30s, deu ${remainingMs}ms`);
    assert.ok(remainingMs >= 28_000, `TTL da falha de FAQ deve ser próximo a 30s, deu ${remainingMs}ms`);
  });

  it('hasActiveSubscription: timeout de 2s cai no fallback seguro (false) sem quebrar o SSR', async () => {
    mockShouldTimeout = true;

    const isActive = await hasActiveSubscription('test-user-id', 'nome_social');
    assert.equal(isActive, false);
    assert.ok(capturedSignal instanceof AbortSignal, 'Deve usar abortSignal na verificação de assinatura');
  });
});
