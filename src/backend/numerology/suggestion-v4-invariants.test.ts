import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  isMotorV4,
  mensagemNaoOfertavel,
  motivoNaoOfertavel,
  passaPisoSugestao,
  scoreMinimoSugestao,
  validarSugestaoOfertavel,
} from './suggestion-birth-invariant.ts';
import {
  analisarNomeSocial,
  analisarNomesSocial,
  classificarGrafia,
  scoreNascimentoNomeSocial,
  type AnaliseNomeSocial,
  type OpcoesRankingNomeSocial,
} from './products/nome-social.ts';
import { calcularPotencialV3 } from './score.ts';

/**
 * DEV-301 · Motor de sugestões v4.
 * R1 zero bloqueio · R2 nota >= max(70, nascimento + 1) · R3a maior nota sempre visível
 * · R4 sem fallback inválido. Fixtures 100% sintéticas.
 */

const ENVS = ['SCORE_VERSION', 'NOME_SOCIAL_GANHO_MINIMO_PONTOS', 'NOME_SOCIAL_MOTOR_V4'] as const;
const salvo: Record<string, string | undefined> = {};

function limparEnv() {
  delete process.env.NOME_SOCIAL_GANHO_MINIMO_PONTOS;
  delete process.env.NOME_SOCIAL_MOTOR_V4;
}

before(() => {
  for (const k of ENVS) salvo[k] = process.env[k];
  process.env.SCORE_VERSION = 'v3';
  limparEnv();
});

after(() => {
  for (const k of ENVS) {
    if (salvo[k] === undefined) delete process.env[k];
    else process.env[k] = salvo[k];
  }
});

describe('DEV-301 · piso e validador (R1/R2)', () => {
  it('nascimento abaixo de 70 → mínimo 70', () => {
    assert.equal(scoreMinimoSugestao(50), 70);
    assert.equal(scoreMinimoSugestao(22), 70);
    assert.equal(scoreMinimoSugestao(68), 70);
  });

  it('nascimento ≥ 70 → sempre acima, nunca igual', () => {
    assert.equal(scoreMinimoSugestao(70), 71);
    assert.equal(scoreMinimoSugestao(91), 92);
    assert.equal(passaPisoSugestao(70, 70), false);
    assert.equal(passaPisoSugestao(71, 70), true);
    assert.equal(passaPisoSugestao(69, 50), false);
    assert.equal(passaPisoSugestao(70, 50), true);
  });

  it('env de ganho só sobe o mínimo e nunca baixa o piso 70', () => {
    process.env.NOME_SOCIAL_GANHO_MINIMO_PONTOS = '5';
    try {
      assert.equal(scoreMinimoSugestao(70), 76);
      assert.equal(scoreMinimoSugestao(50), 70);
    } finally {
      limparEnv();
    }
  });

  it('bloqueio reprova mesmo com nota alta; motivos distintos', () => {
    assert.equal(motivoNaoOfertavel({ score: 95, temBloqueio: true }, 50), 'bloqueio');
    assert.equal(motivoNaoOfertavel({ score: 66, temBloqueio: false }, 66), 'abaixo_do_nascimento');
    assert.equal(motivoNaoOfertavel({ score: 69, temBloqueio: false }, 40), 'abaixo_do_piso');
    assert.equal(motivoNaoOfertavel({ score: 80, temBloqueio: false }, 40), null);
    assert.equal(validarSugestaoOfertavel({ score: 80, temBloqueio: false }, 40).ok, true);
  });

  it('mensagens ao usuário não usam "incompatível"', () => {
    for (const m of ['bloqueio', 'abaixo_do_nascimento', 'abaixo_do_piso'] as const) {
      assert.doesNotMatch(mensagemNaoOfertavel(m, 70), /incompat/i);
    }
  });

  it('NOME_SOCIAL_MOTOR_V4=false volta ao comportamento DEV-275', () => {
    process.env.NOME_SOCIAL_MOTOR_V4 = 'false';
    try {
      assert.equal(isMotorV4(), false);
      assert.equal(scoreMinimoSugestao(50), 51);
      assert.equal(motivoNaoOfertavel({ score: 80, temBloqueio: true }, 50), null);
      const res = analisarNomesSocial([], 'Maria Silva Santos', '01/01/1990', {});
      assert.equal(res.motorV4, false);
    } finally {
      limparEnv();
    }
  });
});

describe('DEV-301 · grafia plausível', () => {
  const nasc = 'Patricia Almeida Lima';

  it('proíbe anel, acento na inicial do sobrenome e acento duplo', () => {
    assert.equal(classificarGrafia('Patricia Ålimeida', nasc), 'proibida');
    assert.equal(classificarGrafia('Patricia Álmeida Lima', nasc), 'proibida');
    assert.equal(classificarGrafia('Patricia Ãlmeida Lima', nasc), 'proibida');
    assert.equal(classificarGrafia('Pátricía Almeida Lima', nasc), 'proibida');
  });

  it('til fora de ã final/ão/ãe e õe é artificial', () => {
    assert.equal(classificarGrafia('Patricia Almeida Limã', nasc), 'natural');
    assert.equal(classificarGrafia('Pãtricia Almeida Lima', nasc), 'artificial');
    assert.equal(classificarGrafia('Patrícia Almeida Lima', nasc), 'natural');
  });

  it('nome igual ao nascimento e acento já existente são naturais', () => {
    assert.equal(classificarGrafia('Patricia Almeida Lima', nasc), 'natural');
    assert.equal(classificarGrafia('João Ávila', 'João Ávila'), 'natural');
  });
});

describe('DEV-301 · nomes do usuário só como comparação', () => {
  it('nome com bloqueio digitado vai para `comparacao`, nunca vira Nome de Ouro', () => {
    const birth = 'Ana Silva';
    const date = '01/01/1990';
    const comBloqueio = analisarNomeSocial('Ana Silva', date, 'usuario');
    assert.equal(comBloqueio.temBloqueio, true, 'fixture precisa ter bloqueio');

    const res = analisarNomesSocial(['Ana Silva'], 'Maria Santos Souza', date, {});
    assert.ok(!res.nomesCandidatos.some((c) => c.nomeCompleto === 'Ana Silva'));
    assert.ok((res.comparacao ?? []).some((c) => c.nomeCompleto === 'Ana Silva' && c.motivoNaoOfertavel === 'bloqueio'));
    assert.notEqual(res.melhorNome?.nomeCompleto, 'Ana Silva');
    void birth;
  });

  it('nome do usuário válido pode ser oferecido', () => {
    const res = analisarNomesSocial(['Ana Santos Souza'], 'Marcos Silva Santos', '18/03/1992', {});
    for (const c of res.nomesCandidatos) {
      assert.equal(c.temBloqueio, false);
      assert.ok(c.score >= (res.scoreMinimoSugestao ?? 70));
    }
  });
});

describe('DEV-301 · "gerar mais" e estado vazio (R3b/R4)', () => {
  it('não repete, não traz inválidas e esgota sem fallback com bloqueio', () => {
    const birth = 'Larissa Moreira Teixeira';
    const date = '23/07/1988';
    const scoreNasc = scoreNascimentoNomeSocial(birth, date);
    const minimo = scoreMinimoSugestao(scoreNasc);
    const vistos = new Set<string>();
    let esgotou = false;

    for (let rodada = 0; rodada < 40; rodada++) {
      const res = analisarNomesSocial([], birth, date, { nomesExcluidos: [...vistos] });
      const lista = [...(res.melhorNome ? [res.melhorNome] : []), ...res.top3, ...res.nomesCandidatos];
      for (const c of lista) {
        assert.equal(c.temBloqueio, false, `${c.nomeCompleto} tem bloqueio`);
        assert.ok(c.score >= minimo, `${c.nomeCompleto} (${c.score}) abaixo de ${minimo}`);
        assert.ok(!vistos.has(c.nomeCompleto.toLowerCase()), `${c.nomeCompleto} repetido`);
      }
      if (res.semOpcoesElegiveis) {
        assert.equal(res.melhorNome, null);
        assert.equal(res.top3.length, 0);
        esgotou = true;
        break;
      }
      for (const c of res.nomesCandidatos) vistos.add(c.nomeCompleto.toLowerCase());
    }
    assert.ok(esgotou, 'a lista deveria esgotar em até 40 rodadas');
  });
});

describe('DEV-301 · potencial só com sugestões ofertáveis', () => {
  it('potencial nunca fica abaixo da nota e respeita o piso quando há ganho', () => {
    const birth = 'Ana Silva';
    const date = '01/01/1990';
    const base = scoreNascimentoNomeSocial(birth, date);
    const potencial = calcularPotencialV3(birth, date);
    assert.ok(potencial >= base);
    if (potencial > base) assert.ok(potencial >= 70);
  });
});

describe('DEV-301 · propriedade sobre perfis do questionário', () => {
  const primeiros = ['Ana', 'Pedro', 'Camila', 'Bruno', 'Larissa', 'Rafael', 'Beatriz', 'Diego'];
  const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Almeida', 'Rocha', 'Mendes', 'Nunes'];
  const datas = ['01/01/1990', '18/03/1992', '23/07/1988'];
  const perfis: OpcoesRankingNomeSocial[] = [
    {},
    { restricaoDocumentosLegais: true },
    { maxNivelGeracao: 50 },
    { estiloPreferido: 'curto_direto', aceitaEncurtarOuApelido: true },
    { estiloPreferido: 'sobrenome_forte' },
    { ondeVaiUsar: ['contratos'] },
  ];

  it('0 bloqueios, 0 abaixo do mínimo, maior nota sempre visível, 0 grafia proibida', () => {
    let casos = 0;
    let n = 0;
    for (const p of primeiros) {
      const s1 = sobrenomes[n % sobrenomes.length]!;
      const s2 = sobrenomes[(n + 3) % sobrenomes.length]!;
      n++;
      const birth = `${p} ${s1} ${s2}`;
      const date = datas[n % datas.length]!;
      const scoreNasc = scoreNascimentoNomeSocial(birth, date);
      const minimo = Math.max(70, scoreNasc + 1);

      for (const perfil of perfis) {
        casos++;
        const res = analisarNomesSocial([], birth, date, perfil);
        const visiveis: AnaliseNomeSocial[] = [...(res.melhorNome ? [res.melhorNome] : []), ...res.top3];

        for (const c of [...visiveis, ...res.nomesCandidatos]) {
          assert.equal(c.temBloqueio, false, `${birth} ${date}: ${c.nomeCompleto} com bloqueio`);
          assert.ok(c.score >= minimo, `${birth} ${date}: ${c.nomeCompleto} (${c.score}) < ${minimo}`);
          assert.notEqual(classificarGrafia(c.nomeCompleto, birth), 'proibida', c.nomeCompleto);
        }

        if (res.nomesCandidatos.length > 0) {
          const maxLista = Math.max(...res.nomesCandidatos.map((c) => c.score));
          const maxVisivel = Math.max(...visiveis.map((c) => c.score));
          assert.equal(maxVisivel, maxLista, `${birth} ${date}: maior nota (${maxLista}) fora das visíveis`);
          assert.ok(res.nomesCandidatos.some((c) => c.maiorNota === true));
        } else {
          assert.equal(res.semOpcoesElegiveis, true);
          assert.equal(res.melhorNome, null);
        }
      }
    }
    assert.ok(casos >= 48);
  });
});
