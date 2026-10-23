import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { signInternalPayload } from '../../../../backend/security/hmac';
import { LEGAL_DISCLAIMER } from '../../../../backend/client-mcp/sanitize';

process.env.INTERNAL_HMAC_SECRET = 'test-client-hmac-secret-123';

const mockUserId = 'd0000000-0000-0000-0000-000000000001';
const mockAnalysisId = 'e0000000-0000-0000-0000-000000000001';

const mockSub = {
  id: 'sub-1',
  user_id: mockUserId,
  product_type: 'nome_social',
  ends_at: new Date(Date.now() + 86400000 * 20).toISOString(),
  refunded_at: null,
};

const mockAnalysis = {
  id: mockAnalysisId,
  user_id: mockUserId,
  product_type: 'nome_social',
  nome_completo: 'Juliana Mendes Rocha',
  data_nascimento: '1992-04-10',
  score: 85,
  score_v3: 88,
  score_version: 'v3',
  numero_expressao: 7,
  numero_destino: 7,
  numero_motivacao: 9,
  numero_missao: 5,
  numero_impressao: 7,
  created_at: new Date().toISOString(),
};

let activeSubRecord: any = { ...mockSub };
let analysisRecord: any = { ...mockAnalysis };

mock.module('../../../../backend/db/supabase', {
  namedExports: {
    getSupabaseAdmin: () => ({
      from: (table: string) => ({
        select: () => ({
          eq: (_col: string, val: string) => ({
            gt: () => ({
              is: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: activeSubRecord, error: null }),
                  }),
                }),
              }),
            }),
            eq: () => ({
              maybeSingle: async () => ({ data: analysisRecord, error: null }),
            }),
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: analysisRecord, error: null }),
              }),
            }),
            maybeSingle: async () => ({ data: analysisRecord, error: null }),
          }),
        }),
      }),
    }),
  },
});

const { POST: postScore } = await import('./score');
const { POST: postGenerate } = await import('./generate');
const { POST: postExplain } = await import('./explain');

describe('Client MCP Internal Endpoints (DEV-208)', () => {
  const secret = 'test-client-hmac-secret-123';

  beforeEach(() => {
    activeSubRecord = { ...mockSub };
    analysisRecord = { ...mockAnalysis };
  });

  it('rejeita chamadas sem assinatura HMAC (401)', async () => {
    const req = new Request('http://localhost:4321/api/internal/client-mcp/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: mockUserId }),
    });

    const res = await postScore({ request: req } as any);
    assert.equal(res.status, 401);
  });

  it('rejeita chamadas de usuários sem assinatura ativa (403)', async () => {
    activeSubRecord = null;
    const now = Date.now();
    const body = JSON.stringify({ userId: mockUserId });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/client-mcp/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(now),
      },
      body,
    });

    const res = await postScore({ request: req } as any);
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.error, /assinatura ativa/i);
  });

  it('POST /score retorna score sanitizado com aviso legal e sem expor fórmulas nem saúde', async () => {
    const now = Date.now();
    const body = JSON.stringify({ userId: mockUserId, analysisId: mockAnalysisId });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/client-mcp/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(now),
      },
      body,
    });

    const res = await postScore({ request: req } as any);
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.ok, true);
    assert.equal(data.score, 88);
    assert.equal(data.nivel, 'Harmonioso');
    assert.equal(data.aviso_legal, LEGAL_DISCLAIMER);
    assert.equal(data.numeros_principais.expressao, 7);

    // Garantir que nenhuma chave proibida de saúde ou fórmula existe
    const jsonStr = JSON.stringify(data);
    assert.equal(/aspectosaude|saude|pesos|formula/i.test(jsonStr), false);
    assert.equal(/anthropic|claude|groq|openai|studio\s*mlk/i.test(jsonStr), false);
  });

  it('POST /generate gera candidatos compatíveis com aviso legal', async () => {
    const now = Date.now();
    const body = JSON.stringify({
      userId: mockUserId,
      nomeCompleto: 'Juliana Mendes Rocha',
      dataNascimento: '10/04/1992',
      nomesCandidatos: ['Juliana Rocha', 'Ju Mendes'],
    });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/client-mcp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(now),
      },
      body,
    });

    const res = await postGenerate({ request: req } as any);
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.ok, true);
    assert.equal(typeof data.melhor_nome?.nome_completo, 'string');
    assert.equal(data.aviso_legal, LEGAL_DISCLAIMER);
    assert.equal(Array.isArray(data.candidatos_avaliados), true);
  });

  it('POST /explain retorna explicação didática com aviso legal', async () => {
    const now = Date.now();
    const body = JSON.stringify({
      userId: mockUserId,
      score: 85,
      nivel: 'Harmonioso',
    });
    const sig = signInternalPayload({ rawBody: body, timestamp: now, secret });

    const req = new Request('http://localhost:4321/api/internal/client-mcp/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': sig,
        'X-Internal-Timestamp': String(now),
      },
      body,
    });

    const res = await postExplain({ request: req } as any);
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.ok, true);
    assert.equal(data.nivel, 'Harmonioso');
    assert.equal(typeof data.explicacao, 'string');
    assert.equal(data.aviso_legal, LEGAL_DISCLAIMER);
    assert.equal(Array.isArray(data.recomendacoes_praticas), true);
  });
});
