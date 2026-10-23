import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { signInternalPayload } from '../../../../backend/security/hmac';

process.env.INTERNAL_HMAC_SECRET = 'test-hmac-secret-xyz';

const mockLegacyAnalysis = {
  id: 'b0000000-0000-0000-0000-000000000001',
  user_id: 'u0000000-0000-0000-0000-000000000001',
  product_type: 'nome_social',
  nome_completo: 'Carlos Eduardo Silva',
  data_nascimento: '1985-11-20',
  score: 65,
  score_version: 'v1',
  is_free: false,
};

let analysisRecord: any = { ...mockLegacyAnalysis };
let createdAnalyses: any[] = [];
let updateCalls: any[] = [];

mock.module('../../../../backend/db/supabase', {
  namedExports: {
    getSupabaseAdmin: () => ({
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }),
  },
});

mock.module('../../../../backend/db/analyses', {
  namedExports: {
    getAnalysis: async (id: string) => {
      if (id === mockLegacyAnalysis.id) return analysisRecord;
      return null;
    },
    createAnalysis: async (input: any) => {
      const created = { id: 'c0000000-0000-0000-0000-000000000002', ...input };
      createdAnalyses.push(created);
      return created;
    },
    updateAnalysis: async (id: string, payload: any) => {
      updateCalls.push({ id, payload });
      return { id, ...payload };
    },
  },
});

const { POST } = await import('./recalc-f5');

describe('POST /api/internal/mcp/recalc-f5', () => {
  const secret = 'test-hmac-secret-xyz';

  beforeEach(() => {
    analysisRecord = { ...mockLegacyAnalysis };
    createdAnalyses = [];
    updateCalls = [];
  });

  it('rejeita requisições sem assinatura HMAC (401)', async () => {
    const req = new Request('http://localhost:4321/api/internal/mcp/recalc-f5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisId: mockLegacyAnalysis.id }),
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 401);
  });

  it('retorna 404 para análise inexistente', async () => {
    const now = Date.now();
    const body = JSON.stringify({
      analysisId: '00000000-0000-0000-0000-000000000000',
      dryRun: true,
    });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/mcp/recalc-f5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(now),
      },
      body,
    });

    const res = await POST({ request: req } as any);
    assert.equal(res.status, 404);
  });

  it('executa simulação em dryRun: true sem criar nova análise no banco', async () => {
    const now = Date.now();
    const body = JSON.stringify({
      analysisId: mockLegacyAnalysis.id,
      dryRun: true,
    });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/mcp/recalc-f5', {
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
    assert.equal(typeof data.prospectiveScoreV3, 'number');
    assert.equal(createdAnalyses.length, 0);
  });

  it('executa recálculo real em dryRun: false e salva versão v3 vinculada à original', async () => {
    const now = Date.now();
    const body = JSON.stringify({
      analysisId: mockLegacyAnalysis.id,
      dryRun: false,
    });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/mcp/recalc-f5', {
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
    assert.equal(data.dry_run, false);
    assert.equal(data.status, 'recalculated');
    assert.equal(data.newAnalysisId, 'c0000000-0000-0000-0000-000000000002');
    assert.equal(typeof data.scoreV3, 'number');
    assert.equal(createdAnalyses.length, 1);
    assert.equal(updateCalls.length, 1);
  });
});
