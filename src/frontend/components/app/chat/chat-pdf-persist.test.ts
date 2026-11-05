import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_COLLECT_STATE } from './decide-live-bridge.ts';
import { buildChatPdfAnalyzePayload } from './chat-pdf-persist.ts';

describe('buildChatPdfAnalyzePayload', () => {
  it('marca nome escolhido e envia nome social principal', () => {
    const sug = {
      id: '1',
      nome: 'Guilherme Málickovski',
      score: 80,
      expressao: 1,
      compatibilidade: 'neutro',
      bloqueiosEliminados: 0,
      bloqueiosRestantes: 0,
      arcanosPositivos: 0,
      dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
      panel: {
        nome: 'Guilherme Málickovski',
        score: 80,
        expressao: 1,
        destino: 1,
        motivacao: 1,
        missao: 1,
        impressao: 1,
        potencial: 90,
        bloqueiosCount: 0,
        bloqueios: [],
        trianguloVida: { topo: 1, base: [1] },
      },
    };
    const body = buildChatPdfAnalyzePayload({
      birthName: 'Maria Silva',
      birthDate: '01/01/1990',
      selectedSocialName: 'Guilherme Málickovski',
      collect: INITIAL_COLLECT_STATE,
      suggestions: [sug, { ...sug, id: '2', nome: 'Gui Málickovski' }],
    });
    assert.equal(body.product_type, 'nome_social');
    assert.equal(body.nome_completo, 'Maria Silva');
    assert.equal(body.nome_social_principal, 'Guilherme Málickovski');
    assert.equal(body.nome_ja_escolhido, true);
    assert.equal(body.ranking_somente_chat, true);
    assert.deepEqual(body.nomes_candidatos, [
      'Guilherme Málickovski',
      'Gui Málickovski',
    ]);
    assert.equal(body.ranking_vazio_sem_autogeracao, false);
  });

  it('histórico vazio marca contrato sem autogeração', () => {
    const body = buildChatPdfAnalyzePayload({
      birthName: 'Maria Silva',
      birthDate: '01/01/1990',
      selectedSocialName: 'Guilherme Málickovski',
      collect: INITIAL_COLLECT_STATE,
      suggestions: [],
    });
    assert.equal(body.ranking_somente_chat, true);
    assert.equal(body.ranking_vazio_sem_autogeracao, true);
    assert.equal(body.nomes_candidatos, undefined);
  });
});
