import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MOTIVO_HARMONIZACAO_OPTIONS } from '../../../../shared/interactive-engine/questionnaire-adaptive.js';
import { resolveInitialChatPath } from './initial-chat-path.js';

describe('DEV-339 · initial-chat-path (?caminho=)', () => {
  it('resolve diretamente dia_a_dia, artistico e bebe nas opções reais', () => {
    const social = resolveInitialChatPath('dia_a_dia', MOTIVO_HARMONIZACAO_OPTIONS);
    const artistico = resolveInitialChatPath('artistico', MOTIVO_HARMONIZACAO_OPTIONS);
    const bebe = resolveInitialChatPath('bebe', MOTIVO_HARMONIZACAO_OPTIONS);

    assert.equal(social?.id, 'dia_a_dia');
    assert.equal(artistico?.id, 'artistico');
    assert.equal(bebe?.id, 'bebe');
  });

  it('normaliza aliases, espaços e caixa e ignora valores inválidos', () => {
    assert.equal(resolveInitialChatPath(' Social ', MOTIVO_HARMONIZACAO_OPTIONS)?.id, 'dia_a_dia');
    assert.equal(resolveInitialChatPath('ARTISTICO', MOTIVO_HARMONIZACAO_OPTIONS)?.id, 'artistico');
    assert.equal(resolveInitialChatPath('', MOTIVO_HARMONIZACAO_OPTIONS), null);
    assert.equal(resolveInitialChatPath(undefined, MOTIVO_HARMONIZACAO_OPTIONS), null);
    assert.equal(resolveInitialChatPath('invalido', MOTIVO_HARMONIZACAO_OPTIONS), null);
  });
});
