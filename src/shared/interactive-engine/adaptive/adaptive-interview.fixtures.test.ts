import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it, mock } from 'node:test';
import * as sdk from '@typesafe-ai/sdk';
import { runAdaptiveInterviewStep } from './interview-engine.ts';
import type { AdaptiveInterviewRequest } from './schemas.ts';
import { ADAPTIVE_MAX_QUESTIONS } from './config.ts';

const ENV_KEYS = ['NM_CHAT_ADAPTIVE_JEV', 'NM_JEV_MOCK_ONLY', 'TYPESAFE_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY'] as const;
const prev = new Map<string, string | undefined>();

let clientCalls = 0;
let networkAttempts = 0;
const originalFetch = globalThis.fetch;

class FakeTypeSafeClient {
  async systemOne() {
    clientCalls++;
    return { answers: {} };
  }
}

const named = Object.fromEntries(Object.entries(sdk).filter(([name]) => name !== 'default'));
mock.module('@typesafe-ai/sdk', { namedExports: { ...named, TypeSafeClient: FakeTypeSafeClient } });

const { runJevDecision } = await import('../providers/jev-provider.ts');

function baseRequest(overrides: Partial<AdaptiveInterviewRequest> = {}): AdaptiveInterviewRequest {
  return {
    sessionId: 'fixture-session-01',
    nomeCompleto: 'Maria da Silva Santos',
    dataNascimento: '15/03/1990',
    startedAtMs: Date.now(),
    answers: [],
    ...overrides,
  };
}

before(() => {
  for (const k of ENV_KEYS) prev.set(k, process.env[k]);
});

beforeEach(() => {
  clientCalls = 0;
  networkAttempts = 0;
  globalThis.fetch = (async () => {
    networkAttempts++;
    throw new Error('network forbidden');
  }) as typeof fetch;
  process.env.NM_CHAT_ADAPTIVE_JEV = 'true';
  process.env.NM_JEV_MOCK_ONLY = 'true';
  process.env.TYPESAFE_API_KEY = 'synthetic-key';
});

after(() => {
  globalThis.fetch = originalFetch;
  for (const k of ENV_KEYS) {
    const v = prev.get(k);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe('DEV-274 fixtures · entrevista adaptativa (mocks)', () => {
  it('entrevista curta avança com JEV tipado mock e escritor mock', () => {
    const req = baseRequest({
      answers: [
        { stepId: 'nome_uso', optionIds: ['nome_Maria'] },
        { stepId: 'sobrenomes_uso', optionIds: ['sob_silva'] },
      ],
      numerologySnapshot: { destino: 7, notaHoje: 62, potencial: 78 },
    });
    const step = runAdaptiveInterviewStep(req);
    assert.equal(step.decision.providerUsed, 'jev-typed-mock');
    assert.equal(step.writer.providerUsed, 'llm-writer-mock');
    assert.ok(step.writer.prompt.length > 5);
    assert.equal(step.jevMockOnly, true);
    assert.match(step.decision.providerPath.join(','), /no-external-provider/);
  });

  it('respostas contraditórias disparam linha contradicao', () => {
    const req = baseRequest({
      correctStepId: 'relacao_nome',
      answers: [
        { stepId: 'relacao_nome', optionIds: ['gosto_muito'] },
        { stepId: 'relacao_nome', optionIds: ['nao_representa'] },
      ],
    });
    const step = runAdaptiveInterviewStep(req);
    assert.equal(step.decision.interviewLine, 'contradicao');
    assert.ok(step.decision.contradiction);
    assert.match(step.writer.prompt, /Antes você indicou/);
  });

  it('revisão de preferência reflete em profileSummary com kind declared', () => {
    const req = baseRequest({
      answers: [
        { stepId: 'nome_uso', optionIds: ['nome_Maria'] },
        { stepId: 'sobrenomes_uso', optionIds: ['sob_silva'] },
        { stepId: 'relacao_nome', optionIds: ['gosto_muito'] },
        { stepId: 'onde_assina', optionIds: ['contratos_documentos'] },
        { stepId: 'estilo_presenca', optionIds: ['firme_confiavel'] },
        { stepId: 'area_foco', optionIds: ['carreira_negocios'] },
        { stepId: 'subfoco', optionIds: ['lideranca_promocao'] },
        { stepId: 'abertura_mudanca', optionIds: ['acento_ou_letra'] },
      ],
      profileEdits: { declared_relacao_nome: 'Gosto muito, com vontade de firmeza na assinatura.' },
    });
    const step = runAdaptiveInterviewStep(req);
    assert.ok(step.profileSummary);
    const edited = step.profileSummary.blocks.find((b) => b.id === 'declared_relacao_nome');
    assert.ok(edited);
    assert.equal(edited.body, 'Gosto muito, com vontade de firmeza na assinatura.');
    assert.equal(edited.kind, 'declared');
  });

  it('ausência de provider real com NM_JEV_MOCK_ONLY mesmo com chaves', async () => {
    const result = await runJevDecision({
      nome_completo: 'Teste',
      numero_destino: 5,
      nota_hoje: 50,
      potencial: 70,
      bloqueios_triangulos: [],
      relato_consulente: 'Quero crescer na carreira com clareza.',
    });
    assert.equal(result.providerUsed, 'deterministic');
    assert.deepEqual(result.providerPath, ['jev-mock-only', 'deterministic-local']);
    assert.equal(clientCalls, 0);
    assert.equal(networkAttempts, 0);
  });

  it('session guard limita perguntas excessivas', () => {
    let guard;
    const req = baseRequest({ answers: [] });
    for (let i = 0; i < ADAPTIVE_MAX_QUESTIONS + 2; i++) {
      const r = runAdaptiveInterviewStep(req, guard);
      guard = r.sessionGuard;
      if (!r.sessionGuardOk) break;
    }
    const final = runAdaptiveInterviewStep(req, guard);
    assert.equal(final.sessionGuardOk, false);
    assert.ok(final.guardReason);
  });
});
