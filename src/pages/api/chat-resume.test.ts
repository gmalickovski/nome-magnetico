import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

interface StoredChoiceRow {
  id: string;
  user_id: string;
  analysis_id: string | null;
  chosen_signature: string | null;
  source: 'card_pdf' | 'paywall_free' | null;
  stripe_session_id: string;
  pdf_generated_at: string | null;
  created_at: string;
}

let hasActive = false;
let choiceRows: StoredChoiceRow[] = [];

function chatChoicesTable() {
  let filterUserId: string | null = null;
  let filterId: string | null = null;
  let filterSessionId: string | null = null;
  let requireNullPdf = false;
  let pendingUpdate: Partial<StoredChoiceRow> | null = null;

  const builder = {
    select() {
      return builder;
    },
    eq(col: string, val: string) {
      if (col === 'user_id') filterUserId = val;
      if (col === 'id') filterId = val;
      if (col === 'stripe_session_id') filterSessionId = val;
      return builder;
    },
    is(col: string, val: unknown) {
      if (col === 'pdf_generated_at' && val === null) requireNullPdf = true;
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return builder;
    },
    update(values: Partial<StoredChoiceRow>) {
      pendingUpdate = values;
      return builder;
    },
    upsert(row: Omit<StoredChoiceRow, 'id' | 'pdf_generated_at' | 'created_at'>) {
      const existing = choiceRows.find((r) => r.stripe_session_id === row.stripe_session_id);
      if (!existing) {
        choiceRows.push({
          id: `choice-${choiceRows.length + 1}`,
          user_id: row.user_id,
          analysis_id: row.analysis_id,
          chosen_signature: row.chosen_signature,
          source: row.source,
          stripe_session_id: row.stripe_session_id,
          pdf_generated_at: null,
          created_at: new Date().toISOString(),
        });
      }
      return Promise.resolve({ data: null, error: null });
    },
    maybeSingle() {
      if (pendingUpdate) {
        const target = choiceRows.find((r) => {
          if (filterUserId && r.user_id !== filterUserId) return false;
          if (filterId && r.id !== filterId) return false;
          if (filterSessionId && r.stripe_session_id !== filterSessionId) return false;
          if (requireNullPdf && r.pdf_generated_at !== null) return false;
          return true;
        });
        if (!target) {
          return Promise.resolve({ data: null, error: null });
        }
        Object.assign(target, pendingUpdate);
        return Promise.resolve({ data: { id: target.id }, error: null });
      }

      const matching = choiceRows.filter((r) => !filterUserId || r.user_id === filterUserId);
      const latest = matching[matching.length - 1] ?? null;
      return Promise.resolve({ data: latest, error: null });
    },
  };

  return builder;
}

mock.module('../../backend/db/subscriptions', {
  namedExports: {
    hasActiveSubscription: async () => hasActive,
  },
});

mock.module('../../backend/db/supabase', {
  namedExports: {
    supabase: {
      from(table: string) {
        if (table === 'chat_checkout_choices') return chatChoicesTable();
        throw new Error(`unexpected table ${table}`);
      },
    },
  },
});

const { GET: getChatResume } = await import('./chat-resume.ts');
const { POST: postMarkPdf } = await import('./chat-resume/mark-pdf.ts');

describe('chat-resume & mark-pdf · DEV-261', () => {
  beforeEach(() => {
    hasActive = false;
    choiceRows = [];
  });

  it('GET /api/chat-resume exige autenticação (401)', async () => {
    const res = await getChatResume({ locals: {} } as Parameters<typeof getChatResume>[0]);
    assert.equal(res.status, 401);
  });

  it('GET /api/chat-resume devolve paid: false sem assinatura ativa e não vaza choice', async () => {
    hasActive = false;
    choiceRows.push({
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'user-1',
      analysis_id: '11111111-2222-4333-8444-555555555555',
      chosen_signature: 'Maria Clara Luz',
      source: 'card_pdf',
      stripe_session_id: 'cs_test_1',
      pdf_generated_at: null,
      created_at: new Date().toISOString(),
    });

    const res = await getChatResume({
      locals: { user: { id: 'user-1' } },
    } as Parameters<typeof getChatResume>[0]);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { paid: false });
  });

  it('GET /api/chat-resume devolve paid: true + choice quando assinatura está ativa', async () => {
    hasActive = true;
    choiceRows.push({
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'user-1',
      analysis_id: '11111111-2222-4333-8444-555555555555',
      chosen_signature: 'Maria Clara Luz',
      source: 'card_pdf',
      stripe_session_id: 'cs_test_1',
      pdf_generated_at: null,
      created_at: new Date().toISOString(),
    });

    const res = await getChatResume({
      locals: { user: { id: 'user-1' } },
    } as Parameters<typeof getChatResume>[0]);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, {
      paid: true,
      choice: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        analysis_id: '11111111-2222-4333-8444-555555555555',
        chosen_signature: 'Maria Clara Luz',
        source: 'card_pdf',
        pdf_generated: false,
      },
    });
  });

  it('POST /api/chat-resume/mark-pdf marca pdf_generated_at apenas na 1ª chamada (idempotente)', async () => {
    hasActive = true;
    const choiceId = '550e8400-e29b-41d4-a716-446655440000';
    choiceRows.push({
      id: choiceId,
      user_id: 'user-1',
      analysis_id: null,
      chosen_signature: 'Maria Clara Luz',
      source: 'card_pdf',
      stripe_session_id: 'cs_test_1',
      pdf_generated_at: null,
      created_at: new Date().toISOString(),
    });

    const req1 = new Request('http://localhost/api/chat-resume/mark-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choiceId }),
    });
    const res1 = await postMarkPdf({
      request: req1,
      locals: { user: { id: 'user-1' } },
    } as Parameters<typeof postMarkPdf>[0]);
    const body1 = await res1.json();
    assert.equal(res1.status, 200);
    assert.equal(body1.marked, true);

    const req2 = new Request('http://localhost/api/chat-resume/mark-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choiceId }),
    });
    const res2 = await postMarkPdf({
      request: req2,
      locals: { user: { id: 'user-1' } },
    } as Parameters<typeof postMarkPdf>[0]);
    const body2 = await res2.json();
    assert.equal(res2.status, 200);
    assert.equal(body2.marked, false);
  });
});
