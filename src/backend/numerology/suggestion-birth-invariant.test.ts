import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  passaGanhoMinimo,
  filtrarCandidatosElegiveis,
  dedupeCandidatosEstavel,
  ordenarPorNotaDescEstavel,
  compararPorNotaDescEstavel,
} from './suggestion-birth-invariant.ts';
import {
  analisarNomesSocial,
  scoreNascimentoNomeSocial,
} from './products/nome-social.ts';
import {
  calibrarDistribuicaoGanhoSobreNascimento,
  formatarTabelaCalibracaoGanho,
} from './suggestion-birth-calibration.ts';
import { validarPedidoGerarMais } from '../../shared/nome-social/gerar-mais-limits.ts';

describe('DEV-275 · invariante nota > nascimento', () => {
  let prevGain: string | undefined;
  let prevVersion: string | undefined;

  before(() => {
    prevGain = process.env.NOME_SOCIAL_GANHO_MINIMO_PONTOS;
    prevVersion = process.env.SCORE_VERSION;
    process.env.SCORE_VERSION = 'v3';
    process.env.NOME_SOCIAL_GANHO_MINIMO_PONTOS = '0';
  });

  after(() => {
    if (prevGain === undefined) delete process.env.NOME_SOCIAL_GANHO_MINIMO_PONTOS;
    else process.env.NOME_SOCIAL_GANHO_MINIMO_PONTOS = prevGain;
    if (prevVersion === undefined) delete process.env.SCORE_VERSION;
    else process.env.SCORE_VERSION = prevVersion;
  });

  it('rejeita 64→64 e 64→63; aceita 64→65', () => {
    assert.equal(passaGanhoMinimo(64, 64, 0), false);
    assert.equal(passaGanhoMinimo(63, 64, 0), false);
    assert.equal(passaGanhoMinimo(65, 64, 0), true);
  });

  it('filtra lista do motor sem notas ≤ nascimento', () => {
    const birth = 'Maria Silva Santos';
    const date = '01/01/1990';
    const scoreNasc = scoreNascimentoNomeSocial(birth, date);
    const res = analisarNomesSocial([], birth, date);
    for (const c of [
      ...(res.melhorNome ? [res.melhorNome] : []),
      ...res.top3,
      ...res.nomesCandidatos,
    ]) {
      assert.ok(c.score > scoreNasc, `${c.nomeCompleto} (${c.score}) deveria superar ${scoreNasc}`);
    }
  });

  it('somenteCandidatosInformados filtra mas preserva ordem', () => {
    const birth = 'Maria Silva Santos';
    const date = '01/01/1990';
    const scoreNasc = scoreNascimentoNomeSocial(birth, date);
    const ordem = ['Ana Vale Silva', 'Ana V. Silva', 'Ana Silva Vale'];
    const res = analisarNomesSocial(ordem, birth, date, {
      somenteCandidatosInformados: true,
    });
    assert.deepEqual(
      res.nomesCandidatos.map((c) => c.nomeCompleto),
      ordem.filter((nome) => {
        const score = res.nomesCandidatos.find((c) => c.nomeCompleto === nome)?.score;
        return score != null && score > scoreNasc;
      }),
    );
  });

  it('preferência pode ficar abaixo da máxima mas acima da base', () => {
    const birth = 'Guilherme Malickovski Correa';
    const date = '14/02/1990';
    const res = analisarNomesSocial([], birth, date, { estiloPreferido: 'ajuste_sutil' });
    const scoreNasc = res.scoreNascimento ?? scoreNascimentoNomeSocial(birth, date);
  const scores = res.nomesCandidatos.map((c) => c.score);
    const maxScore = scores.length ? Math.max(...scores) : 0;
    if (res.melhorNome && maxScore > res.melhorNome.score) {
      assert.ok(res.melhorNome.score > scoreNasc);
    }
  });

  it('desempate estável e sem duplicatas na ordenação', () => {
    const lista = dedupeCandidatosEstavel([
      { nomeCompleto: 'Ana B', score: 80 },
      { nomeCompleto: 'Ana A', score: 80 },
      { nomeCompleto: 'Ana A', score: 80 },
    ]);
    assert.equal(lista.length, 2);
    const ordenada = ordenarPorNotaDescEstavel(lista);
    assert.equal(ordenada[0]!.nomeCompleto, 'Ana A');
    assert.equal(compararPorNotaDescEstavel(ordenada[0]!, ordenada[1]!), -1);
  });

  it('calibração sintética gera tabela de limiares 0/1/2/3/5', () => {
    const linhas = calibrarDistribuicaoGanhoSobreNascimento();
    assert.equal(linhas.length, 5);
    const tabela = formatarTabelaCalibracaoGanho(linhas);
    assert.match(tabela, /\| 0 \|/);
    assert.match(tabela, /\| 5 \|/);
  });

  it('teto de 9 do gerar mais na validação compartilhada', () => {
    assert.equal(validarPedidoGerarMais(9).ok, false);
  });

  it('filtra elegíveis com ganho mínimo configurável', () => {
    const elegiveis = filtrarCandidatosElegiveis(
      [
        { nomeCompleto: 'A', score: 66 },
        { nomeCompleto: 'B', score: 67 },
        { nomeCompleto: 'C', score: 78 },
      ],
      66,
      1,
    );
    assert.deepEqual(
      elegiveis.map((e) => e.nomeCompleto),
      ['C'],
    );
  });
});
