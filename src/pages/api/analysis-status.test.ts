import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import {
  getBackoffDelay,
  BACKOFF_DELAYS_SECONDS,
  MAX_BACKOFF_DELAY_SECONDS,
} from '../../utils/analysis-polling';

const mockUserId = '11111111-1111-4111-a111-111111111111';
const mockAnalysisId = '22222222-2222-4222-a222-222222222222';
const STALE_ERROR_MESSAGE =
  'A análise expirou antes de concluir (tempo limite do servidor). Você pode tentar novamente.';

let analysisRow: {
  id: string;
  status: string;
  created_at: string;
  error_message: string | null;
  user_id: string;
} | null = null;
let updateCalls: Array<{ payload: any; filters: Record<string, string> }> = [];

const mockSupabase = {
  auth: {
    getUser: async (token: string) => {
      if (token === 'valid-token') {
        return { data: { user: { id: mockUserId } }, error: null };
      }
      return { data: { user: null }, error: new Error('Invalid token') };
    },
  },
  from: (table: string) => {
    const filters: Record<string, string> = {};

    const builder: any = {
      select: (_cols?: string) => builder,
      eq: (col: string, val: string) => {
        filters[col] = val;
        return builder;
      },
      single: async () => {
        if (table === 'analyses') {
          if (!analysisRow) {
            return { data: null, error: new Error('Row not found') };
          }
          if (filters.id && filters.id !== mockAnalysisId) {
            return { data: null, error: new Error('Row not found') };
          }
          if (filters.user_id && filters.user_id !== mockUserId) {
            return { data: null, error: new Error('Row not found') };
          }
          return {
            data: {
              id: analysisRow.id,
              status: analysisRow.status,
              created_at: analysisRow.created_at,
              error_message: analysisRow.error_message,
              user_id: analysisRow.user_id,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
    };

    return builder;
  },
};

mock.module('../../backend/db/supabase', {
  namedExports: {
    supabase: mockSupabase,
    getSupabaseAdmin: () => mockSupabase,
  },
});

mock.module('../../backend/db/analysis-processing', {
  namedExports: {
    STALE_ERROR_MESSAGE,
    ANALYSIS_STALE_PROCESSING_MS: 10 * 60 * 1000,
    reconcileStaleAnalysis: async (analysis: any) => {
      const isStale =
        (analysis.status === 'pending' || analysis.status === 'processing') &&
        Date.now() - new Date(analysis.created_at).getTime() >= 10 * 60 * 1000;

      if (isStale) {
        updateCalls.push({
          payload: { status: 'error', error_message: STALE_ERROR_MESSAGE },
          filters: { id: analysis.id },
        });
        return {
          ...analysis,
          status: 'error',
          error_message: STALE_ERROR_MESSAGE,
        };
      }
      return analysis;
    },
  },
});

const { GET } = await import('./analysis-status');

describe('Sequência de Backoff (analysis-polling)', () => {
  it('segue a sequência exata de backoff: 5, 10, 20, 40, 60, 60... s', () => {
    assert.equal(getBackoffDelay(0), 5);
    assert.equal(getBackoffDelay(1), 10);
    assert.equal(getBackoffDelay(2), 20);
    assert.equal(getBackoffDelay(3), 40);
    assert.equal(getBackoffDelay(4), 60);
    assert.equal(getBackoffDelay(5), 60);
    assert.equal(getBackoffDelay(10), 60);

    const generated = [0, 1, 2, 3, 4, 5, 6].map(getBackoffDelay);
    assert.deepEqual(generated, [5, 10, 20, 40, 60, 60, 60]);
  });

  it('lida com índices negativos retornando o primeiro intervalo (5s)', () => {
    assert.equal(getBackoffDelay(-1), 5);
  });
});

describe('GET /api/analysis-status', () => {
  beforeEach(() => {
    analysisRow = null;
    updateCalls = [];
  });

  it('rejeita requisições não autenticadas com 401', async () => {
    const req = new Request(`http://localhost:4321/api/analysis-status?id=${mockAnalysisId}`);
    const res = await GET({ request: req, locals: {} } as any);

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Autenticação necessária');
  });

  it('rejeita IDs inválidos com 400', async () => {
    const req = new Request('http://localhost:4321/api/analysis-status?id=not-a-valid-uuid');
    const res = await GET({
      request: req,
      locals: { user: { id: mockUserId } },
    } as any);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'ID de análise inválido');
  });

  it('retorna 404 se a análise não existir para o usuário', async () => {
    analysisRow = null;
    const req = new Request(`http://localhost:4321/api/analysis-status?id=${mockAnalysisId}`);
    const res = await GET({
      request: req,
      locals: { user: { id: mockUserId } },
    } as any);

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Análise não encontrada');
  });

  it('o endpoint devolve o status quando em processing recente', async () => {
    analysisRow = {
      id: mockAnalysisId,
      status: 'processing',
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      error_message: null,
      user_id: mockUserId,
    };

    const req = new Request(`http://localhost:4321/api/analysis-status?id=${mockAnalysisId}`);
    const res = await GET({
      request: req,
      locals: { user: { id: mockUserId } },
    } as any);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, {
      id: mockAnalysisId,
      status: 'processing',
      error: null,
    });
    assert.equal(updateCalls.length, 0);
  });

  it('o endpoint devolve o status quando complete', async () => {
    analysisRow = {
      id: mockAnalysisId,
      status: 'complete',
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      error_message: null,
      user_id: mockUserId,
    };

    const req = new Request(`http://localhost:4321/api/analysis-status?id=${mockAnalysisId}`);
    const res = await GET({
      request: req,
      locals: { user: { id: mockUserId } },
    } as any);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, {
      id: mockAnalysisId,
      status: 'complete',
      error: null,
    });
    assert.equal(updateCalls.length, 0);
  });

  it('a análise presa há mais de 10 min vira error e atualiza o banco via reconcileStaleAnalysis', async () => {
    analysisRow = {
      id: mockAnalysisId,
      status: 'processing',
      created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
      error_message: null,
      user_id: mockUserId,
    };

    const req = new Request(`http://localhost:4321/api/analysis-status?id=${mockAnalysisId}`);
    const res = await GET({
      request: req,
      locals: { user: { id: mockUserId } },
    } as any);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, {
      id: mockAnalysisId,
      status: 'error',
      error: STALE_ERROR_MESSAGE,
    });

    assert.equal(updateCalls.length, 1);
    const update = updateCalls[0];
    assert.equal(update.payload.status, 'error');
    assert.equal(update.payload.error_message, STALE_ERROR_MESSAGE);
    assert.equal(update.filters.id, mockAnalysisId);
  });

  it('autentica com sucesso via Authorization Bearer token', async () => {
    analysisRow = {
      id: mockAnalysisId,
      status: 'processing',
      created_at: new Date().toISOString(),
      error_message: null,
      user_id: mockUserId,
    };

    const req = new Request(`http://localhost:4321/api/analysis-status?id=${mockAnalysisId}`, {
      headers: { Authorization: 'Bearer valid-token' },
    });
    const res = await GET({ request: req, locals: {} } as any);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, {
      id: mockAnalysisId,
      status: 'processing',
      error: null,
    });
  });
});
