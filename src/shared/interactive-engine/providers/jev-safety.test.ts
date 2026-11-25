import assert from 'node:assert/strict';
import { after, beforeEach, describe, it, mock } from 'node:test';
import * as sdk from '@typesafe-ai/sdk';

/**
 * DEV-303 · proteções do caminho JEV/Groq/OpenAI: kill switch, teto de custo, guarda de
 * tentativas, validação da saída e telemetria sanitizada. Nenhuma chamada de rede real.
 */

const keys = [
  'TYPESAFE_API_KEY',
  'GROQ_API_KEY',
  'OPENAI_API_KEY',
  'NM_JEV_MOCK_ONLY',
  'NM_CHAT_ADAPTIVE_JEV',
  'NM_JEV_REMOTE_DISABLED',
  'NM_JEV_MAX_CALLS_PER_ANON',
  'NM_JEV_MAX_CALLS_PER_USER',
  'NM_JEV_MAX_CALLS_PER_HOUR',
  'NM_JEV_MAX_TOKENS_PER_HOUR',
  'NM_JEV_STRUCTURED_TIMEOUT_MS',
  'GROQ_DECIDE_MODEL',
  'OPENAI_DECIDE_MODEL',
] as const;
const previous = new Map(keys.map((key) => [key, process.env[key]]));

type SdkBehavior = 'success' | 'bad-enum' | 'bad-range' | number;
let sdkBehavior: SdkBehavior = 'success';
let sdkCalls = 0;
let fetchCalls = 0;
let fetchBody: unknown = null;
let fetchStatus = 200;
let fetchDelayMs = 0;
const fetchRequests: Array<{ url: string; body: Record<string, any> }> = [];

const answers = {
  escopo_pronto: { noul: 0.8 },
  alerta_compliance_legal: { noul: 0.1 },
  clareza_relato: { score: 1 },
  area_foco: { choice: 'carreira_negocios' },
  onde_assina: { choice: 'rotina_trabalho' },
  estilo_presenca: { choice: 'sobrenome_forte' },
  subfoco_momento: { choice: 'lideranca_promocao' },
};

class FakeTypeSafeClient {
  async systemOne() {
    sdkCalls++;
    if (typeof sdkBehavior === 'number') {
      throw Object.assign(new Error('synthetic provider failure with secret-token-123'), { status: sdkBehavior });
    }
    if (sdkBehavior === 'bad-enum') {
      return { answers: { ...answers, area_foco: { choice: 'astrologia_avancada' } } };
    }
    if (sdkBehavior === 'bad-range') {
      return { answers: { ...answers, escopo_pronto: { noul: 7 } } };
    }
    return { answers };
  }
}

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (url: string, init?: { body?: string; signal?: AbortSignal }) => {
  fetchCalls++;
  fetchRequests.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : {} });
  if (fetchDelayMs > 0) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, fetchDelayMs);
      init?.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    });
  }
  return {
    ok: fetchStatus >= 200 && fetchStatus < 300,
    status: fetchStatus,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(fetchBody) } }],
      usage: { prompt_tokens: 120, completion_tokens: 30 },
    }),
  } as unknown as Response;
}) as typeof fetch;

const named = Object.fromEntries(Object.entries(sdk).filter(([name]) => name !== 'default'));
mock.module('@typesafe-ai/sdk', { namedExports: { ...named, TypeSafeClient: FakeTypeSafeClient } });

const { runJevDecision } = await import('./jev-provider');
const { JevBudget, jevBudget, createJevCallGuard, classifyJevFailure, parseStructuredDecision, readStructuredTimeoutMs } =
  await import('./jev-safety');

const state = {
  nome_completo: 'Pessoa Exemplo',
  numero_destino: 3,
  nota_hoje: 60,
  potencial: 85,
  bloqueios_triangulos: [],
  relato_consulente: 'Quero clareza para fechar contratos e crescer no trabalho',
};

const structuredOk = {
  escopo_pronto_noul: 0.9,
  clareza_relato_score: 2,
  area_foco: 'carreira_negocios',
  onde_assina: 'rotina_trabalho',
  estilo_presenca: 'sobrenome_forte',
  subfoco_momento: 'lideranca_promocao',
  alerta_compliance_legal_noul: 0.05,
};

beforeEach(() => {
  for (const k of keys) delete process.env[k];
  jevBudget.reset();
  sdkBehavior = 'success';
  sdkCalls = 0;
  fetchCalls = 0;
  fetchStatus = 200;
  fetchDelayMs = 0;
  fetchRequests.length = 0;
  fetchBody = structuredOk;
});

after(() => {
  globalThis.fetch = originalFetch;
  for (const k of keys) {
    const value = previous.get(k);
    if (value === undefined) delete process.env[k];
    else process.env[k] = value;
  }
});

describe('DEV-303 · kill switch', () => {
  it('NM_JEV_REMOTE_DISABLED=true não chama nenhum provider, mesmo com todas as chaves', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    process.env.GROQ_API_KEY = 'k2';
    process.env.OPENAI_API_KEY = 'k3';
    process.env.NM_JEV_REMOTE_DISABLED = 'true';
    const r = await runJevDecision(state);
    assert.equal(r.providerUsed, 'deterministic');
    assert.equal(sdkCalls, 0);
    assert.equal(fetchCalls, 0);
    assert.equal(r.telemetry?.fallbackReason, 'remote-disabled');
    assert.deepEqual(r.providerPath, ['jev-remote-disabled', 'deterministic-local']);
  });
});

describe('DEV-303 · teto de custo', () => {
  it('visitante anônimo: acima do limite cai no determinístico sem chamar o provider', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    process.env.NM_JEV_MAX_CALLS_PER_ANON = '2';
    const key = { budgetKey: 'ip:abc' };
    assert.equal((await runJevDecision(state, key)).providerUsed, 'typesafe-jev');
    assert.equal((await runJevDecision(state, key)).providerUsed, 'typesafe-jev');
    const terceira = await runJevDecision(state, key);
    assert.equal(terceira.providerUsed, 'deterministic');
    assert.equal(sdkCalls, 2);
    assert.equal(terceira.telemetry?.fallbackReason, 'budget-exceeded');
    assert.equal(terceira.telemetry?.budgetDenial, 'per-key');
  });

  it('o limite é por chave: outro visitante não é afetado', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    process.env.NM_JEV_MAX_CALLS_PER_ANON = '1';
    await runJevDecision(state, { budgetKey: 'ip:a' });
    assert.equal((await runJevDecision(state, { budgetKey: 'ip:a' })).providerUsed, 'deterministic');
    assert.equal((await runJevDecision(state, { budgetKey: 'ip:b' })).providerUsed, 'typesafe-jev');
  });

  it('usuário logado tem limite próprio (maior)', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    process.env.NM_JEV_MAX_CALLS_PER_ANON = '1';
    process.env.NM_JEV_MAX_CALLS_PER_USER = '3';
    for (let i = 0; i < 3; i++) {
      assert.equal((await runJevDecision(state, { budgetKey: 'u:42' })).providerUsed, 'typesafe-jev');
    }
    assert.equal((await runJevDecision(state, { budgetKey: 'u:42' })).providerUsed, 'deterministic');
  });

  it('teto global por hora vale para todos', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    process.env.NM_JEV_MAX_CALLS_PER_HOUR = '2';
    await runJevDecision(state, { budgetKey: 'ip:a' });
    await runJevDecision(state, { budgetKey: 'ip:b' });
    const r = await runJevDecision(state, { budgetKey: 'ip:c' });
    assert.equal(r.providerUsed, 'deterministic');
    assert.equal(r.telemetry?.budgetDenial, 'global');
  });

  it('teto de tokens por hora bloqueia depois de gastar', async () => {
    process.env.GROQ_API_KEY = 'k2';
    process.env.NM_JEV_MAX_TOKENS_PER_HOUR = '100';
    const primeira = await runJevDecision(state, { budgetKey: 'ip:a' });
    assert.equal(primeira.providerUsed, 'groq-structured');
    assert.equal(primeira.telemetry?.tokens, 150);
    const segunda = await runJevDecision(state, { budgetKey: 'ip:b' });
    assert.equal(segunda.providerUsed, 'deterministic');
    assert.equal(segunda.telemetry?.budgetDenial, 'tokens');
  });

  it('janela deslizante libera depois do tempo (relógio injetado)', () => {
    let agora = 1_000_000;
    const budget = new JevBudget(
      () => ({ keyWindowMs: 60_000, maxPerAnonymous: 1, maxPerUser: 1, maxPerHour: 100, maxTokensPerHour: 0 }),
      () => agora,
    );
    assert.equal(budget.tryReserve('ip:x').ok, true);
    assert.equal(budget.tryReserve('ip:x').ok, false);
    agora += 61_000;
    assert.equal(budget.tryReserve('ip:x').ok, true);
  });

  it('sem chave de orçamento (chamador interno) valem só os tetos globais', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    process.env.NM_JEV_MAX_CALLS_PER_ANON = '1';
    for (let i = 0; i < 4; i++) {
      assert.equal((await runJevDecision(state)).providerUsed, 'typesafe-jev');
    }
  });

  it('determinístico não gasta orçamento', async () => {
    process.env.NM_JEV_MAX_CALLS_PER_ANON = '1';
    for (let i = 0; i < 3; i++) await runJevDecision(state, { budgetKey: 'ip:a' });
    process.env.TYPESAFE_API_KEY = 'k1';
    assert.equal((await runJevDecision(state, { budgetKey: 'ip:a' })).providerUsed, 'typesafe-jev');
  });
});

describe('DEV-303 · validação da saída do provider', () => {
  it('JEV com enum fora do domínio cai no próximo nível (Groq)', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    process.env.GROQ_API_KEY = 'k2';
    sdkBehavior = 'bad-enum';
    const r = await runJevDecision(state);
    assert.equal(r.providerUsed, 'groq-structured');
    assert.equal(r.telemetry?.attempts[0]?.outcome, 'invalid-output');
    assert.equal(r.telemetry?.attempts[1]?.outcome, 'ok');
  });

  it('JEV com noul fora de 0 a 1 cai no determinístico', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    sdkBehavior = 'bad-range';
    const r = await runJevDecision(state);
    assert.equal(r.providerUsed, 'deterministic');
    assert.equal(r.telemetry?.fallbackReason, 'all-failed');
    assert.equal(r.telemetry?.attempts[0]?.outcome, 'invalid-output');
  });

  it('Groq com JSON malformado ou fora do domínio é rejeitado', async () => {
    process.env.GROQ_API_KEY = 'k2';
    fetchBody = { ...structuredOk, area_foco: 'qualquer_coisa' };
    const r = await runJevDecision(state);
    assert.equal(r.providerUsed, 'deterministic');
    assert.equal(r.telemetry?.attempts[0]?.outcome, 'invalid-output');

    fetchBody = { ...structuredOk, escopo_pronto_noul: -3 };
    assert.equal((await runJevDecision(state)).providerUsed, 'deterministic');

    fetchBody = 'não é objeto';
    assert.equal((await runJevDecision(state)).providerUsed, 'deterministic');
  });

  it('saída válida passa e traz tokens', async () => {
    process.env.GROQ_API_KEY = 'k2';
    const r = await runJevDecision(state);
    assert.equal(r.providerUsed, 'groq-structured');
    assert.equal(r.areaFoco, 'carreira_negocios');
    assert.equal(r.telemetry?.tokens, 150);
  });

  it('parseStructuredDecision recusa campos faltando', () => {
    assert.throws(() => parseStructuredDecision({ area_foco: 'carreira_negocios' }));
    assert.doesNotThrow(() => parseStructuredDecision(structuredOk));
  });
});

describe('DEV-303 · telemetria sanitizada e fallback', () => {
  it('registra o código da falha, nunca a mensagem nem a chave', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    sdkBehavior = 402;
    const r = await runJevDecision(state);
    assert.equal(r.providerUsed, 'deterministic');
    assert.equal(r.telemetry?.attempts[0]?.outcome, 'http-402');
    assert.doesNotMatch(JSON.stringify(r.telemetry), /secret-token-123|k1/);
    assert.deepEqual(r.providerPath, ['typesafe-jev:http-402', 'deterministic-local']);
  });

  it('classifyJevFailure cobre os códigos HTTP, timeout e erro genérico', () => {
    assert.equal(classifyJevFailure(Object.assign(new Error('x'), { status: 401 })), 'http-401');
    assert.equal(classifyJevFailure(Object.assign(new Error('x'), { status: 429 })), 'http-429');
    assert.equal(classifyJevFailure(Object.assign(new Error('x'), { status: 503 })), 'http-5xx');
    assert.equal(classifyJevFailure(new Error('groq-structured HTTP 402')), 'http-402');
    assert.equal(classifyJevFailure(Object.assign(new Error('aborted'), { name: 'AbortError' })), 'timeout');
    assert.equal(classifyJevFailure(new Error('boom')), 'error');
  });

  it('cadeia completa: JEV falha, Groq falha, OpenAI responde', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    process.env.GROQ_API_KEY = 'k2';
    process.env.OPENAI_API_KEY = 'k3';
    sdkBehavior = 500;
    let n = 0;
    const fetchPadrao = globalThis.fetch;
    globalThis.fetch = (async () => {
      n++;
      fetchCalls++;
      if (n === 1) return { ok: false, status: 429, json: async () => ({}) } as unknown as Response;
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: JSON.stringify(structuredOk) } }], usage: {} }),
      } as unknown as Response;
    }) as typeof fetch;
    try {
      const r = await runJevDecision(state);
      assert.equal(r.providerUsed, 'openai-structured');
      assert.deepEqual(
        r.telemetry?.attempts.map((a) => a.outcome),
        ['http-5xx', 'http-429', 'ok'],
      );
    } finally {
      globalThis.fetch = fetchPadrao;
    }
  });

  it('relato curto não chama Groq nem OpenAI (só JEV)', async () => {
    process.env.GROQ_API_KEY = 'k2';
    process.env.OPENAI_API_KEY = 'k3';
    const r = await runJevDecision({ ...state, relato_consulente: 'oi' });
    assert.equal(r.providerUsed, 'deterministic');
    assert.equal(fetchCalls, 0);
    assert.equal(r.telemetry?.fallbackReason, 'short-report');
  });
});

describe('DEV-303 · guarda de chamada (espelho do LoopGuard)', () => {
  it('bloqueia a 4ª tentativa e acima de 50k tokens', () => {
    const guard = createJevCallGuard();
    assert.equal(guard.canAttempt(1), true);
    assert.equal(guard.canAttempt(3), true);
    assert.throws(() => guard.canAttempt(4));
    guard.recordResponse('x', 60_000);
    assert.throws(() => guard.canAttempt(1));
  });

  it('usa a guarda recebida e registra o uso por resposta válida', async () => {
    process.env.GROQ_API_KEY = 'k2';
    const registros: Array<{ provider: string; tokensInput: number; tokensOutput: number; attemptNumber: number }> = [];
    let tentativas = 0;
    let respostas = 0;
    const r = await runJevDecision(state, {
      guard: {
        canAttempt: () => {
          tentativas++;
          return true;
        },
        recordResponse: () => {
          respostas++;
          return true;
        },
      },
      onUsage: (u) => registros.push(u),
    });
    assert.equal(r.providerUsed, 'groq-structured');
    assert.equal(tentativas, 1);
    assert.equal(respostas, 1);
    assert.deepEqual(registros, [
      { provider: 'groq-structured', model: 'openai/gpt-oss-20b', tokensInput: 120, tokensOutput: 30, attemptNumber: 1 },
    ]);
  });

  it('guarda que bloqueia impede a chamada ao provider', async () => {
    process.env.TYPESAFE_API_KEY = 'k1';
    const r = await runJevDecision(state, {
      guard: {
        canAttempt: () => {
          throw new Error('limite');
        },
        recordResponse: () => true,
      },
    });
    assert.equal(r.providerUsed, 'deterministic');
    assert.equal(sdkCalls, 0);
    assert.equal(r.telemetry?.attempts[0]?.outcome, 'guard-blocked');
  });
});

describe('DEV-304 · caminho real do Groq e do OpenAI (achados do teste com as chaves do TESTE)', () => {
  it('Groq usa um modelo atual (o llama-3.3-70b-versatile foi aposentado e dava 404)', async () => {
    process.env.GROQ_API_KEY = 'k2';
    await runJevDecision(state);
    const req = fetchRequests[0]!;
    assert.match(req.url, /api\.groq\.com/);
    assert.equal(req.body.model, 'openai/gpt-oss-20b');
    assert.doesNotMatch(String(req.body.model), /llama-3\.(1|3)/);
  });

  it('gpt-oss pede raciocínio baixo e tem folga de tokens (200 ficava no limite)', async () => {
    process.env.GROQ_API_KEY = 'k2';
    await runJevDecision(state);
    const body = fetchRequests[0]!.body;
    assert.equal(body.reasoning_effort, 'low');
    assert.ok(body.max_tokens >= 600);
  });

  it('modelo escolhido por env vale, e sem gpt-oss não manda reasoning_effort', async () => {
    process.env.GROQ_API_KEY = 'k2';
    process.env.GROQ_DECIDE_MODEL = 'outro/modelo-atual';
    await runJevDecision(state);
    const body = fetchRequests[0]!.body;
    assert.equal(body.model, 'outro/modelo-atual');
    assert.equal('reasoning_effort' in body, false);
  });

  it('OpenAI usa gpt-4o-mini sem reasoning_effort', async () => {
    process.env.OPENAI_API_KEY = 'k3';
    await runJevDecision(state);
    const req = fetchRequests[0]!;
    assert.match(req.url, /api\.openai\.com/);
    assert.equal(req.body.model, 'gpt-4o-mini');
    assert.equal('reasoning_effort' in req.body, false);
  });

  it('o schema fecha o score em 0, 1 ou 2 e deixa o noul para a validação Zod', async () => {
    process.env.OPENAI_API_KEY = 'k3';
    await runJevDecision(state);
    const props = fetchRequests[0]!.body.response_format.json_schema.schema.properties;
    assert.deepEqual(props.clareza_relato_score.enum, [0, 1, 2]);
    assert.equal(props.clareza_relato_score.type, 'integer');
    assert.equal(props.escopo_pronto_noul.type, 'number');
    assert.equal('enum' in props.escopo_pronto_noul, false);
    assert.equal('enum' in props.alerta_compliance_legal_noul, false);
    assert.equal(fetchRequests[0]!.body.response_format.json_schema.strict, true);
  });

  it('nenhum enum numérico mistura inteiro e decimal (o Groq recusa com HTTP 400)', async () => {
    process.env.GROQ_API_KEY = 'k2';
    await runJevDecision(state);
    const props = fetchRequests[0]!.body.response_format.json_schema.schema.properties as Record<
      string,
      { type: string; enum?: unknown[] }
    >;
    for (const [nome, def] of Object.entries(props)) {
      const numeros = (def.enum ?? []).filter((v): v is number => typeof v === 'number');
      if (numeros.length === 0) continue;
      const todosInteiros = numeros.every((n) => Number.isInteger(n));
      const nenhumInteiro = numeros.every((n) => !Number.isInteger(n));
      assert.ok(todosInteiros || nenhumInteiro, `${nome} mistura inteiros e decimais`);
      if (todosInteiros) assert.equal(def.type, 'integer', `${nome}: enum inteiro pede type integer`);
    }
  });

  it('o score fora de 0 a 2 que o OpenAI chegou a devolver (8) cai no determinístico', async () => {
    process.env.OPENAI_API_KEY = 'k3';
    fetchBody = { ...structuredOk, clareza_relato_score: 8 };
    const r = await runJevDecision(state);
    assert.equal(r.providerUsed, 'deterministic');
    assert.equal(r.telemetry?.attempts[0]?.outcome, 'invalid-output');
  });

  it('tempo limite: Groq 3,5 s e OpenAI 4 s por padrão (OpenAI leva 1,6 a 1,9 s), com override e limites', () => {
    assert.equal(readStructuredTimeoutMs('groq-structured'), 3500);
    assert.equal(readStructuredTimeoutMs('openai-structured'), 4000);
    process.env.NM_JEV_STRUCTURED_TIMEOUT_MS = '2500';
    assert.equal(readStructuredTimeoutMs('groq-structured'), 2500);
    assert.equal(readStructuredTimeoutMs('openai-structured'), 2500);
    process.env.NM_JEV_STRUCTURED_TIMEOUT_MS = '10';
    assert.equal(readStructuredTimeoutMs('groq-structured'), 500);
    process.env.NM_JEV_STRUCTURED_TIMEOUT_MS = '999999';
    assert.equal(readStructuredTimeoutMs('openai-structured'), 15000);
  });

  it('resposta mais lenta que o limite vira timeout, e uma de 2 s passa com o limite padrão', async () => {
    process.env.OPENAI_API_KEY = 'k3';
    process.env.NM_JEV_STRUCTURED_TIMEOUT_MS = '500';
    fetchDelayMs = 900;
    const lenta = await runJevDecision(state);
    assert.equal(lenta.providerUsed, 'deterministic');
    assert.equal(lenta.telemetry?.attempts[0]?.outcome, 'timeout');

    delete process.env.NM_JEV_STRUCTURED_TIMEOUT_MS;
    fetchDelayMs = 2000;
    const normal = await runJevDecision(state);
    assert.equal(normal.providerUsed, 'openai-structured');
  });

  it('404 e 400 ganham código próprio (404 do Groq é modelo aposentado)', () => {
    assert.equal(classifyJevFailure(new Error('groq-structured HTTP 404')), 'http-404');
    assert.equal(classifyJevFailure(new Error('openai-structured HTTP 400')), 'http-400');
    assert.equal(classifyJevFailure(Object.assign(new Error('x'), { status: 404 })), 'http-404');
  });
});
