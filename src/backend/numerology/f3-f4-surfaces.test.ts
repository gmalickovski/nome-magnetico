import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarNome, calcularPotencialV3 } from './score.ts';
import {
  SCORE_CONFIG_V3,
  getScoreV3Level,
  getScoreV3LevelBadgeClass,
  getScoreV3LevelDescription,
  formatScoreV3Points,
} from '../../shared/score-v3.ts';
import { AVISO_AUTOCONHECIMENTO } from '../../shared/legal.ts';

describe('DEV-187 (F3ab) & DEV-188 (F4) · Superfícies v3 e Página Como Calculamos', () => {
  it('SCORE_CONFIG_V3 está sincronizado com a especificação canônica do motor v3', () => {
    assert.equal(SCORE_CONFIG_V3.versao, '3.0.0');
    assert.equal(SCORE_CONFIG_V3.piso, 5);
    assert.equal(SCORE_CONFIG_V3.base, 100);
    assert.equal(SCORE_CONFIG_V3.sequenciasVida.pontosPorCodigo, 15);
    assert.equal(SCORE_CONFIG_V3.sequenciasVida.teto, 45);
    assert.equal(SCORE_CONFIG_V3.compatibilidade.descontoTensaoVibracional, 18);
    assert.equal(SCORE_CONFIG_V3.compatibilidade.descontoNeutro, 6);
    assert.equal(SCORE_CONFIG_V3.debitos.descontoPorOrigem, 8);
    assert.equal(SCORE_CONFIG_V3.debitos.teto, 20);
    assert.equal(SCORE_CONFIG_V3.tendenciasOcultas.pontosPorTendencia, 3);
    assert.equal(SCORE_CONFIG_V3.tendenciasOcultas.teto, 9);
    assert.equal(SCORE_CONFIG_V3.licoesCarmicas.pontosPorLicao, 2);
    assert.equal(SCORE_CONFIG_V3.licoesCarmicas.teto, 8);
  });

  it('Níveis v3 (N1 a N5) mapeiam faixas e rótulos corretamente', () => {
    assert.equal(getScoreV3Level(100), 'N5');
    assert.equal(getScoreV3Level(85), 'N5');
    assert.equal(getScoreV3Level(84), 'N4');
    assert.equal(getScoreV3Level(70), 'N4');
    assert.equal(getScoreV3Level(69), 'N3');
    assert.equal(getScoreV3Level(50), 'N3');
    assert.equal(getScoreV3Level(49), 'N2');
    assert.equal(getScoreV3Level(30), 'N2');
    assert.equal(getScoreV3Level(29), 'N1');
    assert.equal(getScoreV3Level(5), 'N1');

    assert.equal(getScoreV3LevelDescription('N5'), 'Harmonioso');
    assert.equal(getScoreV3LevelDescription('N4'), 'Favorável');
    assert.equal(getScoreV3LevelDescription('N3'), 'Equilíbrio Parcial');
    assert.equal(getScoreV3LevelDescription('N2'), 'Pede Atenção');
    assert.equal(getScoreV3LevelDescription('N1'), 'Em Tensão');
  });

  it('Caso de teste de ouro Guilherme Malickovski Correa · 14/02/1990', () => {
    const r = avaliarNome('Guilherme Malickovski Correa', '14/02/1990', { calcularPotencial: true });

    // 1. Score base v3 e nível
    assert.equal(r.score_v3, 66);
    assert.equal(r.nivel.codigo, 'N3');
    assert.equal(r.nivel.rotulo, 'Equilíbrio Parcial');

    // 2. Potencial dinâmico
    assert.equal(r.potencial, 95);
    assert.equal(getScoreV3Level(r.potencial), 'N5');

    // 3. Sequências no Triângulo da Vida: 444 presente
    const seqVida444 = r.descontos.find(d => d.categoria === 'sequencias_vida' && d.codigo === '444');
    assert.ok(seqVida444, 'Deve conter desconto de sequência 444 na Vida');
    assert.equal(seqVida444!.pontos, 15);

    // 4. Marca da sua data: débito 14 do dia natalício presente com desconto 0
    assert.ok(r.marcaDaData, 'Deve conter estrutura marcaDaData');
    const debito14Fixo = r.marcaDaData.find((d: any) => d.numero === 14);
    assert.ok(debito14Fixo, 'Débito 14 deve estar presente na marca da data');
    assert.ok(debito14Fixo!.fontes.includes('dia_natalicio'), 'Fonte deve ser dia_natalicio');

    // 5. Nenhum débito kármico deve ter descontado pontos do nome
    const descontosDebito = r.descontos.filter(d => d.categoria === 'debitos_carmicos');
    assert.equal(descontosDebito.length, 0, 'Débito fixo da data não desconta pontos no score');
  });

  it('Aviso legal de autoconhecimento está presente para compliance F0/F3/F4', () => {
    assert.ok(AVISO_AUTOCONHECIMENTO.length > 50);
    assert.match(AVISO_AUTOCONHECIMENTO, /autoconhecimento/i);
    assert.match(AVISO_AUTOCONHECIMENTO, /m.dica|psicol.gica|jur.dica/i);
  });
});
