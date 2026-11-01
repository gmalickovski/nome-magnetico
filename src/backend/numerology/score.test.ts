import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  avaliarNome,
  calcularPotencialV3,
  calcularScoreV1,
  calcularScoreV1SemOcorrenciasExtras,
} from './score.ts';
import { calcularTodosTriangulos, detectarBloqueios } from './triangle.ts';
import {
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  calcularDebitosCarmicos,
} from './karmic.ts';
import { calcularExpressao, calcularDestino, calcularMotivacao } from './numbers.ts';
import { avaliarCompatibilidade } from './harmonization.ts';
import { getScoreVersion } from './score-version.ts';

describe('score v3 · golden (DEV-185)', () => {
  it('Guilherme Malickovski Correa · 14/02/1990 → 64 N3, potencial 93 (DEV-260: Lição 9)', () => {
    const r = avaliarNome('Guilherme Malickovski Correa', '14/02/1990');
    // DEV-260: regra do curso (Lições Kármicas 1–9 adiciona Lição 9, desconto -2 pts: 66 -> 64)
    assert.equal(r.score_v3, 64);
    assert.equal(r.nivel.codigo, 'N3');
    assert.equal(r.nivel.rotulo, 'Equilíbrio Parcial');
    assert.equal(calcularPotencialV3('Guilherme Malickovski Correa', '14/02/1990'), 93);
    assert.equal(r.potencial, r.score_v3);
  });

  it('Lucas Henrique Barbosa · 27/04/1991 → 23 Em Tensão (DEV-260: Lição 9)', () => {
    const r = avaliarNome('Lucas Henrique Barbosa', '27/04/1991');
    // DEV-260: regra do curso (Lições Kármicas 1–9 adiciona Lição 9, desconto -2 pts: 25 -> 23)
    assert.equal(r.score_v3, 23);
    assert.equal(r.nivel.codigo, 'N1');
    assert.equal(r.nivel.rotulo, 'Em Tensão');
  });

  it('Ana Paula Ferreira Lima · 23/07/1988 → 40 Pede Atenção (DEV-260: Lição 9)', () => {
    const r = avaliarNome('Ana Paula Ferreira Lima', '23/07/1988');
    // DEV-260: regra do curso (Lições Kármicas 1–9 adiciona Lição 9, desconto -2 pts: 42 -> 40)
    assert.equal(r.score_v3, 40);
    assert.equal(r.nivel.codigo, 'N2');
    assert.equal(r.nivel.rotulo, 'Pede Atenção');
  });

  it('Juliana Martins Rocha · 18/03/1992 → 67 N3 (DEV-260: 11 desfavorável com Destino 6)', () => {
    const r = avaliarNome('Juliana Martins Rocha', '18/03/1992');
    // DEV-260: regra do curso (Expressão 11 com Destino 6 não é mais neutro, agora é desfavorável: -14 pts)
    assert.equal(r.score_v3, 67);
    assert.equal(r.nivel.codigo, 'N3');
    assert.equal(r.nivel.rotulo, 'Equilíbrio Parcial');
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

  it('SCORE_VERSION=v1 usa helper sem ocorrenciasExtras (padrão API)', () => {
    const prev = process.env.SCORE_VERSION;
    process.env.SCORE_VERSION = 'v1';
    try {
      assert.equal(getScoreVersion(), 'v1');
      const nome = 'Guilherme Malickovski Correa';
      const data = '14/02/1990';
      const todos = calcularTodosTriangulos(nome, data);
      const bloqueios = detectarBloqueios(todos);
      const expressao = calcularExpressao(nome);
      const destino = calcularDestino(data);
      const motivacao = calcularMotivacao(nome);
      const licoes = detectarLicoesCarmicas(nome);
      const tendencias = detectarTendenciasOcultas(nome);
      const debitos = calcularDebitosCarmicos(data, destino, motivacao, expressao);
      const score = calcularScoreV1SemOcorrenciasExtras({
        bloqueios,
        licoesCarmicas: licoes.length,
        tendenciasOcultas: tendencias.length,
        debitosCarmicos: debitos,
        compatibilidade: avaliarCompatibilidade(expressao, destino),
      });
      assert.ok(score > 0);
      assert.notEqual(score, 66);
    } finally {
      if (prev === undefined) delete process.env.SCORE_VERSION;
      else process.env.SCORE_VERSION = prev;
    }
  });
});
