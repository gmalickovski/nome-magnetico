import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  AFINIDADE_AREA,
  AFINIDADE_ESTILO,
  AFINIDADE_SUBFOCO,
  explicarAderenciaPerfil,
  listarAfinidadesAtendidas,
  pontuarAderenciaPerfil,
  temAfinidades,
} from './profile-affinity.ts';
import {
  analisarNomeSocial,
  analisarNomesSocial,
  scoreNascimentoNomeSocial,
  type OpcoesRankingNomeSocial,
} from './products/nome-social.ts';
import { scoreMinimoSugestao } from './suggestion-birth-invariant.ts';
import { getQuestionSpec } from '../../shared/interactive-engine/questionnaire-adaptive.ts';
import { profileToRankingOpcoes } from '../../shared/interactive-engine/questionnaire-map.ts';

/**
 * DEV-302 · O perfil da entrevista (estilo, foco e subfoco) passa a influenciar o nome,
 * só por afinidade numérica e só entre sugestões válidas (R1/R2 da DEV-301).
 */

const ENVS = ['SCORE_VERSION', 'NOME_SOCIAL_MOTOR_V4', 'NOME_SOCIAL_GANHO_MINIMO_PONTOS'] as const;
const salvo: Record<string, string | undefined> = {};

before(() => {
  for (const k of ENVS) salvo[k] = process.env[k];
  process.env.SCORE_VERSION = 'v3';
  delete process.env.NOME_SOCIAL_MOTOR_V4;
  delete process.env.NOME_SOCIAL_GANHO_MINIMO_PONTOS;
});

after(() => {
  for (const k of ENVS) {
    if (salvo[k] === undefined) delete process.env[k];
    else process.env[k] = salvo[k];
  }
});

const CTX = { nomeCompleto: 'Ana Silva Santos', sobrenomes: ['Silva', 'Santos'] };

describe('DEV-302 · o mapa cobre todas as respostas do questionário', () => {
  it('estilo_presenca: todos os ids têm afinidade', () => {
    const ids = (getQuestionSpec('estilo_presenca', { ...CTX, areaFoco: null }).staticOptions ?? []).map((o) => o.id);
    assert.ok(ids.length >= 4);
    for (const id of ids) assert.ok(AFINIDADE_ESTILO[id], `sem afinidade para estilo ${id}`);
  });

  it('area_foco: todos os ids têm afinidade', () => {
    const ids = (getQuestionSpec('area_foco', { ...CTX, areaFoco: null }).staticOptions ?? []).map((o) => o.id);
    assert.equal(ids.length, 4);
    for (const id of ids) assert.ok(AFINIDADE_AREA[id], `sem afinidade para área ${id}`);
  });

  it('subfoco: todos os ids das 4 áreas têm afinidade', () => {
    const areas = ['prosperidade_financeira', 'carreira_negocios', 'relacionamentos_harmonia', 'autoestima_expressao'] as const;
    for (const areaFoco of areas) {
      const ids = (getQuestionSpec('subfoco', { ...CTX, areaFoco }).staticOptions ?? []).map((o) => o.id);
      assert.ok(ids.length > 0);
      for (const id of ids) assert.ok(AFINIDADE_SUBFOCO[id], `sem afinidade para subfoco ${id} (${areaFoco})`);
    }
  });

  it('só números válidos (1 a 9, 11 e 22)', () => {
    const validos = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22]);
    for (const mapa of [AFINIDADE_AREA, AFINIDADE_ESTILO, AFINIDADE_SUBFOCO]) {
      for (const [id, nums] of Object.entries(mapa)) {
        for (const n of nums) assert.ok(validos.has(n), `${id}: ${n} inválido`);
      }
    }
  });
});

describe('DEV-302 · pontuarAderenciaPerfil', () => {
  it('sem afinidades ou com ids desconhecidos, 0', () => {
    assert.equal(temAfinidades(undefined), false);
    assert.equal(temAfinidades({}), false);
    assert.equal(temAfinidades({ area: 'inexistente', estilo: ['x'], subfocos: ['y'] }), false);
    assert.equal(pontuarAderenciaPerfil({ expressao: 8, motivacao: 4, impressao: 8 }, undefined), 0);
    assert.equal(pontuarAderenciaPerfil({ expressao: 8, motivacao: 4, impressao: 8 }, { area: 'inexistente' }), 0);
  });

  it('casamento total vale 1; nenhum vale 0; parcial fica no meio', () => {
    const area = { area: 'prosperidade_financeira' }; // 8 e 4
    assert.equal(pontuarAderenciaPerfil({ expressao: 8, motivacao: 4, impressao: 8 }, area), 1);
    assert.equal(pontuarAderenciaPerfil({ expressao: 1, motivacao: 1, impressao: 1 }, area), 0);
    const parcial = pontuarAderenciaPerfil({ expressao: 8, motivacao: 1, impressao: 1 }, area);
    assert.ok(parcial > 0 && parcial < 1);
    assert.equal(parcial, 0.5);
  });

  it('Expressão pesa mais que Motivação, que pesa mais que Impressão', () => {
    const area = { area: 'prosperidade_financeira' };
    const soExpressao = pontuarAderenciaPerfil({ expressao: 8, motivacao: 1, impressao: 1 }, area);
    const soMotivacao = pontuarAderenciaPerfil({ expressao: 1, motivacao: 8, impressao: 1 }, area);
    const soImpressao = pontuarAderenciaPerfil({ expressao: 1, motivacao: 1, impressao: 8 }, area);
    assert.ok(soExpressao > soMotivacao && soMotivacao > soImpressao);
  });

  it('mestre ligado à raiz conta menos que o número exato (22 ↔ 4)', () => {
    const area = { area: 'prosperidade_financeira' }; // lista tem 8 e 4, sem 22
    const exato = pontuarAderenciaPerfil({ expressao: 4, motivacao: 1, impressao: 1 }, area);
    const mestre = pontuarAderenciaPerfil({ expressao: 22, motivacao: 1, impressao: 1 }, area);
    assert.ok(mestre > 0 && mestre < exato);
  });

  it('mais respostas atendidas, aderência maior', () => {
    const numeros = { expressao: 8, motivacao: 8, impressao: 8 };
    const so = pontuarAderenciaPerfil(numeros, { area: 'relacionamentos_harmonia' });
    const misto = pontuarAderenciaPerfil(numeros, { area: 'prosperidade_financeira', estilo: ['leve_acolhimento'] });
    const total = pontuarAderenciaPerfil(numeros, { area: 'prosperidade_financeira', estilo: ['firme_confiavel'] });
    assert.ok(so < misto && misto < total);
    assert.equal(total, 1);
  });
});

describe('DEV-302 · texto "por que este nome para você"', () => {
  it('cita só o que foi realmente atendido', () => {
    const texto = explicarAderenciaPerfil(
      { expressao: 6, motivacao: 1, impressao: 1 },
      { area: 'relacionamentos_harmonia', estilo: ['firme_confiavel'] },
    );
    assert.ok(texto);
    assert.match(texto!, /Expressão 6 combina com o seu foco em relacionamentos/);
    assert.doesNotMatch(texto!, /firme/);
  });

  it('sem nenhuma afinidade atendida, não há texto (nada é inventado)', () => {
    assert.equal(
      explicarAderenciaPerfil(
        { expressao: 9, motivacao: 9, impressao: 9 },
        { area: 'prosperidade_financeira', estilo: ['firme_confiavel'] },
      ),
      undefined,
    );
    assert.equal(explicarAderenciaPerfil({ expressao: 8, motivacao: 4, impressao: 8 }, undefined), undefined);
  });

  it('mesmo número em duas respostas vira uma frase só, no máximo 2 afinidades', () => {
    const texto = explicarAderenciaPerfil(
      { expressao: 8, motivacao: 8, impressao: 8 },
      { area: 'prosperidade_financeira', estilo: ['firme_confiavel'], subfocos: ['aumentar_renda'] },
    );
    assert.ok(texto);
    assert.equal((texto!.match(/Expressão 8/g) ?? []).length, 1);
    assert.match(texto!, /dinheiro e prosperidade e com a presença firme/);
    assert.equal(listarAfinidadesAtendidas({ expressao: 8, motivacao: 8, impressao: 8 }, {
      area: 'prosperidade_financeira', estilo: ['firme_confiavel'], subfocos: ['aumentar_renda'],
    }).length, 3);
  });

  it('usa Expressão, Motivação e Impressão com maiúscula e nunca "incompatível"', () => {
    const texto = explicarAderenciaPerfil({ expressao: 1, motivacao: 8, impressao: 1 }, { area: 'prosperidade_financeira' });
    assert.match(texto ?? '', /^Motivação 8/);
    assert.doesNotMatch(texto ?? '', /incompat/i);
  });
});

describe('DEV-302 · questionário → opções do ranking', () => {
  const perfil = {
    nomeUsoBase: null,
    sobrenomesObrigatorios: [],
    sobrenomesExcluidos: [],
    relacaoNome: null,
    ondeAssinaRaw: [],
    estiloPresenca: ['firme_confiavel'],
    areaFoco: 'prosperidade_financeira',
    subfocosOrdenados: ['reter_ganhos', 'aumentar_renda'],
    aberturaMudanca: 'acento_ou_letra',
    nomeArtistico: null,
    contextoLeituraOutros: [],
  };

  it('profileToRankingOpcoes repassa as afinidades', () => {
    const opcoes = profileToRankingOpcoes(perfil);
    assert.deepEqual(opcoes.afinidades, {
      estilo: ['firme_confiavel'],
      area: 'prosperidade_financeira',
      subfocos: ['reter_ganhos', 'aumentar_renda'],
    });
  });

  it('sem respostas de perfil, sem afinidades', () => {
    const opcoes = profileToRankingOpcoes({ ...perfil, estiloPresenca: [], areaFoco: null, subfocosOrdenados: [] });
    assert.equal(opcoes.afinidades, undefined);
  });
});

describe('DEV-302 · efeito no motor de sugestões', () => {
  const nasc = 'Pedro Souza Rocha';
  const data = '01/01/1990';
  const prosperidade: OpcoesRankingNomeSocial = {
    afinidades: { area: 'prosperidade_financeira', estilo: ['firme_confiavel'], subfocos: ['reter_ganhos'] },
  };
  const relacionamentos: OpcoesRankingNomeSocial = {
    afinidades: { area: 'relacionamentos_harmonia', estilo: ['leve_acolhimento'], subfocos: ['harmonia_afetiva'] },
  };

  it('perfis diferentes podem gerar Nome de Ouro diferente, sempre válido', () => {
    const scoreNasc = scoreNascimentoNomeSocial(nasc, data);
    const minimo = scoreMinimoSugestao(scoreNasc);
    const a = analisarNomesSocial([], nasc, data, prosperidade);
    const b = analisarNomesSocial([], nasc, data, relacionamentos);
    assert.ok(a.melhorNome && b.melhorNome);
    assert.notEqual(a.melhorNome!.nomeCompleto, b.melhorNome!.nomeCompleto);
    for (const r of [a, b]) {
      assert.equal(r.melhorNome!.temBloqueio, false);
      assert.ok(r.melhorNome!.score >= minimo);
    }
  });

  it('o perfil nunca derruba o Nome de Ouro em 5 pontos ou mais e a maior nota segue visível', () => {
    for (const opcoes of [prosperidade, relacionamentos]) {
      const r = analisarNomesSocial([], nasc, data, opcoes);
      const maxLista = Math.max(...r.nomesCandidatos.map((c) => c.score));
      assert.ok(maxLista - r.melhorNome!.score < 5, `queda de ${maxLista - r.melhorNome!.score} pontos`);
      const visiveis = [r.melhorNome!, ...r.top3];
      assert.equal(Math.max(...visiveis.map((c) => c.score)), maxLista);
    }
  });

  it('a nota do nome não muda com o perfil', () => {
    const r = analisarNomesSocial([], nasc, data, prosperidade);
    for (const c of [r.melhorNome!, ...r.top3]) {
      assert.equal(c.score, analisarNomeSocial(c.nomeCompleto, data, 'ia').score);
    }
  });

  it('o texto do perfil só aparece com afinidades e cita números do próprio nome', () => {
    const r = analisarNomesSocial([], nasc, data, prosperidade);
    const ouro = r.melhorNome!;
    assert.equal(typeof ouro.aderenciaPerfil, 'number');
    if (ouro.explicacaoPerfil) {
      assert.match(ouro.explicacaoPerfil, new RegExp(`(Expressão ${ouro.expressao}|Motivação ${ouro.motivacao}|Impressão ${ouro.impressao})`));
    }
    const semPerfil = analisarNomesSocial([], nasc, data, {});
    assert.equal(semPerfil.melhorNome!.explicacaoPerfil, undefined);
    assert.equal(semPerfil.melhorNome!.aderenciaPerfil, undefined);
  });

  it('sem afinidades o resultado é idêntico ao de antes', () => {
    const base = analisarNomesSocial([], nasc, data, {});
    const comUndefined = analisarNomesSocial([], nasc, data, { afinidades: undefined });
    const vazio = analisarNomesSocial([], nasc, data, { afinidades: {} });
    assert.deepEqual(comUndefined.nomesCandidatos.map((c) => c.nomeCompleto), base.nomesCandidatos.map((c) => c.nomeCompleto));
    assert.deepEqual(vazio.nomesCandidatos.map((c) => c.nomeCompleto), base.nomesCandidatos.map((c) => c.nomeCompleto));
    assert.equal(vazio.melhorNome?.nomeCompleto, base.melhorNome?.nomeCompleto);
  });

  it('NOME_SOCIAL_MOTOR_V4=false ignora as afinidades (rollback)', () => {
    process.env.NOME_SOCIAL_MOTOR_V4 = 'false';
    try {
      const base = analisarNomesSocial([], nasc, data, {});
      const comPerfil = analisarNomesSocial([], nasc, data, prosperidade);
      assert.equal(comPerfil.melhorNome?.nomeCompleto, base.melhorNome?.nomeCompleto);
      assert.equal(comPerfil.melhorNome?.explicacaoPerfil, undefined);
    } finally {
      delete process.env.NOME_SOCIAL_MOTOR_V4;
    }
  });
});
