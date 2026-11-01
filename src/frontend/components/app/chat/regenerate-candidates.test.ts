import { describe, it, expect } from 'vitest';
import {
  buildRegenerateRequestBody,
  isRegeneratePoolExhausted,
  mapRegenerateApiToCandidates,
  INITIAL_COLLECT_STATE,
} from './decide-live-bridge.js';

describe('mapRegenerateApiToCandidates', () => {
  it('deduplica melhorNome, top3 e nossasSugestoes em até 3 cards', () => {
    const data = {
      melhorNome: {
        nomeCompleto: 'Ana Silva',
        score: 88,
        expressao: 3,
        destino: 5,
        bloqueios: [],
      },
      top3: [
        { nomeCompleto: 'Ana Silva', score: 88, bloqueios: [] },
        { nomeCompleto: 'Ana Sílva', score: 86, bloqueios: [] },
      ],
      nossasSugestoes: [{ nomeCompleto: 'Ana S.', score: 80, bloqueios: [] }],
    };
    const out = mapRegenerateApiToCandidates(data, 3);
    expect(out.map((c) => c.nome)).toEqual(['Ana Silva', 'Ana Sílva', 'Ana S.']);
  });
});

describe('isRegeneratePoolExhausted', () => {
  it('marca esgotado quando poolEsgotado vem da API', () => {
    expect(
      isRegeneratePoolExhausted({ poolEsgotado: true, melhorNome: { nomeCompleto: 'X', bloqueios: [] } }, [])
    ).toBe(true);
  });

  it('marca esgotado quando todos os nomes já foram mostrados', () => {
    const data = {
      melhorNome: { nomeCompleto: 'Ana Silva', score: 1, bloqueios: [] },
      top3: [],
      nossasSugestoes: [],
    };
    expect(isRegeneratePoolExhausted(data, ['Ana Silva'])).toBe(true);
  });
});

describe('buildRegenerateRequestBody', () => {
  it('envia nomesExcluidos e rankingChat sem analysisId', () => {
    const body = buildRegenerateRequestBody({
      nomeNascimento: 'Maria Teste Silva',
      dataNascimento: '01/01/1990',
      collect: {
        ...INITIAL_COLLECT_STATE,
        aberturaMudanca: 'quase_nada',
        ondeAssinaRaw: ['contratos_documentos'],
        ondeAssina: ['documentos'],
      },
      nomesExcluidos: ['Maria Teste Silva'],
    });
    expect(body.nomeNascimento).toBe('Maria Teste Silva');
    expect(body.nomesExcluidos).toEqual(['Maria Teste Silva']);
    expect(body.analysisId).toBeUndefined();
    expect(body.rankingChat).toMatchObject({
      restricaoDocumentosLegais: true,
      maxNivelGeracao: 50,
    });
  });
});
