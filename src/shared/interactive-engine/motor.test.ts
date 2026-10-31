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
import { applyCorrectionJudge } from './judge';
import { writeHypothesis } from './writer';
import { PARTITURA_PASSOS } from './partitura';

describe('DEV-235 · Motor Interativo e Partitura (4 Camadas)', () => {
  it('respeita os limiares canônicos de probabilidade e confiança', () => {
    assert.equal(CHOICE_MIN, 0.45);
    assert.equal(SCORE_LIVE, 0.5);
    assert.equal(NOUL_YES, 0.7);
    assert.equal(NOUL_NO, 0.3);
    assert.equal(GUESS_MIN, 0.42);
    assert.equal(JUDGE_MAX, 0.2);

    // Validação de borda
    const prob1 = 0.45;
    const prob2 = 0.46;
    assert.equal(prob1 > CHOICE_MIN, false);
    assert.equal(prob2 > CHOICE_MIN, true);

    const confPalpite1 = 0.42;
    const confPalpite2 = 0.43;
    assert.equal(confPalpite1 > GUESS_MIN, false);
    assert.equal(confPalpite2 > GUESS_MIN, true);

    const confJuiz1 = 0.19;
    const confJuiz2 = 0.20;
    assert.equal(confJuiz1 < JUDGE_MAX, true);
    assert.equal(confJuiz2 < JUDGE_MAX, false);
  });

  it('partitura define todas as 10 etapas e garante que o roteamento é sempre em código', () => {
    const passos = Object.keys(PARTITURA_PASSOS);
    assert.equal(passos.length, 10);
    for (const passo of Object.values(PARTITURA_PASSOS)) {
      assert.equal(passo.usaRegraCodigo, true, `Passo ${passo.id} deve ter usaRegraCodigo = true`);
    }
  });

  it('roteador decide os passos determinísticos na ordem correta', () => {
    // 1. Sem nome
    const s1 = determineNextStep({});
    assert.equal(s1.nextStep, 'nome_nascimento');
    assert.equal(s1.remainingSteps, 6);

    // 2. Com nome, sem sobrenomes confirmados
    const s2 = determineNextStep({ nomeCompleto: 'Maria Silva Santos', dataNascimento: '15/08/1990' });
    assert.equal(s2.nextStep, 'sobrenomes');
    assert.equal(s2.remainingSteps, 5);

    // 3. Com sobrenomes, sem onde vai usar
    const s3 = determineNextStep({
      nomeCompleto: 'Maria Silva Santos',
      dataNascimento: '15/08/1990',
      sobrenomesDecididos: true,
    });
    assert.equal(s3.nextStep, 'onde_vai_usar');
    assert.equal(s3.remainingSteps, 4);

    // 4. Com canais, sem área de foco
    const s4 = determineNextStep({
      nomeCompleto: 'Maria Silva Santos',
      dataNascimento: '15/08/1990',
      sobrenomesDecididos: true,
      ondeVaiUsar: ['profissional'],
    });
    assert.equal(s4.nextStep, 'foco_momento');
    assert.equal(s4.remainingSteps, 3);

    // 5. Com foco, sem palpite
    const s5 = determineNextStep({
      nomeCompleto: 'Maria Silva Santos',
      dataNascimento: '15/08/1990',
      sobrenomesDecididos: true,
      ondeVaiUsar: ['profissional'],
      areaFoco: 'carreira_negocios',
    });
    assert.equal(s5.nextStep, 'palpite');
    assert.equal(s5.remainingSteps, 2);

    // 6. Com palpite, sem estilo preferido
    const s6 = determineNextStep({
      nomeCompleto: 'Maria Silva Santos',
      dataNascimento: '15/08/1990',
      sobrenomesDecididos: true,
      ondeVaiUsar: ['profissional'],
      areaFoco: 'carreira_negocios',
      palpiteStatus: 'acertou',
    });
    assert.equal(s6.nextStep, 'formato_preferido');
    assert.equal(s6.remainingSteps, 1);

    // 7. Tudo completo
    const s7 = determineNextStep({
      nomeCompleto: 'Maria Silva Santos',
      dataNascimento: '15/08/1990',
      sobrenomesDecididos: true,
      ondeVaiUsar: ['profissional'],
      areaFoco: 'carreira_negocios',
      palpiteStatus: 'acertou',
      estiloPreferido: 'sobrenome_forte',
    });
    assert.equal(s7.nextStep, 'fim_coleta');
    assert.equal(s7.remainingSteps, 0);
  });

  it('radar pentagonal calcula sempre os 5 eixos normalizados (0..1) na ordem correta', () => {
    const axes = computeRadarAxes({
      nomeCompleto: 'Ana Oliveira Lima',
      dataNascimento: '10/05/1988',
      areaFoco: 'prosperidade_financeira',
      subfocoMomento: 'reter_ganhos',
      ondeVaiUsar: ['profissional', 'redes_sociais'],
      sobrenomesObrigatorios: ['Lima'],
      estiloPreferido: 'sobrenome_forte',
      notaHoje: 45,
      potencial: 95,
      palpiteStatus: 'acertou',
    });

    assert.equal(axes.length, 5);
    const keys = axes.map(a => a.key);
    assert.deepEqual(keys, ['momento', 'objetivo', 'uso', 'apego_sobrenome', 'urgencia']);

    for (const axis of axes) {
      assert.ok(axis.value >= 0 && axis.value <= 1, `Eixo ${axis.key} deve estar entre 0 e 1, recebido: ${axis.value}`);
      assert.ok(axis.label.length > 0);
    }
  });

  it('juiz de correção reescreve a leitura e resumo ao receber texto do usuário', () => {
    const judge = applyCorrectionJudge({
      textoCorrecao: 'Quero focar em fechar contratos de consultoria e liderança',
      destino: 8,
      notaHoje: 48,
      potencial: 98,
    });

    assert.equal(judge.areaFocoInferida, 'carreira_negocios');
    assert.ok(judge.leituraAjustada.includes('fechar contratos de consultoria'));
    assert.ok(judge.linhaResumoFoco.includes('Prioridade personalizada'));
  });

  it('escritor cai em texto determinístico na ausência de OPENAI_API_KEY', async () => {
    const texto = await writeHypothesis({
      nome: 'Maria Silva',
      areaFoco: 'prosperidade_financeira',
      destino: 1,
      notaHoje: 48,
    });

    assert.ok(texto.length > 30);
    assert.ok(texto.includes('Destino é 1'));
    // Sem travessões (DEV-183)
    assert.equal(/[—–]/.test(texto), false);
  });
});
