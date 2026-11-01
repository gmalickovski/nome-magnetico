import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MOTOR_RADAR_AXIS_ORDER,
  MOTOR_RADAR_LABELS,
  cabalisticNumberToPercent,
  computeMotorRadarAxes,
  harmoniaTrianguloFromReflexos,
  motorRadarToRecord,
} from './motor-radar';

describe('motor-radar · eixos do score v3', () => {
  it('ordem e rótulos dos 5 eixos do motor', () => {
    assert.deepEqual(MOTOR_RADAR_AXIS_ORDER, [
      'expressao',
      'motivacao',
      'destino',
      'harmonia_triangulo',
      'sequencias',
    ]);
    assert.equal(MOTOR_RADAR_LABELS.expressao, 'Expressão');
    assert.equal(MOTOR_RADAR_LABELS.motivacao, 'Motivação');
    assert.equal(MOTOR_RADAR_LABELS.destino, 'Destino');
    assert.equal(MOTOR_RADAR_LABELS.harmonia_triangulo, 'Harmonia do Triângulo');
    assert.equal(MOTOR_RADAR_LABELS.sequencias, 'Sequências');
  });

  it('cabalisticNumberToPercent normaliza 1–9 e masters', () => {
    assert.equal(cabalisticNumberToPercent(9), 100);
    assert.equal(cabalisticNumberToPercent(1), 11);
    assert.equal(cabalisticNumberToPercent(11), 100);
    assert.equal(cabalisticNumberToPercent(22), 100);
  });

  it('harmoniaTrianguloFromReflexos sem reflexos = 100', () => {
    assert.equal(harmoniaTrianguloFromReflexos([]), 100);
  });

  it('computeMotorRadarAxes devolve 5 valores 0–100 alinhados ao SVG', () => {
    const axes = computeMotorRadarAxes('Ana Oliveira Lima', '10/05/1988');
    assert.equal(axes.length, 5);
    for (let i = 0; i < axes.length; i++) {
      assert.equal(axes[i].key, MOTOR_RADAR_AXIS_ORDER[i]);
      assert.equal(axes[i].label, MOTOR_RADAR_LABELS[axes[i].key]);
      assert.ok(axes[i].valuePercent >= 0 && axes[i].valuePercent <= 100);
      assert.ok(Math.abs(axes[i].value - axes[i].valuePercent / 100) < 0.001);
    }
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
