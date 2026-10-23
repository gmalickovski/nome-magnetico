import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { signInternalPayload } from '../../../../backend/security/hmac';

process.env.INTERNAL_HMAC_SECRET = 'test-hmac-secret-xyz';

const mockLead = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'teste@example.com',
  nome_completo: 'Maria Oliveira',
  data_nascimento: '1990-05-15',
  status: 'error',
  error_message: 'Erro anterior',
  created_at: '2026-10-20T10:00:00Z',
};

let leadRecord: any = { ...mockLead };
let updateCalls: any[] = [];
let invokeCalls: any[] = [];

mock.module('../../../../backend/db/supabase', {
  namedExports: {
    getSupabaseAdmin: () => ({
      from: (table: string) => {
        return {
          select: () => ({
            eq: (_field: string, val: string) => ({
              maybeSingle: async () => {
                if (val === mockLead.id) {
                  return { data: leadRecord, error: null };
                }
                return { data: null, error: null };
              },
            }),
          }),
          update: (payload: any) => ({
            eq: (_field: string, id: string) => {
              updateCalls.push({ id, payload });
              return Promise.resolve({ error: null });
            },
          }),
        };
      },
      functions: {
        invoke: async (fn: string, opts: any) => {
          invokeCalls.push({ fn, opts });
          return { data: { success: true }, error: null };
        },
      },
    }),
  },
});

const { POST } = await import('./reprocess-lead');

describe('POST /api/internal/mcp/reprocess-lead', () => {
  const secret = 'test-hmac-secret-xyz';

  beforeEach(() => {
    leadRecord = { ...mockLead };
    updateCalls = [];
    invokeCalls = [];
  });

  it('rejeita requisições sem assinatura HMAC (401)', async () => {
    const req = new Request('http://localhost/api/internal/mcp/reprocess-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: mockLead.id }),
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.ok, false);
  });

  it('rejeita UUID inválido (400)', async () => {
    const rawBody = JSON.stringify({ leadId: 'invalid-uuid' });
    const ts = Date.now();
    const sig = signInternalPayload({ rawBody, timestamp: ts, secret });

    const req = new Request('http://localhost/api/internal/mcp/reprocess-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(ts),
      },
      body: rawBody,
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 400);
  });

  it('retorna 404 se o lead não for encontrado', async () => {
    const unknownId = 'b0000000-0000-0000-0000-000000000002';
    const rawBody = JSON.stringify({ leadId: unknownId });
    const ts = Date.now();
    const sig = signInternalPayload({ rawBody, timestamp: ts, secret });

    const req = new Request('http://localhost/api/internal/mcp/reprocess-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(ts),
      },
      body: rawBody,
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 404);
  });

  it('executa dry_run por padrão sem disparar mutações', async () => {
    const rawBody = JSON.stringify({ leadId: mockLead.id });
    const ts = Date.now();
    const sig = signInternalPayload({ rawBody, timestamp: ts, secret });

    const req = new Request('http://localhost/api/internal/mcp/reprocess-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(ts),
      },
      body: rawBody,
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
    assert.equal(json.status, 'dry_run');
    assert.equal(json.emailMasked, 't***@example.com');
    assert.equal(updateCalls.length, 0);
  });

  it('é idempotente e pula se o lead já estiver complete', async () => {
    leadRecord.status = 'complete';
    const rawBody = JSON.stringify({ leadId: mockLead.id, dryRun: false });
    const ts = Date.now();
    const sig = signInternalPayload({ rawBody, timestamp: ts, secret });

    const req = new Request('http://localhost/api/internal/mcp/reprocess-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(ts),
      },
      body: rawBody,
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
    assert.equal(json.status, 'skipped');
    assert.equal(json.reason, 'already_complete');
    assert.equal(updateCalls.length, 0);
  });

  it('reprocessa o lead quando dryRun é false', async () => {
    const rawBody = JSON.stringify({ leadId: mockLead.id, dryRun: false });
    const ts = Date.now();
    const sig = signInternalPayload({ rawBody, timestamp: ts, secret });

    const req = new Request('http://localhost/api/internal/mcp/reprocess-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(ts),
      },
      body: rawBody,
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
    assert.equal(json.status, 'reprocessed');
    assert.equal(json.emailMasked, 't***@example.com');
    assert.ok(updateCalls.length > 0);
    assert.equal(invokeCalls.length, 1);
    assert.equal(invokeCalls[0].fn, 'send-free-pdf');
  });
});
