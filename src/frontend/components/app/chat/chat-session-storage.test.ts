import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearChatSession,
  hasUnfinishedChatSession,
  loadChatSession,
  saveChatSession,
  CHAT_SESSION_STORAGE_VERSION,
  type PersistedChatSession,
} from './chat-session-storage.ts';
import { INITIAL_COLLECT_STATE } from './decide-live-bridge.ts';

const USER = 'test-user-persist';

const memoryStore = new Map<string, string>();

function installLocalStorageMock() {
  const mock = {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
    clear: () => memoryStore.clear(),
    key: () => null,
    length: 0,
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    configurable: true,
  });
}

function minimalSession(): PersistedChatSession {
  return {
    version: CHAT_SESSION_STORAGE_VERSION,
    savedAt: Date.now(),
    messages: [{ id: 'm1', sender: 'assistant', type: 'text', content: 'Olá' }],
    answers: { onboarding_confirm: 'ok' },
    confirmedName: 'Ana Silva',
    confirmedDate: '01/01/1990',
    draftNome: 'Ana Silva',
    draftDate: '01/01/1990',
    draftGender: 'Feminino',
    stepIndex: 2,
    currentStepId: 'nome_uso',
    remaining: 5,
    birthConfirmed: true,
    collectState: INITIAL_COLLECT_STATE,
    sobrenomesDetectados: [],
    radarAxes: null,
    summaryItems: [],
    basePanel: {
      nome: 'Ana Silva',
      score: 66,
      expressao: 1,
      destino: 2,
      motivacao: 3,
      missao: 5,
      impressao: 4,
      potencial: 80,
      bloqueiosCount: 1,
      bloqueios: [{ codigo: '444', titulo: 'Sequência 444' }],
      trianguloVida: { topo: 1, base: [2, 3] },
    },
    activeSuggestionId: null,
    suggestions: [],
  };
}

describe('chat-session-storage', () => {
  beforeEach(() => {
    installLocalStorageMock();
    memoryStore.clear();
    clearChatSession(USER);
  });

  afterEach(() => {
    clearChatSession(USER);
  });

  it('salva e restaura sessão por userId', () => {
    const session = minimalSession();
    saveChatSession(USER, session);
    const loaded = loadChatSession(USER);
    assert.ok(loaded);
    assert.equal(loaded!.confirmedName, 'Ana Silva');
    assert.equal(loaded!.stepIndex, 2);
    assert.equal(loaded!.basePanel?.score, 66);
    assert.equal(loaded!.messages.length, 1);
  });

  it('descarta sessão de versão anterior', () => {
    const session = { ...minimalSession(), version: 5 as unknown as typeof CHAT_SESSION_STORAGE_VERSION };
    saveChatSession(USER, session);
    assert.equal(loadChatSession(USER), null);
    assert.equal(memoryStore.get(`nm-chat-v2:${USER}`), undefined);
  });

  it('restaura sessão com analysisId para reabertura local (export atualiza depois)', () => {
    const session = {
      ...minimalSession(),
      analysisId: 'analise-concluida-123',
      currentStepId: 'conclusao',
      suggestions: [
        {
          id: 's1',
          nome: 'Ana Vale',
          score: 80,
          expressao: 1,
          compatibilidade: 'neutro',
          bloqueiosEliminados: 0,
          bloqueiosRestantes: 0,
          arcanosPositivos: 0,
          dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
          panel: minimalSession().basePanel!,
        },
      ],
    };
    saveChatSession(USER, session);
    const loaded = loadChatSession(USER);
    assert.ok(loaded);
    assert.equal(loaded!.analysisId, 'analise-concluida-123');
    assert.equal(loaded!.suggestions.length, 1);
  });

  it('clear remove persistência', () => {
    saveChatSession(USER, minimalSession());
    clearChatSession(USER);
    assert.equal(loadChatSession(USER), null);
    assert.equal(hasUnfinishedChatSession(USER), false);
  });

  it('detecta corretamente sessão iniciada em andamento vs sessão vazia ou concluída', () => {
    assert.equal(hasUnfinishedChatSession(USER), false);

    // Sessão recém-aberta sem progresso ainda não conta como retomada
    saveChatSession(USER, {
      ...minimalSession(),
      birthConfirmed: false,
      answers: {},
      messages: [{ id: 'm0', role: 'assistant', text: 'Boas-vindas' }],
      stepIndex: 0,
    });
    assert.equal(hasUnfinishedChatSession(USER), false);

    // Com progresso na entrevista e sem analysisId/conclusao -> deve sugerir Retomar Análise
    saveChatSession(USER, {
      ...minimalSession(),
      birthConfirmed: true,
      answers: { foco: 'carreira' },
      stepIndex: 2,
      currentStepId: 'pergunta_2',
      analysisId: null,
    });
    assert.equal(hasUnfinishedChatSession(USER), true);

    // Ao concluir com analysisId e currentStepId=conclusao -> volta para + Nova Análise
    saveChatSession(USER, {
      ...minimalSession(),
      birthConfirmed: true,
      answers: { foco: 'carreira' },
      stepIndex: 4,
      currentStepId: 'conclusao',
      analysisId: 'analise-final-1',
    });
    assert.equal(hasUnfinishedChatSession(USER), false);
  });
});
