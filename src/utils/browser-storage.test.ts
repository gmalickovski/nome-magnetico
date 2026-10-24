import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  __resolveStorageAreaForTest,
  createSupabaseAuthStorage,
  readLocalStorage,
  writeLocalStorage,
} from './browser-storage';

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow === undefined) {
    // @ts-expect-error — restaura ausência de window em Node
    delete globalThis.window;
  } else {
    globalThis.window = originalWindow;
  }
});

describe('browser-storage', () => {
  it('retorna null quando o getter de localStorage lança SecurityError', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {},
    });
    Object.defineProperty(globalThis.window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Access is denied for this document.', 'SecurityError');
      },
    });

    assert.equal(__resolveStorageAreaForTest('local'), null);
    assert.equal(readLocalStorage('nm-cookie-consent'), null);
    writeLocalStorage('nm-cookie-consent', 'all');
    assert.equal(readLocalStorage('nm-cookie-consent'), null);
  });

  it('usa memória quando localStorage está bloqueado (Supabase auth)', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {},
    });
    Object.defineProperty(globalThis.window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Access is denied for this document.', 'SecurityError');
      },
    });

    const storage = createSupabaseAuthStorage();
    storage.setItem('test-key', 'value');
    assert.equal(storage.getItem('test-key'), 'value');
    storage.removeItem('test-key');
    assert.equal(storage.getItem('test-key'), null);
  });
});
