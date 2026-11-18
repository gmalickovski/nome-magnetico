import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  analisarNomesSocial,
  distorcaoDoNome,
  type AnaliseNomeSocial,
  type OpcoesRankingNomeSocial,
} from './products/nome-social.ts';
import { SUGESTAO_CONFIG_V4 } from './score-config.ts';

/**
 * DEV-304 · A entrevista manda. Quando ela NÃO define o estilo, a maioria das pessoas quer uma
 * assinatura que mude pouco (primeiro nome + um sobrenome); acento e o que destoa do nome real
 * ficam por último. A sugestão de maior nota continua sempre visível.
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

function candidato(nivel: number | undefined, extra: Partial<AnaliseNomeSocial> = {}) {
  return { nivelGerado: nivel, grafiaArtificial: false, ...extra };
}

describe('DEV-304 · distorcaoDoNome (menor muda menos o nome)', () => {
  it('DEV-317: a distorção segue a ordem de tentativas (V1 < V2 < V3 < V4 < V5 < apelido < V6 < V8 < dobra)', () => {
    const ordem = [0, 10, 30, 40, 50, 55, 56, 60, 70, 130].map((n) => distorcaoDoNome(candidato(n)));
    for (let i = 1; i < ordem.length; i++) assert.ok(ordem[i - 1]! < ordem[i]!, `posição ${i}`);
  });

  it('grafia artificial fica sempre atrás, em qualquer nível', () => {
    for (const nivel of [0, 10, 20, 25, 50, 65, 80, 90, 120]) {
      assert.ok(
        distorcaoDoNome(candidato(nivel, { grafiaArtificial: true })) > distorcaoDoNome(candidato(120)),
        `nível ${nivel}`,
      );
    }
  });
});

const FIXTURES: Array<[string, string]> = [
  ['Pedro Souza Rocha', '01/01/1990'],
  ['Pedro Souza Rocha', '18/03/1992'],
  ['Larissa Moreira Teixeira Lima', '01/01/1990'],
  ['Larissa Moreira Teixeira Lima', '18/03/1992'],
  ['Camila Dias Nunes', '01/01/1990'],
  ['Camila Dias Nunes', '18/03/1992'],
  ['Bruno Carvalho Ribeiro', '01/01/1990'],
  ['Bruno Carvalho Ribeiro', '18/03/1992'],
  ['Ana Paula Ferreira Lima', '01/01/1990'],
  ['Ana Paula Ferreira Lima', '18/03/1992'],
  ['Guilherme Malickovski Correa', '01/01/1990'],
  ['Guilherme Malickovski Correa', '18/03/1992'],
  ['Rafael Souza Almeida Barbosa', '23/07/1988'],
  ['Beatriz Costa Mendes', '05/06/1993'],
];

describe('DEV-304 · entrevista aberta: o que muda menos o nome vence, e a maior nota continua visível', () => {
  it('DEV-317: sem entrevista, o selo Principal é a maior nota e vem em 1º; o resto segue a ordem', () => {
    let casos = 0;
    for (const [nasc, data] of FIXTURES) {
      const r = analisarNomesSocial([], nasc, data, {});
      if (!r.melhorNome) continue;
      casos++;
      // Grafia artificial (til no meio) só é Principal se não houver natural.
      const naturais = r.nomesCandidatos.filter((c) => !c.grafiaArtificial);
      const maxima = Math.max(...(naturais.length ? naturais : r.nomesCandidatos).map((c) => c.score));
      assert.equal(r.melhorNome.score, maxima, `${nasc} ${data}`);
      assert.equal(r.melhorNome.principal, true);
      assert.equal(r.nomesCandidatos[0], r.melhorNome);
      const resto = r.nomesCandidatos.slice(1).filter((c) => !c.maiorNota);
      for (let i = 1; i < resto.length; i++) {
        if (resto[i - 1]!.pisoRelaxado !== resto[i]!.pisoRelaxado) continue;
        if ((resto[i - 1]!.nivelGerado ?? 0) >= 100 !== (resto[i]!.nivelGerado ?? 0) >= 100) continue;
        assert.ok((resto[i - 1]!.nivelGerado ?? 0) <= (resto[i]!.nivelGerado ?? 0), `${nasc}: ordem ${i}`);
      }
    }
    assert.ok(casos >= 6, `só ${casos} casos`);
  });

  it('a sugestão de maior nota sempre aparece, mesmo quando não é o Nome de Ouro', () => {
    for (const [nasc, data] of FIXTURES) {
      const r = analisarNomesSocial([], nasc, data, {});
      if (r.nomesCandidatos.length === 0) continue;
      const maxima = Math.max(...r.nomesCandidatos.map((c) => c.score));
      const visiveis = [r.melhorNome!, ...r.top3];
      assert.equal(Math.max(...visiveis.map((c) => c.score)), maxima, `${nasc} ${data}`);
    }
  });

  it('DEV-317: Camila Dias Nunes sem estilo: a 1ª é a de maior nota (Principal e Maior nota)', () => {
    const r = analisarNomesSocial([], 'Camila Dias Nunes', '01/01/1990', {});
    const maior = r.nomesCandidatos.reduce((m, c) => (c.score > m.score ? c : m));
    assert.equal(r.melhorNome!.score, maior.score);
    assert.equal(r.melhorNome!.maiorNota, true);
  });
});

describe('DEV-304 · a entrevista manda sobre o padrão', () => {
  const nasc = 'Camila Dias Nunes';
  const data = '01/01/1990';

  it('"um acento ou letra" (estilo ajuste sutil): o Principal mantém o nome completo', () => {
    const sutil = analisarNomesSocial([], nasc, data, { estiloPreferido: 'ajuste_sutil' });
    const principal = sutil.nomesCandidatos.find((c) => c.principal);
    assert.ok(principal);
    assert.equal(principal!.nomeCompleto.split(/\s+/).length, nasc.split(/\s+/).length, principal!.nomeCompleto);
    assert.equal(sutil.melhorNome, principal);
  });

  it('"a nota mais alta" vence a naturalidade', () => {
    const r = analisarNomesSocial([], nasc, data, { prioridadeConflito: 'nota' });
    assert.equal(r.melhorNome!.score, Math.max(...r.nomesCandidatos.map((c) => c.score)));
  });

  it('sobrenomes que a pessoa disse usar vêm antes: o Nome de Ouro os mantém', () => {
    const nome = 'Pedro Souza Rocha';
    const opcoes: OpcoesRankingNomeSocial = { sobrenomesObrigatorios: ['Souza', 'Rocha'] };
    const r = analisarNomesSocial([], nome, '01/01/1990', opcoes);
    const normaliza = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const ouro = normaliza(r.melhorNome!.nomeCompleto);
    assert.ok(ouro.includes('souza') && ouro.includes('rocha'), r.melhorNome!.nomeCompleto);
  });

  it('"curto e direto" e "sem acento" continuam mandando', () => {
    const curto = analisarNomesSocial([], nasc, data, { estiloPreferido: 'curto_direto', aceitaEncurtarOuApelido: true });
    assert.ok(curto.melhorNome);
    const semAcento = analisarNomesSocial([], nasc, data, { acentoNaAssinatura: 'prefere_sem' });
    assert.notEqual(semAcento.melhorNome!.temAcentoAdicionado, true);
  });
});

describe('DEV-304 · rollback', () => {
  it('NOME_SOCIAL_MOTOR_V4=false desliga a naturalidade padrão', () => {
    process.env.NOME_SOCIAL_MOTOR_V4 = 'false';
    try {
      const r = analisarNomesSocial([], 'Camila Dias Nunes', '01/01/1990', {});
      assert.notEqual(r.melhorNome?.nomeCompleto, 'Camila Nunes');
      assert.equal(r.motorV4, false);
    } finally {
      delete process.env.NOME_SOCIAL_MOTOR_V4;
    }
  });
});

describe('DEV-304 · preferências estruturais da entrevista vêm primeiro', () => {
  const nome = 'Larissa Moreira Teixeira Lima';
  const data = '18/03/1992';
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  it('sobrenome escolhido: quem o mantém vem antes, e as demais por menor distorção', () => {
    const r = analisarNomesSocial([], nome, data, {
      sobrenomesObrigatorios: ['Teixeira'],
      sobrenomesExcluidos: ['Moreira', 'Lima'],
    });
    const atende = (c: AnaliseNomeSocial) =>
      norm(c.nomeCompleto).includes('teixeira') &&
      !norm(c.nomeCompleto).includes('moreira') &&
      !norm(c.nomeCompleto).includes('lima');
    assert.ok(atende(r.melhorNome!), r.melhorNome!.nomeCompleto);
    // A vitrine inicial traz até 6 opções e a de maior nota está sempre nela.
    const vitrine = [r.melhorNome!, ...r.top3];
    assert.ok(vitrine.length <= 6);
    assert.equal(Math.max(...vitrine.map((c) => c.score)), Math.max(...r.nomesCandidatos.map((c) => c.score)));
  });

  it('só o primeiro nome: o Nome de Ouro não contém sobrenomes', () => {
    const r = analisarNomesSocial([], 'Camila Dias Nunes', '01/01/1990', {
      sobrenomesObrigatorios: [],
      sobrenomesExcluidos: ['Dias', 'Nunes'],
    });
    if (r.melhorNome) {
      const o = norm(r.melhorNome.nomeCompleto);
      assert.ok(!o.includes('dias') && !o.includes('nunes'), r.melhorNome.nomeCompleto);
    }
  });
});
