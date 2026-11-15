import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Analysis } from '../db/analyses';
import { buildSavedAnalysesItems } from './saved-analyses-view';

function makeBaseAnalysis(overrides: Partial<Analysis>): Analysis {
  return {
    id: 'id-1',
    user_id: 'user-1',
    product_type: 'nome_social',
    nome_completo: 'ANA PAULA FERREIRA LIMA',
    data_nascimento: '1985-03-15',
    numero_expressao: 3,
    numero_destino: 5,
    numero_motivacao: 6,
    numero_missao: 5,
    numero_impressao: 6,
    numero_personalidade: 1,
    arcano_regente: 12,
    bloqueios: [],
    triangulo_da_vida: null,
    triangulo_vida: null,
    triangulo_pessoal: null,
    triangulo_social: null,
    triangulo_destino: null,
    licoes_carmicas: null,
    tendencias_ocultas: null,
    debitos_carmicos: null,
    frequencias_numeros: null,
    analise_texto: null,
    score: 88,
    score_version: 'v3',
    score_v3: 92,
    nivel: null,
    potencial: null,
    score_detalhe: null,
    parent_analysis_id: null,
    recalculated_from_version: null,
    recalculated_at: null,
    opt_in: false,
    opt_in_data: null,
    status: 'complete',
    is_free: false,
    is_analyst_generated: false,
    error_message: null,
    created_at: '2026-11-10T10:00:00.000Z',
    updated_at: '2026-11-10T10:00:00.000Z',
    completed_at: '2026-11-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('buildSavedAnalysesItems', () => {
  it('inclui análise gratuita concluída do nome de nascimento, ordena por mais recente primeiro e preenche vidaBloqueiosCodigos', () => {
    const older = makeBaseAnalysis({
      id: 'older',
      created_at: '2026-11-01T10:00:00.000Z',
      nome_completo: 'ANA PAULA FERREIRA LIMA',
      score_v3: 42,
    });
    const newer = makeBaseAnalysis({
      id: 'newer',
      created_at: '2026-11-14T10:00:00.000Z',
      nome_completo: 'ANA PAULA FERREIRA LIMA',
      score_v3: 95,
      frequencias_numeros: {
        selectedNomeSocial: 'ANA PAULA FÉRREIRA',
        is_favorite: true,
        areaFoco: 'carreira',
        ondeVaiUsar: ['Redes sociais'],
        ranking: {
          nomeNascimento: 'ANA PAULA FERREIRA LIMA',
          dataNascimento: '15/03/1985',
        },
      },
    });
    const free = makeBaseAnalysis({
      id: 'free-1',
      product_type: 'analise_gratuita',
      is_free: true,
      created_at: '2026-10-15T10:00:00.000Z',
      nome_completo: 'ANA PAULA FERREIRA LIMA',
    });

    const items = buildSavedAnalysesItems([older, free, newer], { isAdmin: false });

    assert.equal(items.length, 3);
    assert.equal(items[0].id, 'newer');
    assert.equal(items[1].id, 'older');
    assert.equal(items[2].id, 'free-1');
    assert.equal(items[0].nomeExibido, 'ANA PAULA FÉRREIRA');
    assert.equal(items[0].isFavorite, true);
    assert.ok(items[0].cardData);
    assert.equal(items[0].cardData.nome, 'ANA PAULA FÉRREIRA');
    assert.equal(items[0].cardData.score, 95);
    assert.ok(Array.isArray(items[0].cardData.vidaBloqueiosCodigos));
    assert.ok(items[0].panelData.birthPanel);
    assert.ok(items[0].panelData.harmonizedPanel);
    assert.equal(items[0].panelData.isSuggestion, true);
    assert.equal(items[0].panelData.showRadar, true);
    assert.equal(items[0].panelData.showReadingSummary, true);
    assert.equal(items[2].canFavorite, false);
  });

  it('sintetiza análise padrão do nome de nascimento não harmonizado quando não há analise_gratuita', () => {
    const harmonized = makeBaseAnalysis({
      id: 'harm-only',
      created_at: '2026-11-14T10:00:00.000Z',
      nome_completo: 'ANA PAULA FERREIRA LIMA',
      score_v3: 95,
      frequencias_numeros: {
        selectedNomeSocial: 'ANA PAULA FÉRREIRA',
        ranking: {
          nomeNascimento: 'ANA PAULA FERREIRA LIMA',
          dataNascimento: '15/03/1985',
        },
      },
    });

    const items = buildSavedAnalysesItems([harmonized], { isAdmin: false });

    assert.equal(items.length, 2);
    assert.equal(items[0].id, 'harm-only');
    assert.equal(items[1].id, 'harm-only__birth');
    assert.equal(items[1].isSynthetic, true);
    assert.equal(items[1].pdfAnalysisId, 'harm-only');
    assert.equal(items[1].nomeExibido, 'ANA PAULA FERREIRA LIMA');
    assert.equal(items[1].panelData.harmonizedPanel, null);
    assert.equal(items[1].canFavorite, false);
    assert.equal(items[1].canDelete, false);
  });
});
