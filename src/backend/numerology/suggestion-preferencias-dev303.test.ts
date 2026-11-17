import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  analisarNomesSocial,
  scoreNascimentoNomeSocial,
  type AnaliseNomeSocial,
  type OpcoesRankingNomeSocial,
} from './products/nome-social.ts';
import { scoreMinimoSugestao } from './suggestion-birth-invariant.ts';

/**
 * DEV-303 · preferências novas do questionário no motor de sugestões.
 * Sempre moles: valem dentro do conjunto válido (zero bloqueio, nota mínima) e relaxam
 * em cascata quando faltam opções. Fixtures sintéticas.
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

const NASC = 'Pedro Souza Rocha';
const DATA = '01/01/1990';

function visiveis(r: ReturnType<typeof analisarNomesSocial>): AnaliseNomeSocial[] {
  const vistos = new Set<string>();
  const lista: AnaliseNomeSocial[] = [];
  for (const c of [...(r.melhorNome ? [r.melhorNome] : []), ...r.top3, ...r.nomesCandidatos]) {
    if (vistos.has(c.nomeCompleto)) continue;
    vistos.add(c.nomeCompleto);
    lista.push(c);
  }
  return lista;
}

function invariantes(r: ReturnType<typeof analisarNomesSocial>, nasc = NASC, data = DATA) {
  const minimo = scoreMinimoSugestao(scoreNascimentoNomeSocial(nasc, data));
  for (const c of visiveis(r)) {
    assert.equal(c.temBloqueio, false, `${c.nomeCompleto} com bloqueio`);
    assert.ok(c.score >= minimo, `${c.nomeCompleto} (${c.score}) abaixo de ${minimo}`);
  }
  if (r.nomesCandidatos.length > 0) {
    const maxLista = Math.max(...r.nomesCandidatos.map((c) => c.score));
    const maxVisivel = Math.max(...[r.melhorNome!, ...r.top3].map((c) => c.score));
    assert.equal(maxVisivel, maxLista, 'a maior nota segue visível');
  }
}

describe('DEV-303 · "Manter meu primeiro nome"', () => {
  it('as sugestões mantêm o primeiro nome idêntico ao do nascimento', () => {
    const r = analisarNomesSocial([], NASC, DATA, { manterPrimeiroNome: true });
    invariantes(r);
    const lista = visiveis(r);
    assert.ok(lista.length > 0);
    for (const c of lista) {
      assert.equal(c.nomeCompleto.split(/\s+/)[0], 'Pedro', `${c.nomeCompleto} mudou o primeiro nome`);
    }
  });

  it('sem a preferência o primeiro nome pode mudar (a regra tem efeito)', () => {
    const livre = visiveis(analisarNomesSocial([], NASC, DATA, {}));
    assert.ok(livre.some((c) => c.nomeCompleto.split(/\s+/)[0] !== 'Pedro'));
  });
});

describe('DEV-303 · "Prefiro sem acento"', () => {
  it('com 3 ou mais opções sem acento, nenhuma sugestão ganha acento novo', () => {
    // 4 nomes: sobrenomes suficientes para remover sem precisar de acento.
    const nasc = 'Rafael Souza Almeida Barbosa';
    const data = '01/01/1990';
    const r = analisarNomesSocial([], nasc, data, { acentoNaAssinatura: 'prefere_sem' });
    invariantes(r, nasc, data);
    const lista = visiveis(r);
    assert.ok(lista.length >= 3);
    for (const c of lista) assert.notEqual(c.temAcentoAdicionado, true, `${c.nomeCompleto} ganhou acento`);
  });

  it('com poucas opções sem acento, a preferência relaxa mas o Nome de Ouro sem acento vence no mesmo patamar', () => {
    const nasc = 'Ana Paula Ferreira Lima';
    const data = '18/03/1992';
    const r = analisarNomesSocial([], nasc, data, { acentoNaAssinatura: 'prefere_sem' });
    invariantes(r, nasc, data);
    const ouro = r.melhorNome!;
    const mesmoPatamar = (score: number) => score >= 85 === ouro.score >= 85;
    const semAcentoNoPatamar = r.nomesCandidatos.filter(
      (c) => !c.temAcentoAdicionado && mesmoPatamar(c.score),
    );
    if (semAcentoNoPatamar.length > 0) {
      assert.notEqual(ouro.temAcentoAdicionado, true, `${ouro.nomeCompleto} ganhou acento`);
    }
  });

  it('sem a preferência, o acento é livre (a regra tem efeito)', () => {
    const livre = visiveis(analisarNomesSocial([], NASC, DATA, {}));
    assert.ok(livre.some((c) => c.temAcentoAdicionado === true));
  });
});

describe('DEV-303 · "Se for preciso escolher": nota mais alta', () => {
  it('o Nome de Ouro é o de maior nota', () => {
    const r = analisarNomesSocial([], NASC, DATA, { prioridadeConflito: 'nota' });
    invariantes(r);
    const maxLista = Math.max(...r.nomesCandidatos.map((c) => c.score));
    assert.equal(r.melhorNome!.score, maxLista);
  });

  it('com "mudar o mínimo" a menor mudança pode ter nota menor, e a maior nota segue visível', () => {
    const r = analisarNomesSocial([], NASC, DATA, { prioridadeConflito: 'mudanca', estiloPreferido: 'ajuste_sutil' });
    invariantes(r);
  });

  it('a prioridade não passa por cima de bloqueio nem da nota mínima', () => {
    for (const prioridade of ['nota', 'mudanca'] as const) {
      invariantes(analisarNomesSocial([], NASC, DATA, { prioridadeConflito: prioridade }));
    }
  });
});

describe('DEV-303 · relaxamento em cascata', () => {
  it('combinação rígida nunca devolve inválida: relaxa a preferência, não a regra', () => {
    const rigido: OpcoesRankingNomeSocial = {
      manterPrimeiroNome: true,
      acentoNaAssinatura: 'prefere_sem',
      maxNivelGeracao: 25,
      sobrenomesExcluidos: ['Souza', 'Rocha'],
    };
    const r = analisarNomesSocial([], NASC, DATA, rigido);
    invariantes(r);
  });

  it('restrição legal (contratos) não relaxa sozinha: só etapas 1 e 2', () => {
    const r = analisarNomesSocial([], NASC, DATA, {
      restricaoDocumentosLegais: true,
      manterPrimeiroNome: true,
    });
    invariantes(r);
    for (const c of visiveis(r)) {
      assert.ok((c.etapa ?? 1) <= 2, `${c.nomeCompleto} é etapa ${c.etapa}`);
    }
  });

  it('as 3 preferências juntas com "gerar mais" nunca repetem nem trazem inválidas', () => {
    const vistos = new Set<string>();
    for (let rodada = 0; rodada < 6; rodada++) {
      const r = analisarNomesSocial([], NASC, DATA, {
        manterPrimeiroNome: true,
        acentoNaAssinatura: 'prefere_sem',
        prioridadeConflito: 'nota',
        nomesExcluidos: [...vistos],
      });
      const lista = visiveis(r);
      const minimo = scoreMinimoSugestao(scoreNascimentoNomeSocial(NASC, DATA));
      for (const c of lista) {
        assert.equal(c.temBloqueio, false);
        assert.ok(c.score >= minimo);
        assert.ok(!vistos.has(c.nomeCompleto.toLowerCase()), `${c.nomeCompleto} repetido`);
      }
      if (r.semOpcoesElegiveis) break;
      for (const c of r.nomesCandidatos) vistos.add(c.nomeCompleto.toLowerCase());
    }
  });
});

describe('DEV-303 · rollback e compatibilidade', () => {
  it('NOME_SOCIAL_MOTOR_V4=false ignora as preferências novas', () => {
    process.env.NOME_SOCIAL_MOTOR_V4 = 'false';
    try {
      const base = analisarNomesSocial([], NASC, DATA, {});
      const comPrefs = analisarNomesSocial([], NASC, DATA, {
        manterPrimeiroNome: true,
        acentoNaAssinatura: 'prefere_sem',
        prioridadeConflito: 'nota',
      });
      assert.equal(comPrefs.melhorNome?.nomeCompleto, base.melhorNome?.nomeCompleto);
    } finally {
      delete process.env.NOME_SOCIAL_MOTOR_V4;
    }
  });

  it('sem preferências novas o resultado é idêntico ao de antes', () => {
    const a = analisarNomesSocial([], NASC, DATA, {});
    const b = analisarNomesSocial([], NASC, DATA, {
      manterPrimeiroNome: undefined,
      acentoNaAssinatura: undefined,
      prioridadeConflito: undefined,
    });
    assert.deepEqual(
      b.nomesCandidatos.map((c) => c.nomeCompleto),
      a.nomesCandidatos.map((c) => c.nomeCompleto),
    );
    assert.equal(b.melhorNome?.nomeCompleto, a.melhorNome?.nomeCompleto);
  });
});

describe('DEV-304 · grafia natural vem antes da artificial (achado do teste real)', () => {
  // Perfil do teste real: "não me representa", nome artístico, sem acento, nota mais alta.
  const perfilReal: OpcoesRankingNomeSocial = {
    estiloPreferido: 'curto_direto',
    aceitaEncurtarOuApelido: true,
    sobrenomesObrigatorios: ['Souza', 'Rocha'],
    ondeVaiUsar: ['marca_autoria'],
    acentoNaAssinatura: 'prefere_sem',
    prioridadeConflito: 'nota',
    afinidades: { area: 'carreira_negocios', estilo: ['criatividade'], subfocos: ['novo_ciclo_profissional'] },
  };

  it('com a mesma nota, o Nome de Ouro e as sugestões visíveis não ficam atrás de grafia artificial', () => {
    const r = analisarNomesSocial([], NASC, DATA, perfilReal);
    invariantes(r);
    const ouro = r.melhorNome!;
    assert.notEqual(ouro.grafiaArtificial, true, `${ouro.nomeCompleto} é artificial`);
    const naturaisNoPatamar = r.nomesCandidatos.filter(
      (c) => c.grafiaArtificial !== true && c.score >= 85 === ouro.score >= 85,
    );
    assert.ok(naturaisNoPatamar.length > 0);
  });

  it('sem "nota mais alta" a grafia natural também vence no mesmo patamar', () => {
    const r = analisarNomesSocial([], NASC, DATA, { ...perfilReal, prioridadeConflito: 'mudanca' });
    invariantes(r);
    const ouro = r.melhorNome!;
    const naturaisNoPatamar = r.nomesCandidatos.filter(
      (c) => c.grafiaArtificial !== true && c.score >= 85 === ouro.score >= 85,
    );
    if (naturaisNoPatamar.length > 0) assert.notEqual(ouro.grafiaArtificial, true);
  });

  it('o til fora de ã final, ão, ãe e õe fica marcado como artificial', () => {
    const r = analisarNomesSocial([], NASC, DATA, perfilReal);
    for (const c of r.nomesCandidatos) {
      const temTilFora = /[ãõ]/i.test(c.nomeCompleto.normalize('NFC')) && !/ã$|ão|ãe|õe/i.test(c.nomeCompleto.normalize('NFC'));
      if (temTilFora) assert.equal(c.grafiaArtificial, true, c.nomeCompleto);
    }
  });
});
