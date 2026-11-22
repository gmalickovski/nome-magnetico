import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planBackNavigation, getPreviousFlowStep } from './chat-dock-step-back.ts';
import type { ChatMessage } from './chat-types.ts';

/** DEV-324 · voltar uma pergunta sem recomeçar. Sem React e sem rede. */

const q = (stepId: string, type: ChatMessage['type'] = 'questionnaire'): ChatMessage => ({
  id: `q-${stepId}`, sender: 'assistant', type, content: stepId, stepId,
});
const u = (stepId: string): ChatMessage => ({ id: `u-${stepId}`, sender: 'user', type: 'text', content: 'x', stepId });
const bloco = (id: string): ChatMessage => ({ id: `block-${id}`, sender: 'assistant', type: 'text', content: id });

const conversa: ChatMessage[] = [
  { id: 'onb', sender: 'assistant', type: 'text', content: 'confirmação', stepId: 'onboarding_confirm' },
  u('onboarding_confirm'),
  q('motivo_harmonizacao'), u('motivo_harmonizacao'),
  q('nome_uso'), u('nome_uso'),
  q('sobrenomes_uso'), u('sobrenomes_uso'),
  bloco('b1'),
  q('area_artistica'),
];

describe('DEV-324 · plano de voltar', () => {
  it('corta até a pergunta de destino, que volta a ser a última', () => {
    const plano = planBackNavigation(conversa, 'sobrenomes_uso')!;
    assert.equal(plano.kept.at(-1)!.stepId, 'sobrenomes_uso');
    assert.equal(plano.kept.at(-1)!.sender, 'assistant');
    // a resposta de sobrenomes e o que veio depois saem
    assert.ok(!plano.kept.some((m) => m.id === 'u-sobrenomes_uso'));
    assert.ok(!plano.kept.some((m) => m.id === 'block-b1'));
  });

  it('conta as respostas desfeitas para devolver ao contador de passos', () => {
    assert.equal(planBackNavigation(conversa, 'sobrenomes_uso')!.removedAnswers, 1);
    assert.equal(planBackNavigation(conversa, 'motivo_harmonizacao')!.removedAnswers, 3);
  });

  it('não conta respostas da certidão (onboarding) nem apaga o que veio antes do destino', () => {
    const plano = planBackNavigation(conversa, 'motivo_harmonizacao')!;
    assert.ok(plano.kept.some((m) => m.id === 'u-onboarding_confirm'));
    assert.equal(plano.removedAnswers, 3);
  });

  it('as chaves desfeitas incluem o destino, os seguintes e o fim da coleta', () => {
    const { undoneStepIds } = planBackNavigation(conversa, 'nome_uso')!;
    for (const k of ['nome_uso', 'sobrenomes_uso', 'area_artistica', 'palpite', 'fim_coleta']) assert.ok(undoneStepIds.has(k), k);
    assert.ok(!undoneStepIds.has('motivo_harmonizacao'));
  });

  it('sem o cartão de pergunta do destino, não faz nada', () => {
    assert.equal(planBackNavigation(conversa, 'imagem_artistica'), null);
    const semCartao = conversa.map((m) => (m.stepId === 'nome_uso' && m.sender === 'assistant' ? { ...m, type: 'text' as const } : m));
    assert.equal(planBackNavigation(semCartao, 'nome_uso'), null);
  });

  it('o palpite só volta quando ainda é o cartão de resposta', () => {
    const comPalpite = [...conversa, u('area_artistica'), q('palpite', 'guess'), u('palpite')];
    const plano = planBackNavigation(comPalpite, 'palpite')!;
    assert.equal(plano.kept.at(-1)!.type, 'guess');
    assert.equal(plano.removedAnswers, 1);
    const virouTexto = comPalpite.map((m) => (m.stepId === 'palpite' && m.sender === 'assistant' ? { ...m, type: 'text_input' as const } : m));
    assert.equal(planBackNavigation(virouTexto, 'palpite'), null);
  });

  it('o destino vem da lógica de passo anterior (ramo artístico e fim da coleta)', () => {
    const state = { relacaoNome: null, aberturaMudanca: null, ondeAssinaRaw: ['arte_criativo'], fluxoMotivoAtivo: true, motivoHarmonizacao: 'artistico', areaArtistica: 'cantor' };
    assert.equal(getPreviousFlowStep('area_artistica', state), 'sobrenomes_uso');
    assert.equal(getPreviousFlowStep('fim_coleta', state), 'palpite');
    assert.equal(getPreviousFlowStep('motivo_harmonizacao', state), null);
  });
});
