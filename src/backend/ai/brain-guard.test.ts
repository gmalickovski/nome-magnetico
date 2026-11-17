import assert from 'node:assert/strict';
import { after, beforeEach, describe, it, mock } from 'node:test';

/**
 * DEV-304 · brain.ts: nenhum nome da IA chega ao usuário sem passar pela lista do motor,
 * vocabulário proibido é refeito, e o teto diário de tokens por usuário vale.
 * Provedores e banco são simulados: nenhuma chamada paga, nenhuma rede.
 */

interface Chamada {
  system: string;
  user: string;
  task: string;
  provider: string | undefined;
}

const chamadas: Chamada[] = [];
const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
let respostas: Array<string | Error> = [];
let providerAtivo: 'claude' | 'groq' = 'claude';
let usageRows: Array<{ tokens_total: number }> = [];
let usageError: unknown = null;

function cadeia(table: string) {
  const api: Record<string, unknown> = {
    select: () => api,
    eq: () => api,
    gte: () => api,
    single: () => Promise.resolve({ data: null, error: null }),
    insert: (row: Record<string, unknown>) => {
      inserts.push({ table, row });
      return Promise.resolve({ error: null });
    },
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve({ data: usageError ? null : usageRows, error: usageError }).then(resolve, reject),
  };
  return api;
}

mock.module('../db/supabase.ts', { namedExports: { supabase: { from: (t: string) => cadeia(t) } } });
mock.module('./router.ts', {
  namedExports: {
    getActiveProvider: async () => providerAtivo,
    streamAI: async function* () {
      /* não usado */
    },
    callAI: async (system: string, user: string, task: string, provider?: string) => {
      chamadas.push({ system, user, task, provider });
      const proxima = respostas.shift();
      if (proxima === undefined) throw new Error('sem resposta simulada');
      if (proxima instanceof Error) throw proxima;
      return { content: proxima, tokensInput: 10, tokensOutput: 20 };
    },
  },
});

const { generateGuide, generateSuggestions, generateSupportPolish } = await import('./brain.ts');
const { calcularCincoNumeros } = await import('../numerology/numbers.ts');

const ENV = 'AI_MAX_TOKENS_PER_USER_DAY';
const envAntes = process.env[ENV];
const silencio = { warn: console.warn, error: console.error };

beforeEach(() => {
  chamadas.length = 0;
  inserts.length = 0;
  respostas = [];
  providerAtivo = 'claude';
  usageRows = [];
  usageError = null;
  delete process.env[ENV];
  console.warn = () => {};
  console.error = () => {};
});

after(() => {
  console.warn = silencio.warn;
  console.error = silencio.error;
  if (envAntes === undefined) delete process.env[ENV];
  else process.env[ENV] = envAntes;
});

const guia = {
  nomeCompleto: 'Ana Silva Santos',
  nomeMagnetico: 'Aná Silva',
  numeroExpressaoOriginal: 3,
  numeroExpressaoNovo: 5,
  bloqueiosRemovidos: ['333'],
};

function candidata(nome: string, score: number, temBloqueio = false) {
  return {
    nome,
    numerosExpressao: 5,
    motivacao: 4,
    impressao: 8,
    temBloqueio,
    score,
    scoreTeto: 100,
    justificativa: 'Sem bloqueios energéticos',
  };
}

const sugestoes = {
  nomeCompleto: 'Ana Silva Santos',
  cincoNumeros: calcularCincoNumeros('Ana Silva Santos', '01/01/1990'),
  gender: 'Feminino',
  variacoesCandidatas: [
    candidata('Aná Silva', 92),
    candidata('Ana Silvã', 88),
    candidata('Ana Silva Sántos', 95, true), // bloqueio
    candidata('Ana Sántos', 60), // abaixo do piso
  ],
};

const titulos = (...nomes: string[]) => nomes.map((n) => `### ✨ Nome: ${n}\nTexto sobre ${n}.`).join('\n\n');

describe('DEV-304 · nomes da IA só da lista do motor', () => {
  it('a IA recebe só candidatas ofertáveis: bloqueio e nota baixa nem chegam ao prompt', async () => {
    respostas = [titulos('Aná Silva', 'Ana Silvã')];
    await generateSuggestions(sugestoes, 'u1', 'a1', { scoreNascimento: 50 });
    assert.equal(chamadas.length, 1);
    const prompt = chamadas[0]!.user;
    assert.match(prompt, /Aná Silva/);
    assert.match(prompt, /Ana Silvã/);
    assert.doesNotMatch(prompt, /Ana Silva Sántos/);
    assert.doesNotMatch(prompt, /Ana Sántos/);
  });

  it('devolve o texto quando os nomes apresentados estão na lista', async () => {
    respostas = [titulos('Aná Silva', 'Ana Silvã')];
    const texto = await generateSuggestions(sugestoes, 'u1', 'a1', { scoreNascimento: 50 });
    assert.match(texto, /Nome: Aná Silva/);
  });

  it('nome inventado é recusado nas 3 tentativas e nada chega ao usuário', async () => {
    respostas = [titulos('Aninha Magnética'), titulos('Ana Estrela Dourada'), titulos('Ânia Sol')];
    await assert.rejects(
      generateSuggestions(sugestoes, 'u1', 'a1', { scoreNascimento: 50 }),
      /suggestions falhou após 3 tentativas/,
    );
    assert.equal(chamadas.length, 3);
  });

  it('nome da lista com acento trocado também é recusado (o acento muda a nota)', async () => {
    respostas = [titulos('Ana Silva'), titulos('Ana Silva'), titulos('Ana Silva')];
    await assert.rejects(generateSuggestions(sugestoes, 'u1', 'a1', { scoreNascimento: 50 }));
  });

  it('refaz quando a primeira resposta inventa e a segunda acerta', async () => {
    respostas = [titulos('Ana Cósmica'), titulos('Aná Silva')];
    const texto = await generateSuggestions(sugestoes, 'u1', 'a1', { scoreNascimento: 50 });
    assert.match(texto, /Aná Silva/);
    assert.equal(chamadas.length, 2);
  });

  it('sem nenhuma candidata ofertável, não chama a IA', async () => {
    const todasInvalidas = {
      ...sugestoes,
      variacoesCandidatas: [candidata('Ana A', 95, true), candidata('Ana B', 40)],
    };
    await assert.rejects(
      generateSuggestions(todasInvalidas, 'u1', 'a1', { scoreNascimento: 50 }),
      /NO_OFFERABLE_CANDIDATES/,
    );
    assert.equal(chamadas.length, 0);
  });

  it('sem a nota do nascimento, ainda descarta quem tem bloqueio', async () => {
    respostas = [titulos('Aná Silva')];
    await generateSuggestions(sugestoes, 'u1', 'a1');
    assert.doesNotMatch(chamadas[0]!.user, /Ana Silva Sántos/);
  });
});

describe('DEV-304 · vocabulário proibido no texto da IA', () => {
  it('refaz a tentativa e devolve a versão limpa', async () => {
    respostas = ['## 🔑 1. Ritual\n\nUse a radiestesia para ativar.', '## 🔑 1. Ritual\n\nRespire e escreva o nome com calma.'];
    const texto = await generateGuide(guia, 'u1', 'a1');
    assert.match(texto, /Respire e escreva/);
    assert.equal(chamadas.length, 2);
  });

  it('na terceira tentativa remove as frases proibidas em vez de perder a análise', async () => {
    respostas = [
      'Ritual A. Isso é incompatível com antes. Respire fundo.',
      'Ritual B. Isso é incompatível com antes. Escreva o nome.',
      'Ritual C. Isso é incompatível com antes. Medite em silêncio.',
    ];
    const texto = await generateGuide(guia, 'u1', 'a1');
    assert.doesNotMatch(texto, /incompat/i);
    assert.match(texto, /Medite em silêncio\./);
    assert.equal(chamadas.length, 3);
  });

  it('texto limpo passa direto, sem refazer', async () => {
    respostas = ['## 🔑 1. Ritual\n\nSua assinatura ganha Tensão Vibracional menor.'];
    await generateGuide(guia, 'u1', 'a1');
    assert.equal(chamadas.length, 1);
  });

  it('polimento de suporte é texto do agente: não passa pela guarda de vocabulário', async () => {
    respostas = ['Olá, Maria. Sua dúvida sobre o nome incompatível foi respondida.'];
    const texto = await generateSupportPolish('rascunho', 'Maria');
    assert.match(texto, /incompatível/);
    assert.equal(chamadas.length, 1);
  });

  it('fallback Groq → OpenAI também passa pela guarda e refaz a tentativa', async () => {
    providerAtivo = 'groq';
    respostas = [
      new Error('GROQ_RATE_LIMITED'),
      'Use o pêndulo sobre o nome.',
      new Error('GROQ_RATE_LIMITED'),
      '## 🔑 1. Ritual\n\nTexto limpo e acolhedor.',
    ];
    const texto = await generateGuide(guia, 'u1', 'a1');
    assert.match(texto, /Texto limpo e acolhedor/);
    assert.deepEqual(
      chamadas.map((c) => c.provider),
      ['groq', 'openai', 'groq', 'openai'],
    );
  });
});

describe('DEV-304 · teto diário de tokens por usuário', () => {
  it('acima do teto, não chama a IA e devolve USER_TOKEN_LIMIT', async () => {
    usageRows = [{ tokens_total: 300_000 }, { tokens_total: 250_000 }];
    await assert.rejects(generateGuide(guia, 'u1', 'a1'), /USER_TOKEN_LIMIT/);
    assert.equal(chamadas.length, 0);
  });

  it('abaixo do teto segue normalmente', async () => {
    usageRows = [{ tokens_total: 100_000 }];
    respostas = ['Texto limpo.'];
    await generateGuide(guia, 'u1', 'a1');
    assert.equal(chamadas.length, 1);
  });

  it('AI_MAX_TOKENS_PER_USER_DAY muda o teto e 0 desliga', async () => {
    usageRows = [{ tokens_total: 1_000 }];
    process.env[ENV] = '500';
    await assert.rejects(generateGuide(guia, 'u1', 'a1'), /USER_TOKEN_LIMIT/);
    process.env[ENV] = '0';
    respostas = ['Texto limpo.'];
    await generateGuide(guia, 'u1', 'a1');
    assert.equal(chamadas.length, 1);
  });

  it('chamada de sistema (sem usuário) não tem teto por usuário', async () => {
    usageRows = [{ tokens_total: 9_000_000 }];
    respostas = ['Texto limpo.'];
    await generateGuide(guia, null, null);
    assert.equal(chamadas.length, 1);
  });

  it('falha aberta quando o banco não responde', async () => {
    usageError = { message: 'db fora do ar' };
    respostas = ['Texto limpo.'];
    await generateGuide(guia, 'u1', 'a1');
    assert.equal(chamadas.length, 1);
  });
});

describe('DEV-304 · registro de uso', () => {
  it('grava uma linha em ai_usage por resposta, inclusive a recusada pela guarda', async () => {
    respostas = ['Use a radiestesia.', 'Texto limpo.'];
    await generateGuide(guia, 'u1', 'a1');
    const usos = inserts.filter((i) => i.table === 'ai_usage');
    assert.equal(usos.length, 2);
    assert.equal(usos[0]!.row.task, 'guide');
    assert.equal(usos[0]!.row.tokens_total, 30);
  });

  it('o system prompt enviado traz as regras do produto', async () => {
    respostas = ['Texto limpo.'];
    await generateGuide(guia, 'u1', 'a1');
    assert.match(chamadas[0]!.system, /NUNCA cria, sugere/);
    assert.match(chamadas[0]!.system, /Tensão Vibracional/);
  });
});
