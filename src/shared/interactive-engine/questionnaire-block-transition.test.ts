import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectShownBlockTransitions,
  resolveBlockTransition,
  type BlockTransitionId,
} from './questionnaire-adaptive.ts';

describe('resolveBlockTransition', () => {
  it('não repete eco Anotado — só transição após bloco do nome', () => {
    const shown = new Set<BlockTransitionId>();
    const t = resolveBlockTransition('relacao_nome', 'onde_assina', 'Maria Silva', shown);
    assert.ok(t);
    assert.match(t!.text, /Perfeito, Maria\./);
    assert.doesNotMatch(t!.text, /Anotado/i);
    shown.add(t!.id);
    assert.equal(resolveBlockTransition('relacao_nome', 'onde_assina', 'Maria', shown), null);
  });

  it('não ecoa em passos intermediários', () => {
    const shown = new Set<BlockTransitionId>();
    assert.equal(
      resolveBlockTransition('onde_assina', 'estilo_presenca', 'João', shown),
      null
    );
    assert.equal(
      resolveBlockTransition('nome_uso', 'sobrenomes_uso', 'Ana', shown),
      null
    );
  });

  it('transição antes de area_foco', () => {
    const shown = new Set<BlockTransitionId>();
    const t = resolveBlockTransition('estilo_presenca', 'area_foco', 'Lu', shown);
    assert.ok(t);
    assert.match(t!.text, /Com isso já sei como você se apresenta/);
  });

  it('transição antes das sugestões (fim_coleta)', () => {
    const shown = new Set<BlockTransitionId>();
    const t = resolveBlockTransition('palpite', 'fim_coleta', 'Pedro', shown);
    assert.ok(t);
    assert.match(t!.text, /Cruzei suas respostas/);
  });
});

describe('detectShownBlockTransitions', () => {
  it('reconstrói transições a partir das mensagens', () => {
    const shown = detectShownBlockTransitions([
      { content: 'Perfeito, Ana. Agora quero entender onde a sua assinatura aparece.' },
      { content: 'Pronto. Cruzei suas respostas com o seu mapa e separei as assinaturas que mais combinam com você.' },
    ]);
    assert.equal(shown.has('after_nome_block'), true);
    assert.equal(shown.has('before_suggestions'), true);
    assert.equal(shown.has('before_area_foco'), false);
  });
});
