import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SYSTEM_KABBALISTIC } from './prompts/system-kabbalistic.ts';
import { buildSocialAnalysisPrompt } from './prompts/social-prompt.ts';
import { buildSuggestionsPrompt } from './prompts/suggestions-prompt.ts';
import { buildGuidePrompt } from './prompts/guide-prompt.ts';
import { COPY_PROIBIDA } from './output-guard.ts';
import { MODELS, getModel, type AITask } from './config/models.ts';
import { TASK_CONFIG } from './config/temperatures.ts';
import { getDefaultProvider, type AIProvider } from './config/providers.ts';
import { analisarNomesSocial, scoreNascimentoNomeSocial } from '../numerology/products/nome-social.ts';
import { scoreMinimoSugestao } from '../numerology/suggestion-birth-invariant.ts';
import { calcularCincoNumeros } from '../numerology/numbers.ts';

/**
 * DEV-304 · auditoria estática dos prompts e da configuração de IA. Sem rede.
 */

const ENVS = ['SCORE_VERSION', 'NOME_SOCIAL_MOTOR_V4', 'AI_DEFAULT_PROVIDER'] as const;
const salvo: Record<string, string | undefined> = {};

before(() => {
  for (const k of ENVS) salvo[k] = process.env[k];
  process.env.SCORE_VERSION = 'v3';
  delete process.env.NOME_SOCIAL_MOTOR_V4;
  delete process.env.AI_DEFAULT_PROVIDER;
});

after(() => {
  for (const k of ENVS) {
    if (salvo[k] === undefined) delete process.env[k];
    else process.env[k] = salvo[k];
  }
});

describe('DEV-304 · system prompt com as regras atuais', () => {
  it('acentos: agudo +2, til +3, circunflexo e anel +7, grave e trema ×2 (nunca ×3)', () => {
    assert.match(SYSTEM_KABBALISTIC, /agudo soma 2/);
    assert.match(SYSTEM_KABBALISTIC, /til soma 3/);
    assert.match(SYSTEM_KABBALISTIC, /circunflexo soma 7/);
    assert.match(SYSTEM_KABBALISTIC, /anel soma 7/);
    assert.match(SYSTEM_KABBALISTIC, /grave e trema multiplicam por 2/);
    assert.doesNotMatch(SYSTEM_KABBALISTIC, /×\s?3/);
  });

  it('os 5 números seguem a definição do projeto (Impressão = consoantes, Missão = Destino + Expressão)', () => {
    assert.match(SYSTEM_KABBALISTIC, /Impressão \(consoantes, sempre de 1 a 9\)/);
    assert.match(SYSTEM_KABBALISTIC, /Missão \(Destino \+ Expressão\)/);
    assert.doesNotMatch(SYSTEM_KABBALISTIC, /Impressão \(primeiro nome\)/);
    assert.match(SYSTEM_KABBALISTIC, /11 e 22 não são reduzidos em Expressão, Destino, Motivação e Missão/);
  });

  it('a tabela letra → número bate com a do projeto', () => {
    assert.match(
      SYSTEM_KABBALISTIC,
      /1 = A I Q J Y; 2 = B K R; 3 = C G L S; 4 = D M T; 5 = E H N; 6 = U V W X Ç; 7 = O Z; 8 = F P/,
    );
  });

  it('regras de nomes: só nomes dos dados, sem bloqueio, nota mínima 70, maior nota sempre aparece', () => {
    assert.match(SYSTEM_KABBALISTIC, /NUNCA cria, sugere, completa ou compara com nomes que não estejam nos dados/);
    assert.match(SYSTEM_KABBALISTIC, /sem bloqueios nos 4 triângulos e com nota de pelo menos 70/);
    assert.match(SYSTEM_KABBALISTIC, /opção de maior nota sempre aparece/);
    assert.match(SYSTEM_KABBALISTIC, /não há opção válida/);
  });

  it('proíbe radiestesia, "incompatível", promessa de prazo e preço', () => {
    assert.match(SYSTEM_KABBALISTIC, /radiestesia, pêndulo/);
    assert.match(SYSTEM_KABBALISTIC, /Use "Tensão Vibracional"/);
    assert.match(SYSTEM_KABBALISTIC, /prazo de entrega, revisão individual da análise/);
    assert.match(SYSTEM_KABBALISTIC, /self-service e o acesso é imediato/);
    assert.match(SYSTEM_KABBALISTIC, /Nunca cite preço/);
  });
});

describe('DEV-304 · nenhum prompt carrega vocabulário proibido', () => {
  const pasta = join(import.meta.dirname, 'prompts');
  const arquivos = readdirSync(pasta).filter((f) => f.endsWith('.ts') && f !== 'system-kabbalistic.ts');

  it('há prompts para auditar', () => {
    assert.ok(arquivos.length >= 5, `achou só ${arquivos.length}`);
  });

  for (const arquivo of arquivos) {
    it(`${arquivo}: sem radiestesia, "incompatível", prazo de entrega nem preço`, () => {
      const fonte = readFileSync(join(pasta, arquivo), 'utf8');
      for (const regra of COPY_PROIBIDA) {
        assert.doesNotMatch(fonte, regra.regex, `${arquivo} casa a regra ${regra.id}`);
      }
    });
  }
});

describe('DEV-304 · prompt do Nome Social com o resultado real do motor', () => {
  const nasc = 'Pedro Souza Rocha';
  const data = '01/01/1990';

  it('lista só nomes válidos: nenhum bloqueio e nenhum abaixo da nota mínima', () => {
    const resultado = analisarNomesSocial([], nasc, data, {});
    const minimo = scoreMinimoSugestao(scoreNascimentoNomeSocial(nasc, data));
    assert.ok(resultado.nomesCandidatos.length > 0);
    for (const c of resultado.nomesCandidatos) {
      assert.equal(c.temBloqueio, false);
      assert.ok(c.score >= minimo);
    }

    const prompt = buildSocialAnalysisPrompt({ resultado, nomeNascimento: nasc });
    assert.doesNotMatch(prompt, /⚠ \d+ bloqueio/, 'o prompt não pode listar candidato com bloqueio');
    for (const c of resultado.nomesCandidatos.slice(0, 10)) {
      assert.ok(prompt.includes(`**${c.nomeCompleto}**`), `${c.nomeCompleto} deveria estar no ranking`);
    }
    assert.match(prompt, /Use SOMENTE os nomes listados acima/);
    assert.doesNotMatch(prompt, /Sem opção válida/);
  });

  it('sem nenhuma opção válida, o prompt manda explicar com honestidade e não inventar nome', () => {
    const base = analisarNomesSocial([], nasc, data, {});
    const vazio = { ...base, melhorNome: null, top3: [], nomesCandidatos: [], semOpcoesElegiveis: true };
    const prompt = buildSocialAnalysisPrompt({ resultado: vazio, nomeNascimento: nasc });
    assert.match(prompt, /Sem opção válida/);
    assert.match(prompt, /NÃO invente nenhum nome alternativo/);
    assert.match(prompt, /Nenhum candidato com score válido encontrado/);
  });

  it('não cita o valor do relatório', () => {
    const resultado = analisarNomesSocial([], nasc, data, {});
    const prompt = buildSocialAnalysisPrompt({ resultado, nomeNascimento: nasc });
    assert.doesNotMatch(prompt, /R\$\s?\d/);
    assert.match(prompt, /nunca cite preço ou valor/);
  });
});

describe('DEV-304 · prompts de sugestões e guia', () => {
  it('sugestões: pede só nomes da lista, escritos como estão', () => {
    const prompt = buildSuggestionsPrompt({
      nomeCompleto: 'Ana Silva Santos',
      cincoNumeros: calcularCincoNumeros('Ana Silva Santos', '01/01/1990'),
      gender: 'Feminino',
      variacoesCandidatas: [
        {
          nome: 'Aná Silva',
          numerosExpressao: 5,
          motivacao: 4,
          impressao: 8,
          temBloqueio: false,
          score: 92,
          scoreTeto: 100,
          justificativa: 'Sem bloqueios energéticos',
        },
      ],
    });
    assert.match(prompt, /somente nomes que estejam na lista acima/);
    assert.match(prompt, /nunca crie nomes novos/);
    assert.match(prompt, /Nome: \[nome completo\]/);
  });

  it('guia: não promete prazo nem resultado', () => {
    const prompt = buildGuidePrompt({
      nomeCompleto: 'Ana Silva Santos',
      nomeMagnetico: 'Aná Silva',
      numeroExpressaoOriginal: 3,
      numeroExpressaoNovo: 5,
      bloqueiosRemovidos: ['333'],
    });
    for (const regra of COPY_PROIBIDA) assert.doesNotMatch(prompt, regra.regex, regra.id);
  });
});

describe('DEV-304 · configuração de modelos, temperaturas e provedor', () => {
  const provedores: AIProvider[] = ['groq', 'claude', 'openai'];
  const tarefas: AITask[] = ['analysis', 'suggestions', 'guide', 'support_polish'];

  it('todo provedor tem modelo para toda tarefa', () => {
    for (const p of provedores) {
      for (const t of tarefas) {
        assert.ok(MODELS[p][t].trim().length > 0, `${p}/${t} sem modelo`);
        assert.equal(getModel(p, t), MODELS[p][t]);
      }
    }
  });

  it('Groq não usa os modelos Llama aposentados em 16/08/2026', () => {
    for (const t of tarefas) assert.doesNotMatch(MODELS.groq[t], /llama-3\.(1|3)/i, `groq/${t}`);
  });

  it('temperatura entre 0 e 1 e limite de tokens coerente com o tamanho do texto', () => {
    for (const t of tarefas) {
      assert.ok(TASK_CONFIG[t].temperature >= 0 && TASK_CONFIG[t].temperature <= 1, t);
      assert.ok(TASK_CONFIG[t].maxTokens >= 1024, t);
    }
    // Análise completa (9 seções) precisa de espaço; modelos com raciocínio gastam parte dele.
    assert.ok(TASK_CONFIG.analysis.maxTokens >= 6000);
    // Escolha entre candidatas dadas não pede criatividade.
    assert.ok(TASK_CONFIG.suggestions.temperature <= 0.5);
  });

  it('provedor padrão é Groq, com override por AI_DEFAULT_PROVIDER e valor inválido ignorado', () => {
    assert.equal(getDefaultProvider(), 'groq');
    process.env.AI_DEFAULT_PROVIDER = 'claude';
    assert.equal(getDefaultProvider(), 'claude');
    process.env.AI_DEFAULT_PROVIDER = 'openai';
    assert.equal(getDefaultProvider(), 'openai');
    process.env.AI_DEFAULT_PROVIDER = 'inexistente';
    assert.equal(getDefaultProvider(), 'groq');
    delete process.env.AI_DEFAULT_PROVIDER;
  });
});
