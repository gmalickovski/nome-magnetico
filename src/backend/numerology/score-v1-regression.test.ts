import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcularTodosTriangulos, detectarBloqueios } from './triangle.ts';
import {
  calcularExpressao,
  calcularDestino,
  calcularMotivacao,
} from './numbers.ts';
import {
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  calcularDebitosCarmicos,
} from './karmic.ts';
import { avaliarCompatibilidade } from './harmonization.ts';
import {
  calcularScoreV1,
  calcularScoreV1ComOcorrenciasExtras,
  calcularScoreV1SemOcorrenciasExtras,
} from './score.ts';

/** Referência copiada do main (API / análise grátis): sem ocorrenciasExtras. */
function scoreV1MainRefSemExtras(nome: string, dataPt: string): number {
  const todos = calcularTodosTriangulos(nome, dataPt);
  const bloqueios = detectarBloqueios(todos);
  const expressao = calcularExpressao(nome);
  const destino = calcularDestino(dataPt);
  const motivacao = calcularMotivacao(nome);
  const licoes = detectarLicoesCarmicas(nome);
  const tendencias = detectarTendenciasOcultas(nome);
  const debitos = calcularDebitosCarmicos(dataPt, destino, motivacao, expressao);
  const compatibilidade = avaliarCompatibilidade(expressao, destino);
  return calcularScoreV1({
    bloqueios: bloqueios.length,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos.length,
    debitosCarmicoFixos: debitos.filter(d => d.fixo).length,
    compatibilidade,
  });
}

/** Referência copiada do main (nome-social): com ocorrenciasExtras. */
function scoreV1MainRefComExtras(nome: string, dataPt: string): number {
  const todos = calcularTodosTriangulos(nome, dataPt);
  const bloqueios = detectarBloqueios(todos);
  const expressao = calcularExpressao(nome);
  const destino = calcularDestino(dataPt);
  const motivacao = calcularMotivacao(nome);
  const licoes = detectarLicoesCarmicas(nome);
  const tendencias = detectarTendenciasOcultas(nome);
  const debitos = calcularDebitosCarmicos(dataPt, destino, motivacao, expressao);
  const compatibilidade = avaliarCompatibilidade(expressao, destino);
  const totalOcorrencias = bloqueios.reduce((sum, b) => sum + b.totalOcorrencias, 0);
  const ocorrenciasExtras = Math.max(0, totalOcorrencias - bloqueios.length);
  return calcularScoreV1({
    bloqueios: bloqueios.length,
    ocorrenciasExtras,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos.length,
    debitosCarmicoFixos: debitos.filter(d => d.fixo).length,
    compatibilidade,
  });
}

function scoreBranchSemExtras(nome: string, dataPt: string): number {
  const todos = calcularTodosTriangulos(nome, dataPt);
  const bloqueios = detectarBloqueios(todos);
  const expressao = calcularExpressao(nome);
  const destino = calcularDestino(dataPt);
  const motivacao = calcularMotivacao(nome);
  const licoes = detectarLicoesCarmicas(nome);
  const tendencias = detectarTendenciasOcultas(nome);
  const debitos = calcularDebitosCarmicos(dataPt, destino, motivacao, expressao);
  const compatibilidade = avaliarCompatibilidade(expressao, destino);
  return calcularScoreV1SemOcorrenciasExtras({
    bloqueios,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos,
    compatibilidade,
  });
}

function scoreBranchComExtras(nome: string, dataPt: string): number {
  const todos = calcularTodosTriangulos(nome, dataPt);
  const bloqueios = detectarBloqueios(todos);
  const expressao = calcularExpressao(nome);
  const destino = calcularDestino(dataPt);
  const motivacao = calcularMotivacao(nome);
  const licoes = detectarLicoesCarmicas(nome);
  const tendencias = detectarTendenciasOcultas(nome);
  const debitos = calcularDebitosCarmicos(dataPt, destino, motivacao, expressao);
  const compatibilidade = avaliarCompatibilidade(expressao, destino);
  return calcularScoreV1ComOcorrenciasExtras({
    bloqueios,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos,
    compatibilidade,
  });
}

const CASOS = [
  ['Guilherme Malickovski Correa', '14/02/1990'],
  ['Lucas Henrique Barbosa', '27/04/1991'],
  ['Ana Paula Ferreira Lima', '23/07/1988'],
  ['Juliana Martins Rocha', '18/03/1992'],
  ['Paulo Silva', '16/10/1990'],
] as const;

describe('score v1 · regressão vs main (DEV-185)', () => {
  for (const [nome, data] of CASOS) {
    it(`sem extras · ${nome}`, () => {
      assert.equal(scoreBranchSemExtras(nome, data), scoreV1MainRefSemExtras(nome, data));
    });
    it(`com extras · ${nome}`, () => {
      assert.equal(scoreBranchComExtras(nome, data), scoreV1MainRefComExtras(nome, data));
    });
  }

  it('ocorrenciasExtras reduz o score v1 quando há repetição de bloqueio', () => {
    const nome = 'Juliana Martins Rocha';
    const data = '18/03/1992';
    const sem = scoreBranchSemExtras(nome, data);
    const com = scoreBranchComExtras(nome, data);
    assert.equal(sem, com);
    const fakeBloqueio = {
      codigo: '444',
      titulo: 'x',
      descricao: 'x',
      triangulos: ['vida' as const],
      repeticoesPortriangulo: { vida: 2 },
      totalOcorrencias: 2,
    };
    const semFake = calcularScoreV1SemOcorrenciasExtras({
      bloqueios: [fakeBloqueio],
      licoesCarmicas: 0,
      tendenciasOcultas: 0,
      debitosCarmicos: [],
      compatibilidade: 'favoravel',
    });
    const comFake = calcularScoreV1ComOcorrenciasExtras({
      bloqueios: [fakeBloqueio],
      licoesCarmicas: 0,
      tendenciasOcultas: 0,
      debitosCarmicos: [],
      compatibilidade: 'favoravel',
    });
    assert.equal(semFake, 85);
    assert.equal(comFake, 82);
  });
});
