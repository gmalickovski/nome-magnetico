import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let mockReusableFreeAnalysis: { id: string; status: string } | null = null;
let mockHasUsedFreeAnalysis = false;
let mockCreatedAnalysisId = 'created-free-id-1';
let createAnalysisCalls = 0;

const mockUserSupabase = {
  from: (_table: string) => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      single: async () => ({
        data: {
          gender: 'Feminino',
          role: 'user',
          email: 'user@example.com',
          nome: 'Maria Silva',
          birth_name: 'Maria Silva',
          birth_date: '1990-01-01',
        },
        error: null,
      }),
      update: () => builder,
      insert: async () => ({ data: null, error: null }),
    };
    return builder;
  },
};

mock.module('../../backend/db/supabase', {
  namedExports: {
    supabase: mockUserSupabase,
    createUserClient: () => mockUserSupabase,
  },
});

mock.module('../../backend/db/subscriptions', {
  namedExports: {
    hasActiveSubscription: async () => false,
  },
});

mock.module('../../backend/db/analyses', {
  namedExports: {
    createAnalysis: async () => {
      createAnalysisCalls += 1;
      const id = mockCreatedAnalysisId;
      mockReusableFreeAnalysis = { id, status: 'complete' };
      mockHasUsedFreeAnalysis = true;
      return { id, status: 'pending' };
    },
    updateAnalysis: async () => null,
    saveMagneticNames: async () => [],
    hasUsedFreeAnalysis: async () => mockHasUsedFreeAnalysis,
    findRecentNomeSocialAnalysisForPdf: async () => null,
    findReusableFreeAnalysisForUser: async () => mockReusableFreeAnalysis,
  },
});

mock.module('../../backend/db/analysis-processing', {
  namedExports: {
    failStaleAnalysesForUser: async () => {},
    markAnalysisFailed: async () => {},
    STALE_ERROR_MESSAGE: 'stale',
  },
});

const { buildSelectedSocialSummary, POST } = await import('./analyze.ts');

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const analyzeSrc = readFileSync(path.join(currentDir, 'analyze.ts'), 'utf8');
const analysesDbSrc = readFileSync(
  path.join(currentDir, '../../backend/db/analyses.ts'),
  'utf8'
);
const nomeSocialChatSrc = readFileSync(
  path.join(currentDir, '../../frontend/components/app/chat/NomeSocialChat.tsx'),
  'utf8'
);

describe('analyze chat PDF (sem LLM)', () => {
  beforeEach(() => {
    mockReusableFreeAnalysis = null;
    mockHasUsedFreeAnalysis = false;
    mockCreatedAnalysisId = 'free-analysis-123';
    createAnalysisCalls = 0;
  });

  it('reutiliza análise recente quando nome_ja_escolhido + nome_social_principal', () => {
    assert.match(analyzeSrc, /isChatPdfChosenSocial/);
    assert.match(analyzeSrc, /findRecentNomeSocialAnalysisForPdf/);
    assert.match(analyzeSrc, /reused:\s*true/);
  });

  it('ramo nome escolhido chama buildSelectedSocialSummary antes de generateSocialAnalysis', () => {
    const idxChosen = analyzeSrc.indexOf('if (nome_social_principal || nome_ja_escolhido)');
    const idxSocialAi = analyzeSrc.indexOf('await withTimeout(generateSocialAnalysis');
    assert.ok(idxChosen >= 0 && idxSocialAi > idxChosen);
    const chosenBranch = analyzeSrc.slice(idxChosen, idxSocialAi);
    assert.match(chosenBranch, /buildSelectedSocialSummary/);
  });

  it('buildSelectedSocialSummary monta texto determinístico', () => {
    const text = buildSelectedSocialSummary({
      nomeNascimento: 'Maria Silva',
      nomeSocial: 'Ana Silva',
      score: 88,
      bloqueios: 0,
      compatibilidade: 'total',
    });
    assert.match(text, /Ana Silva/);
    assert.match(text, /Maria Silva/);
    assert.match(text, /88/);
  });

  it('define findReusableFreeAnalysisForUser em src/backend/db/analyses.ts com filtros corretos', () => {
    assert.match(analysesDbSrc, /export async function findReusableFreeAnalysisForUser/);
    assert.match(analysesDbSrc, /\.or\('is_free\.eq\.true,product_type\.eq\.analise_gratuita'\)/);
    assert.match(analysesDbSrc, /\.in\('status',\s*\['complete',\s*'processing',\s*'pending'\]\)/);
  });

  it('verifica findReusableFreeAnalysisForUser antes de hasUsedFreeAnalysis quando isGratuita e nome_ja_escolhido === true', () => {
    const idxReusable = analyzeSrc.indexOf('findReusableFreeAnalysisForUser(user.id)');
    const idxHasUsed = analyzeSrc.indexOf('hasUsedFreeAnalysis(user.id)');
    assert.ok(idxReusable >= 0 && idxHasUsed > idxReusable);
  });

  it('reutiliza análise gratuita (is_free: true, nome_ja_escolhido: true) retornando 200 { analysisId, reused: true } sem dar 403 na segunda chamada', async () => {
    const locals = {
      user: { id: 'user-free-1', email: 'user@example.com' },
      accessToken: 'token-123',
    };

    const makeReq = () =>
      new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: 'analise_gratuita',
          nome_completo: 'Maria Silva',
          data_nascimento: '01/01/1990',
          is_free: true,
          nome_ja_escolhido: true,
        }),
      });

    // 1ª chamada: cria a análise gratuita
    const res1 = await POST({ request: makeReq(), locals } as any);
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.analysisId, 'free-analysis-123');
    assert.equal(body1.reused, undefined);
    assert.equal(createAnalysisCalls, 1);

    // 2ª chamada: já existe análise gratuita e hasUsedFreeAnalysis = true -> retorna 200 reused: true sem 403
    const res2 = await POST({ request: makeReq(), locals } as any);
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.deepEqual(body2, {
      analysisId: 'free-analysis-123',
      reused: true,
    });
    assert.equal(createAnalysisCalls, 1);
  });

  it('bloqueia com 403 quando is_free: true mas nome_ja_escolhido não é true e usuário já usou análise gratuita', async () => {
    mockHasUsedFreeAnalysis = true;
    mockReusableFreeAnalysis = { id: 'free-analysis-123', status: 'complete' };

    const req = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_type: 'analise_gratuita',
        nome_completo: 'Maria Silva',
        data_nascimento: '01/01/1990',
        is_free: true,
      }),
    });

    const res = await POST({
      request: req,
      locals: { user: { id: 'user-free-1', email: 'user@example.com' }, accessToken: 'token-123' },
    } as any);

    assert.equal(res.status, 403);
  });

  it('NomeSocialChat alinha ensureFreeAnalysisRecord e handleFreePdfDownload com single-flight, overlay e poll 202', () => {
    assert.match(nomeSocialChatSrc, /runChatPdfEnsureOnce/);
    assert.match(nomeSocialChatSrc, /freePdfOverlayPhase/);
    assert.match(nomeSocialChatSrc, /freePdfRunLockRef/);
    assert.match(nomeSocialChatSrc, /freePdfAbortRef/);
    assert.match(nomeSocialChatSrc, /waitAnalysisCompleteForPdf/);
  });
});
