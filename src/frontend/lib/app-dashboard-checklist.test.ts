import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHECKLIST_ITEMS,
  checklistSlideStorageKey,
  countChecklistDone,
  getVibrationActivationInfo,
  parseChecklistState,
} from './app-dashboard-checklist';

describe('app-dashboard-checklist', () => {
  it('expõe os 6 passos na ordem exata com descrição de CIN, CNH e Cartório', () => {
    assert.equal(CHECKLIST_ITEMS.length, 6);
    assert.deepEqual(
      CHECKLIST_ITEMS.map((i) => i.key),
      [
        'pdf',
        'treino_assinatura',
        'registro_identidade',
        'redes_email',
        'cartao_visita',
        'primeiro_documento',
      ],
    );
    const idStep = CHECKLIST_ITEMS.find((i) => i.key === 'registro_identidade');
    assert.ok(idStep);
    assert.match(idStep.description, /CIN/);
    assert.match(idStep.description, /CNH/);
    assert.match(idStep.description, /Cartório/);
  });

  it('parseChecklistState devolve padrão para JSON inválido e migra chaves legadas', () => {
    assert.equal(parseChecklistState(null).pdf, false);
    assert.equal(parseChecklistState('{invalid').treino_assinatura, false);

    const migrated = parseChecklistState(JSON.stringify({ tracado: true, redes: true }));
    assert.equal(migrated.treino_assinatura, true);
    assert.equal(migrated.redes_email, true);
    assert.equal(migrated.pdf, false);
  });

  it('countChecklistDone e getVibrationActivationInfo calculam percentual e níveis de vibração', () => {
    const state = parseChecklistState(
      JSON.stringify({ pdf: true, treino_assinatura: true, redes_email: true }),
    );
    assert.equal(countChecklistDone(state), 3);

    assert.equal(getVibrationActivationInfo(0).percentage, 0);
    assert.equal(getVibrationActivationInfo(0).levelName, 'Potencial Latente');
    assert.equal(getVibrationActivationInfo(3).percentage, 50);
    assert.equal(getVibrationActivationInfo(3).levelName, 'Ressonância em Expansão');
    assert.equal(getVibrationActivationInfo(6).percentage, 100);
    assert.equal(getVibrationActivationInfo(6).levelName, 'Plena Sintonia Magnética');
  });

  it('gera chave de storage isolada por usuário e card/slide', () => {
    assert.equal(
      checklistSlideStorageKey('user-1', 'analysis-2'),
      'nm-dashboard-checklist:v2:user-1:analysis-2',
    );
  });
});
