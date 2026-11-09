import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeChatSuggestionsCumulative,
  chatSuggestionsToExportNames,
  chatSuggestionsExportFingerprint,
} from './chat-export-suggestions.ts';
import { buildChatPdfAnalyzePayload } from './chat-pdf-persist.ts';
import { INITIAL_COLLECT_STATE } from './decide-live-bridge.ts';
import {
  clearChatSession,
  loadChatSession,
  saveChatSession,
  CHAT_SESSION_STORAGE_VERSION,
  buildPersistedChatSession,
} from './chat-session-storage.ts';
import { analisarNomesSocial } from '../../../../backend/numerology/products/nome-social.ts';
import type { CandidateSuggestion } from './chat-types.js';

const USER = 'flow-test-user';

function sug(nome: string, id: string): CandidateSuggestion {
  return {
    id,
    nome,
    score: 80,
    expressao: 1,
    compatibilidade: 'neutro',
    bloqueiosEliminados: 0,
    bloqueiosRestantes: 0,
    arcanosPositivos: 0,
    dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
    panel: {
      nome,
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
}

describe('fluxo chat 3→6 → reabrir → export (integração mínima)', () => {
  beforeEach(() => {
    const memoryStore = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (k: string) => memoryStore.get(k) ?? null,
        setItem: (k: string, v: string) => memoryStore.set(k, v),
        removeItem: (k: string) => memoryStore.delete(k),
        clear: () => memoryStore.clear(),
        key: () => null,
        length: 0,
      },
      configurable: true,
    });
    clearChatSession(USER);
  });

  afterEach(() => {
    clearChatSession(USER);
  });

  it('cumula 3+3, persiste sessão com analysisId e payload com 6 nomes exatos no motor', () => {
    const round1 = [sug('Ana Vale', '1'), sug('Bia Costa', '2'), sug('Cássia Lima', '3')];
    const round2 = [sug('Dora Melo', '4'), sug('Eva Rios', '5'), sug('Fabi Nunes', '6')];
    const merged = mergeChatSuggestionsCumulative(round1, round2);
    assert.equal(merged.length, 6);

    const exportNames = chatSuggestionsToExportNames(merged);
    const payload = buildChatPdfAnalyzePayload({
      birthName: 'Maria Silva Santos',
      birthDate: '01/01/1990',
      selectedSocialName: 'Ana Vale',
      collect: INITIAL_COLLECT_STATE,
      suggestions: merged,
    });

    const motor = analisarNomesSocial(exportNames, 'Maria Silva Santos', '01/01/1990', {
      somenteCandidatosInformados: true,
      assinaturaAtual: 'Outra Assinatura Hoje',
    });
    assert.equal(motor.nomesCandidatos.length, 6);

    saveChatSession(
      USER,
      buildPersistedChatSession({
        messages: [{ id: 'm1', sender: 'assistant', type: 'text', content: 'ok' }],
        answers: {},
        confirmedName: 'Maria Silva Santos',
        confirmedDate: '01/01/1990',
        draftNome: '',
        draftDate: '',
        draftGender: '',
        stepIndex: 9,
        currentStepId: 'conclusao',
        remaining: 0,
        birthConfirmed: true,
        collectState: INITIAL_COLLECT_STATE,
        sobrenomesDetectados: [],
        radarAxes: null,
        summaryItems: [],
        basePanel: round1[0].panel,
        activeSuggestionId: '1',
        suggestions: merged,
        analysisId: 'analise-test-123',
        chatPhase: 'subscriber',
      }),
    );

    const loaded = loadChatSession(USER);
    assert.ok(loaded);
    assert.equal(loaded!.version, CHAT_SESSION_STORAGE_VERSION);
    assert.equal(loaded!.analysisId, 'analise-test-123');
    assert.equal(loaded!.suggestions.length, 6);
    assert.equal(
      chatSuggestionsExportFingerprint(chatSuggestionsToExportNames(loaded!.suggestions)),
      chatSuggestionsExportFingerprint(exportNames),
    );
    assert.deepEqual(payload.nomes_candidatos, exportNames);
  });
});
