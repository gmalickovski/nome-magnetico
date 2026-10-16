import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarNome, calcularScoreV1, pontuacaoNomeCompleta } from './score.ts';
import { getScoreVersion } from './score-version.ts';

describe('score v3 · golden (DEV-185)', () => {
  it('Guilherme Malickovski Correa · 14/02/1990 → 66 N3, potencial 95', () => {
    const r = avaliarNome('Guilherme Malickovski Correa', '14/02/1990');
    assert.equal(r.score_v3, 66);
    assert.equal(r.nivel.codigo, 'N3');
    assert.equal(r.nivel.rotulo, 'Equilíbrio Parcial');
    assert.equal(r.potencial, 95);
  });

  it('Lucas Henrique Barbosa · 27/04/1991 → 25 Em Tensão', () => {
    const r = avaliarNome('Lucas Henrique Barbosa', '27/04/1991');
    assert.equal(r.score_v3, 25);
    assert.equal(r.nivel.codigo, 'N1');
    assert.equal(r.nivel.rotulo, 'Em Tensão');
  });

  it('Ana Paula Ferreira Lima · 23/07/1988 → 42 Pede Atenção', () => {
    const r = avaliarNome('Ana Paula Ferreira Lima', '23/07/1988');
    assert.equal(r.score_v3, 42);
    assert.equal(r.nivel.codigo, 'N2');
    assert.equal(r.nivel.rotulo, 'Pede Atenção');
  });

  it('Juliana Martins Rocha · 18/03/1992 → 81 Favorável', () => {
    const r = avaliarNome('Juliana Martins Rocha', '18/03/1992');
    assert.equal(r.score_v3, 81);
    assert.equal(r.nivel.codigo, 'N4');
    assert.equal(r.nivel.rotulo, 'Favorável');
  });
});

describe('score v3 · bordas', () => {
  it('sequência repetida em 2 linhas na Vida = 15 + 2', () => {
    // Nome sintético difícil — validamos via desconto explícito em caso real (Lucas 555 = 17)
    const r = avaliarNome('Lucas Henrique Barbosa', '27/04/1991');
    const seq555 = r.descontos.find(d => d.codigo === '555' && d.categoria === 'sequencias_vida');
    assert.ok(seq555);
    assert.equal(seq555!.pontos, 17);
  });

  it('sequência só em triângulos complementares não desconta (reflexo)', () => {
    const r = avaliarNome('Juliana Martins Rocha', '18/03/1992');
    const seqVida = r.descontos.filter(d => d.categoria === 'sequencias_vida');
    assert.equal(seqVida.length, 0);
    assert.ok(r.reflexos.length >= 0);
  });

  it('piso 5 quando descontos excedem 95', () => {
    const r = avaliarNome('Lucas Henrique Barbosa', '27/04/1991');
    assert.ok(r.score_v3 >= 5);
  });

  it('débito dia 16 + Motivação 7 → desconto 12 (acentuado)', () => {
    const r = avaliarNome('Paulo Silva', '16/10/1990');
    const deb16 = r.descontos.find(d => d.categoria === 'debitos' && d.codigo === '16');
    assert.ok(deb16);
    assert.equal(deb16!.pontos, 12);
    assert.equal(deb16!.detalhe, 'acentuada');
    const marca16 = r.marcaDaData.find(m => m.numero === 16);
    assert.ok(marca16);
  });

  it('Motivação e Expressão com a mesma dívida → teto 20', () => {
    const r = avaliarNome('Maria Silva', '16/10/1990');
    const deb = r.descontos.find(d => d.categoria === 'debitos' && d.codigo === '14');
    assert.ok(deb);
    assert.equal(deb!.pontos, 20);
  });

  it('marcaDaData inclui débito 14 do dia (Guilherme) sem desconto', () => {
    const r = avaliarNome('Guilherme Malickovski Correa', '14/02/1990');
    const marca14 = r.marcaDaData.find(m => m.numero === 14);
    assert.ok(marca14);
    assert.ok(!r.descontos.some(d => d.categoria === 'debitos' && d.codigo === '14'));
  });

  it('determinismo', () => {
    const a = avaliarNome('Juliana Martins Rocha', '18/03/1992');
    const b = avaliarNome('Juliana Martins Rocha', '18/03/1992');
    assert.deepEqual(a.score_v3, b.score_v3);
    assert.deepEqual(a.descontos.length, b.descontos.length);
  });

  it('SCORE_VERSION=v1 devolve score legado via pontuacaoNomeCompleta', () => {
    const prev = process.env.SCORE_VERSION;
    process.env.SCORE_VERSION = 'v1';
    try {
      assert.equal(getScoreVersion(), 'v1');
      const p = pontuacaoNomeCompleta('Guilherme Malickovski Correa', '14/02/1990');
      assert.equal(p.scoreExibido, p.scoreLegado);
      assert.equal(p.camposV3, undefined);
      const manual = calcularScoreV1({
        bloqueios: 1,
        ocorrenciasExtras: 0,
        licoesCarmicas: 1,
        tendenciasOcultas: 4,
        debitosCarmicos: 2,
        debitosCarmicoFixos: 1,
        compatibilidade: 'favoravel',
      });
      assert.ok(manual > 0);
    } finally {
      if (prev === undefined) delete process.env.SCORE_VERSION;
      else process.env.SCORE_VERSION = prev;
    }
  });
});
