import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHOICE_MIN,
  SCORE_LIVE,
  NOUL_YES,
  NOUL_NO,
  GUESS_MIN,
  JUDGE_MAX,
} from './thresholds';
import { determineNextStep } from './router';
import { computeRadarAxes } from './radar-axes';
import { MOTOR_RADAR_AXIS_ORDER, MOTOR_RADAR_LABELS } from './motor-radar';
import { applyCorrectionJudge } from './judge';
import { writeHypothesis } from './writer';
import { PARTITURA_PASSOS } from './partitura';

const base = {
  nomeCompleto: 'Maria Silva Santos',
  dataNascimento: '15/08/1990',
};

describe('DEV-235 · Motor Interativo e Partitura (4 Camadas)', () => {
  it('respeita os limiares canônicos de probabilidade e confiança', () => {
    assert.equal(CHOICE_MIN, 0.45);
    assert.equal(SCORE_LIVE, 0.5);
    assert.equal(NOUL_YES, 0.7);
    assert.equal(NOUL_NO, 0.3);
    assert.equal(GUESS_MIN, 0.42);
    assert.equal(JUDGE_MAX, 0.2);
  });

  it('partitura define passos com usaRegraCodigo', () => {
    for (const passo of Object.values(PARTITURA_PASSOS)) {
      assert.equal(passo.usaRegraCodigo, true, `Passo ${passo.id} deve ter usaRegraCodigo = true`);
    }
  });

  it('roteador segue questionário adaptativo até palpite e fim', () => {
    assert.equal(determineNextStep({}).nextStep, 'nome_nascimento');

    let s = determineNextStep(base);
    assert.equal(s.nextStep, 'nome_uso');

    s = determineNextStep({ ...base, nomeUsoDefinido: true });
    assert.equal(s.nextStep, 'sobrenomes_uso');

    s = determineNextStep({ ...base, nomeUsoDefinido: true, sobrenomesDecididos: true });
    assert.equal(s.nextStep, 'relacao_nome');

    s = determineNextStep({
      ...base,
      nomeUsoDefinido: true,
      sobrenomesDecididos: true,
      relacaoNome: 'gosto_muito',
    });
    assert.equal(s.nextStep, 'onde_assina');

    s = determineNextStep({
      ...base,
      nomeUsoDefinido: true,
      sobrenomesDecididos: true,
      relacaoNome: 'gosto_muito',
      ondeAssinaDecidido: true,
      estiloPresencaDecidido: true,
      areaFoco: 'carreira_negocios',
      subfocoDecidido: true,
      aberturaMudanca: 'acento_ou_letra',
    });
    assert.equal(s.nextStep, 'palpite');

    s = determineNextStep({
      ...base,
      nomeUsoDefinido: true,
      sobrenomesDecididos: true,
      relacaoNome: 'gosto_muito',
      ondeAssinaDecidido: true,
      estiloPresencaDecidido: true,
      areaFoco: 'carreira_negocios',
      subfocoDecidido: true,
      aberturaMudanca: 'acento_ou_letra',
      palpiteStatus: 'acertou',
    });
    assert.equal(s.nextStep, 'fim_coleta');
    assert.equal(s.remainingSteps, 0);
  });

  it('radar pentagonal calcula 5 eixos normalizados', () => {
    const axes = computeRadarAxes({
      nomeCompleto: 'Ana Oliveira Lima',
      dataNascimento: '10/05/1988',
      areaFoco: 'prosperidade_financeira',
      subfocoMomento: 'reter_ganhos',
      ondeVaiUsar: ['rotina_trabalho', 'presenca_digital'],
      sobrenomesObrigatorios: ['Lima'],
      estiloPreferido: 'sobrenome_forte',
      notaHoje: 45,
      potencial: 95,
      palpiteStatus: 'acertou',
    });

    assert.equal(axes.length, 5);
    for (let i = 0; i < axes.length; i++) {
      const axis = axes[i];
      assert.equal(axis.key, MOTOR_RADAR_AXIS_ORDER[i]);
      assert.equal(axis.label, MOTOR_RADAR_LABELS[axis.key]);
      assert.ok(axis.value >= 0 && axis.value <= 1);
      assert.ok(
        axis.valuePercent == null ||
          (axis.valuePercent >= 0 && axis.valuePercent <= 100)
      );
    }
  });

  it('juiz de correção reescreve a leitura', () => {
    const judge = applyCorrectionJudge({
      textoCorrecao: 'Quero focar em fechar contratos de consultoria e liderança',
    });
    assert.equal(judge.areaFocoInferida, 'carreira_negocios');
  });

  it('escritor cai em texto determinístico na ausência de OPENAI_API_KEY', async () => {
    const texto = await writeHypothesis({
      nome: 'Maria Silva',
      areaFoco: 'prosperidade_financeira',
      destino: 1,
      notaHoje: 48,
    });
    assert.ok(texto.length > 30);
    assert.equal(/\d/.test(texto), false);
  });
});
