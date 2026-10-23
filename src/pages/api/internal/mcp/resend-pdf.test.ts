import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { signInternalPayload } from '../../../../backend/security/hmac';

process.env.INTERNAL_HMAC_SECRET = 'test-hmac-secret-xyz';

const mockLead = {
  id: 'c0000000-0000-0000-0000-000000000001',
  email: 'cliente@example.com',
  nome_completo: 'Carlos Santos',
  data_nascimento: '1985-11-20',
  status: 'complete',
  pdf_path: 'c0000000-0000-0000-0000-000000000001.pdf',
  created_at: '2026-10-21T12:00:00Z',
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

const { POST } = await import('./resend-pdf');

describe('POST /api/internal/mcp/resend-pdf', () => {
  const secret = 'test-hmac-secret-xyz';

  beforeEach(() => {
    leadRecord = { ...mockLead };
    updateCalls = [];
    invokeCalls = [];
  });

  it('rejeita requisições sem assinatura HMAC (401)', async () => {
    const req = new Request('http://localhost/api/internal/mcp/resend-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: mockLead.id }),
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 401);
  });

  it('retorna 404 para lead inexistente', async () => {
    const unknownId = 'd0000000-0000-0000-0000-000000000002';
    const rawBody = JSON.stringify({ leadId: unknownId });
    const ts = Date.now();
    const sig = signInternalPayload({ rawBody, timestamp: ts, secret });

    const req = new Request('http://localhost/api/internal/mcp/resend-pdf', {
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

  it('executa dry_run por padrão sem invocar envio', async () => {
    const rawBody = JSON.stringify({ leadId: mockLead.id });
    const ts = Date.now();
    const sig = signInternalPayload({ rawBody, timestamp: ts, secret });

    const req = new Request('http://localhost/api/internal/mcp/resend-pdf', {
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
    assert.equal(json.hasPdf, true);
    assert.equal(invokeCalls.length, 0);
  });

  it('reenvia PDF quando dryRun é false', async () => {
    const rawBody = JSON.stringify({ leadId: mockLead.id, dryRun: false });
    const ts = Date.now();
    const sig = signInternalPayload({ rawBody, timestamp: ts, secret });

    const req = new Request('http://localhost/api/internal/mcp/resend-pdf', {
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
    assert.equal(json.status, 'sent');
    assert.equal(json.emailMasked, 'c***@example.com');
    assert.equal(invokeCalls.length, 1);
    assert.equal(invokeCalls[0].fn, 'send-free-pdf');
    assert.deepEqual(invokeCalls[0].opts, { body: { leadId: mockLead.id } });
  });
});
