import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearChatSession,
  loadChatSession,
  saveChatSession,
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
    version: 2,
    savedAt: Date.now(),
    messages: [{ id: 'm1', sender: 'assistant', type: 'text', content: 'Olá' }],
    answers: { onboarding_confirm: 'ok' },
    confirmedName: 'Ana Silva',
    confirmedDate: '01/01/1990',
    draftNome: 'Ana Silva',
    draftDate: '01/01/1990',
    draftGender: 'Feminino',
    stepIndex: 2,
    currentStepId: 'sobrenomes',
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

  it('clear remove persistência', () => {
    saveChatSession(USER, minimalSession());
    clearChatSession(USER);
    assert.equal(loadChatSession(USER), null);
  });
});
