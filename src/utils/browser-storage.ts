import type { SupportedStorage } from '@supabase/auth-js';

type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function resolveStorageArea(kind: 'local' | 'session'): StorageArea | null {
  if (typeof window === 'undefined') return null;
  try {
    const area = kind === 'local' ? window.localStorage : window.sessionStorage;
    return area;
  } catch {
    return null;
  }
}

function withSafeOps(area: StorageArea): StorageArea {
  return {
    getItem(key: string) {
      try {
        return area.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string) {
      try {
        area.setItem(key, value);
      } catch {
        // Storage bloqueado — ignora silenciosamente.
      }
    },
    removeItem(key: string) {
      try {
        area.removeItem(key);
      } catch {
        // Storage bloqueado — ignora silenciosamente.
      }
    },
  };
}

function memoryStorageAdapter(store: Record<string, string> = {}): SupportedStorage {
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
  };
}

const localStorageSafe = () => {
  const area = resolveStorageArea('local');
  return area ? withSafeOps(area) : null;
};

const sessionStorageSafe = () => {
  const area = resolveStorageArea('session');
  return area ? withSafeOps(area) : null;
};

export function readLocalStorage(key: string): string | null {
  const storage = localStorageSafe();
  return storage ? storage.getItem(key) : null;
}

export function writeLocalStorage(key: string, value: string): void {
  const storage = localStorageSafe();
  storage?.setItem(key, value);
}

export function removeLocalStorage(key: string): void {
  const storage = localStorageSafe();
  storage?.removeItem(key);
}

export function readSessionStorage(key: string): string | null {
  const storage = sessionStorageSafe();
  return storage ? storage.getItem(key) : null;
}

export function writeSessionStorage(key: string, value: string): void {
  const storage = sessionStorageSafe();
  storage?.setItem(key, value);
}

export function removeSessionStorage(key: string): void {
  const storage = sessionStorageSafe();
  storage?.removeItem(key);
}

/** Storage para Supabase Auth: localStorage quando disponível, senão memória na sessão. */
export function createSupabaseAuthStorage(): SupportedStorage {
  const memory = memoryStorageAdapter();
  const local = localStorageSafe();
  if (!local) return memory;

  return {
    getItem(key: string) {
      const fromLocal = local.getItem(key);
      if (fromLocal !== null) return fromLocal;
      return memory.getItem(key);
    },
    setItem(key: string, value: string) {
      local.setItem(key, value);
      memory.setItem(key, value);
    },
    removeItem(key: string) {
      local.removeItem(key);
      memory.removeItem(key);
    },
  };
}

/** @internal — exposto para testes unitários. */
export function __resolveStorageAreaForTest(kind: 'local' | 'session'): StorageArea | null {
  return resolveStorageArea(kind);
}
