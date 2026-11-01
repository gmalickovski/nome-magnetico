import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MOTOR_RADAR_AXIS_ORDER,
  MOTOR_RADAR_LABELS,
  cabalisticNumberToPercent,
  computeMotorRadarAxes,
  computeContextualRadarAxes,
  getRadarAxisLabels,
  harmoniaTrianguloFromReflexos,
  motorRadarToRecord,
} from './motor-radar';

describe('motor-radar · Mapa de Alinhamento Vibracional DEV-264', () => {
  it('ordem dos 5 eixos do mapa de alinhamento', () => {
    assert.deepEqual(MOTOR_RADAR_AXIS_ORDER, [
      'expressao',
      'motivacao',
      'destino',
      'harmonia_triangulo',
      'sequencias',
    ]);
  });

  it('cabalisticNumberToPercent normaliza 1–9 e masters para compatibilidade histórica', () => {
    assert.equal(cabalisticNumberToPercent(9), 100);
    assert.equal(cabalisticNumberToPercent(1), 11);
    assert.equal(cabalisticNumberToPercent(11), 100);
    assert.equal(cabalisticNumberToPercent(22), 100);
  });

  it('harmoniaTrianguloFromReflexos sem reflexos = 100', () => {
    assert.equal(harmoniaTrianguloFromReflexos([]), 100);
  });

  it('computeContextualRadarAxes devolve 5 eixos na escala 0–100 com descrições', () => {
    const axes = computeContextualRadarAxes('Ana Oliveira Lima', '10/05/1988', {
      areaFoco: 'carreira_negocios',
      ondeAssinaRaw: ['contratos_documentos'],
    });
    assert.equal(axes.length, 5);
    for (let i = 0; i < axes.length; i++) {
      assert.equal(axes[i].key, MOTOR_RADAR_AXIS_ORDER[i]);
      assert.ok(axes[i].valuePercent >= 0 && axes[i].valuePercent <= 100);
      assert.ok(axes[i].value >= 0 && axes[i].value <= 1);
      assert.ok(typeof axes[i].description === 'string' && axes[i].description.length > 0);
    }
    // Rótulo dinâmico do foco
    assert.equal(axes[0].label, 'Foco: Carreira');
  });

  it('diferencia o desenho entre nome de nascimento e nome harmonizado', () => {
    const data = '14/02/1990';
    const context = { areaFoco: 'carreira_negocios', ondeAssinaRaw: ['contratos_documentos'] };

    const nascAxes = computeContextualRadarAxes('Guilherme Malickovski Correa', data, context);
    const harmAxes = computeContextualRadarAxes('Guilherme Málickovski', data, context);

    const nascFoco = nascAxes.find((a) => a.key === 'expressao')!;
    const harmFoco = harmAxes.find((a) => a.key === 'expressao')!;

    const nascFluidez = nascAxes.find((a) => a.key === 'sequencias')!;
    const harmFluidez = harmAxes.find((a) => a.key === 'sequencias')!;

    // No nascimento com 4 bloqueios, a fluidez e o foco caem significativamente
    assert.ok(nascFluidez.valuePercent < 55, `Fluidez de nascimento esperada < 55, obtido: ${nascFluidez.valuePercent}`);
    assert.ok(harmFluidez.valuePercent === 100, `Fluidez harmonizada esperada 100, obtido: ${harmFluidez.valuePercent}`);

    // No harmonizado, o foco em carreira sobe
    assert.ok(harmFoco.valuePercent > nascFoco.valuePercent, 'Foco harmonizado deve ser superior ao nascimento');
    assert.ok(harmFoco.valuePercent >= 85, `Foco harmonizado esperado >= 85, obtido: ${harmFoco.valuePercent}`);
  });

  it('sugestões candidatas diferentes geram formatos de polígono distintos', () => {
    const data = '14/02/1990';
    const context = { areaFoco: 'carreira_negocios' };

    const sug1 = computeContextualRadarAxes('Guilherme Málickovski', data, context);
    const sug2 = computeContextualRadarAxes('Guilherme', data, context);

    const rec1 = motorRadarToRecord(sug1);
    const rec2 = motorRadarToRecord(sug2);

    // Devem ter valores diferentes em ao menos 2 eixos
    const difKeys = MOTOR_RADAR_AXIS_ORDER.filter((k) => Math.abs(rec1[k] - rec2[k]) > 0.03);
    assert.ok(difKeys.length >= 2, `Esperado formatos distintos em ao menos 2 eixos, eixos diferentes: ${difKeys.join(', ')}`);
  });

  it('mudar a área de foco altera o rótulo e o cálculo do eixo principal', () => {
    const data = '14/02/1990';
    const nome = 'Guilherme Málickovski';

    const carreira = computeContextualRadarAxes(nome, data, { areaFoco: 'carreira_negocios' });
    const relacoes = computeContextualRadarAxes(nome, data, { areaFoco: 'relacionamentos_harmonia' });

    assert.equal(carreira[0].label, 'Foco: Carreira');
    assert.equal(relacoes[0].label, 'Foco: Relações');

    const labelsCarreira = getRadarAxisLabels('carreira_negocios');
    assert.equal(labelsCarreira.expressao, 'Foco: Carreira');
    assert.equal(labelsCarreira.motivacao, 'Equilíbrio da Alma');
    assert.equal(labelsCarreira.destino, 'Sintonia de Destino');
    assert.equal(labelsCarreira.harmonia_triangulo, 'Magnetismo Social');
    assert.equal(labelsCarreira.sequencias, 'Fluidez');
  });

  it('motorRadarToRecord preserva keys para ReadingRadar', () => {
    const axes = computeMotorRadarAxes('Maria Silva Santos', '15/08/1990');
    const rec = motorRadarToRecord(axes);
    for (const key of MOTOR_RADAR_AXIS_ORDER) {
      assert.ok(typeof rec[key] === 'number');
      assert.ok(rec[key] >= 0 && rec[key] <= 1);
    }
  });
});
