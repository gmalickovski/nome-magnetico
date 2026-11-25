import { avaliarNome } from '../../backend/numerology/score';
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let mockReusableFreeAnalysis: { id: string; status: string } | null = null;
let mockHasUsedFreeAnalysis = false;
let mockCreatedAnalysisId = 'created-free-id-1';
let createAnalysisCalls = 0;
let paidAccess = false;
let updates: Record<string, any>[] = [];
let profileUpdates: Record<string, any>[] = [];
let socialInputsInserts: Record<string, any>[] = [];

const mockUserSupabase = {
  from: (table: string) => {
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
      update: (payload: Record<string, any>) => {
        if (table === 'profiles') profileUpdates.push(payload);
        return builder;
      },
      insert: async (payload: Record<string, any>) => {
        if (table === 'social_name_inputs') socialInputsInserts.push(payload);
        return { data: null, error: null };
      },
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
    hasActiveSubscription: async () => paidAccess,
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
    updateAnalysis: async (_id: string, value: Record<string, any>) => { updates.push(value); return null; },
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

mock.module('../../backend/notifications/analysis-complete', { namedExports: { notifyPaidAnalysisComplete: async () => {} } });

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
    paidAccess = false; updates = [];
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

it('DEV-299 salva manual com nota inferior, proveniência e contexto para reabertura/PDF', async () => {
  paidAccess = true; updates = [];
  const nome = 'Aaaaaaa';
  const response = await POST({ request: new Request('http://localhost/api/analyze', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_type: 'nome_social', nome_completo: 'Alexandra Mendes Vale', data_nascimento: '07/03/1992', nome_social_principal: nome, nome_ja_escolhido: true, nomes_candidatos: [nome], nomes_manuais: [nome], ranking_somente_chat: true, area_foco: 'carreira_negocios', onde_vai_usar: ['contratos'] }),
  }), locals: { user: { id: 'fixture-owner', email: 'fixture@example.com' }, accessToken: 'token-fixture' } } as any);
  assert.equal(response.status, 200);
  for (let attempt = 0; attempt < 20 && !updates.some(u => u.status === 'complete'); attempt++) await new Promise<void>(resolve => setImmediate(resolve));
  const saved = updates.find(u => u.frequencias_numeros?.ranking);
  assert.ok(saved, 'persistiu frequência/ranking no background');
  const data = saved.frequencias_numeros;
  assert.equal(data.selectedNomeSocial, nome);
  assert.equal(data.ranking.nomesCandidatos[0].origem, 'manual');
  assert.equal(data.ranking.nomesCandidatos[0].score, avaliarNome(nome, '07/03/1992').score_v3);
  assert.equal(data.radarVersion, 'contextual-v1');
  assert.equal(data.radarSnapshot.birth.length, 5);
  assert.equal(data.radarSnapshot.selectedName, nome);
  assert.equal(data.areaFoco, 'carreira_negocios');
});

it('DEV-328 persiste perfil_chat, nomes_artisticos e nomes_bebe sem alterar perfil no caminho do bebê', async () => {
  paidAccess = true;
  updates = [];
  profileUpdates = [];
  socialInputsInserts = [];

  const resArtistico = await POST({
    request: new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_type: 'nome_social',
        nome_completo: 'Maria Silva',
        data_nascimento: '01/01/1990',
        nome_social_principal: 'Lira Sol',
        nome_ja_escolhido: true,
        nomes_candidatos: ['Mari Sol', 'Lira Sol'],
        ranking_somente_chat: true,
        perfil_chat: {
          motivo: 'artistico',
          areaArtistica: 'cantor',
          tipoNomeArtistico: 'ambos',
        },
        nomes_artisticos: {
          proximos: [{ nome: 'Mari Sol', nota: 78, expressao: 3, afinidade: 2, secao: 'proximo' }],
          novos: [{ nome: 'Lira Sol', nota: 91, expressao: 5, afinidade: 1, secao: 'novo' }],
          escolhido: 'Lira Sol',
        },
      }),
    }),
    locals: { user: { id: 'fixture-owner', email: 'fixture@example.com' }, accessToken: 'token-fixture' },
  } as any);
  assert.equal(resArtistico.status, 200);
  for (let i = 0; i < 20 && !updates.some((u) => u.status === 'complete'); i++) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  const savedArt = updates.find((u) => u.frequencias_numeros?.nomesArtisticos);
  assert.ok(savedArt, 'persistiu nomesArtisticos');
  assert.equal(savedArt.frequencias_numeros.perfilChat.motivo, 'artistico');
  assert.equal(savedArt.frequencias_numeros.nomesArtisticos.escolhido, 'Lira Sol');
  assert.ok(savedArt.frequencias_numeros.ranking.melhorNome, 'mantém melhorNome para caminho artístico');

  updates = [];
  profileUpdates = [];
  socialInputsInserts = [];

  const resBebe = await POST({
    request: new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_type: 'nome_social',
        nome_completo: 'Alice Silva',
        data_nascimento: '15/06/2027',
        nome_social_principal: 'Alice Silva',
        nome_ja_escolhido: true,
        nomes_candidatos: ['Alice Silva'],
        ranking_somente_chat: true,
        perfil_chat: {
          motivo: 'bebe',
          bebeMae: 'Maria Silva',
          bebeSituacao: 'nao_nasceu',
          bebeDataTipo: 'prevista',
          bebeSexo: 'menina',
          bebeData: '15/06/2027',
          bebeSobrenomes: ['Silva'],
        },
        nomes_bebe: {
          seusNomes: [],
          sugestoes: [{ nome: 'Alice Silva', nota: 88, expressao: 6, bloqueios: [], diasBons: 22, diasTotal: 29, grupo: 'menina' }],
          janela: { dias: 29, centro: '15/06/2027' },
          escolhido: 'Alice Silva',
        },
      }),
    }),
    locals: { user: { id: 'fixture-owner', email: 'fixture@example.com' }, accessToken: 'token-fixture' },
  } as any);
  assert.equal(resBebe.status, 200);
  for (let i = 0; i < 20 && !updates.some((u) => u.status === 'complete'); i++) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  const savedBebe = updates.find((u) => u.frequencias_numeros?.nomesBebe);
  assert.ok(savedBebe, 'persistiu nomesBebe');
  assert.equal(savedBebe.frequencias_numeros.perfilChat.motivo, 'bebe');
  assert.equal(savedBebe.frequencias_numeros.nomesBebe.escolhido, 'Alice Silva');
  assert.equal(profileUpdates.length, 0, 'não sobrescreve birth_name/birth_date em profiles no caminho do bebê');
  assert.equal(socialInputsInserts.length, 0, 'não grava social_name_inputs no caminho do bebê');
  assert.ok(savedBebe.frequencias_numeros.ranking.melhorNome, 'mantém melhorNome para caminho bebê');
});
