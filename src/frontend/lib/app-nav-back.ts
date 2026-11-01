/**
 * Voltar na área logada: history.back() se houver navegação /app na sessão; senão /app.
 */

export const APP_NAV_STACK_STORAGE_KEY = 'nm-app-nav-stack';

export const APP_CLIENT_HOME = '/app';

function currentPath(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`;
}

export function readAppNavStack(): string[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(APP_NAV_STACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === 'string' && p.length > 0);
  } catch {
    return [];
  }
}

export function writeAppNavStack(stack: string[]): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(APP_NAV_STACK_STORAGE_KEY, JSON.stringify(stack));
  } catch {
    // quota / private mode
  }
}

/** Registra a rota atual no stack da sessão (MPA /app). */
export function recordAppNavigationPath(path = currentPath()): void {
  if (!path) return;
  const stack = readAppNavStack();
  if (stack[stack.length - 1] === path) return;
  stack.push(path);
  if (stack.length > 64) stack.splice(0, stack.length - 64);
  writeAppNavStack(stack);
}

export type AppBackDestination = 'history_back' | 'app_home';

/** Decide se há página /app anterior na mesma sessão de aba. */
export function resolveAppBackDestination(
  stack: string[],
  path = currentPath()
): AppBackDestination {
  const normalized = [...stack];
  if (path && (normalized.length === 0 || normalized[normalized.length - 1] !== path)) {
    normalized.push(path);
  }
  return normalized.length >= 2 ? 'history_back' : 'app_home';
}

export interface NavigateClientAreaBackOptions {
  fallback?: string;
  beforeLeave?: () => void;
}

export function navigateClientAreaBack(options?: NavigateClientAreaBackOptions): AppBackDestination {
  if (typeof window === 'undefined') return 'app_home';

  const fallback = options?.fallback ?? APP_CLIENT_HOME;
  options?.beforeLeave?.();

  recordAppNavigationPath();
  const stack = readAppNavStack();
  const destination = resolveAppBackDestination(stack);

  if (destination === 'history_back') {
    stack.pop();
    writeAppNavStack(stack);
    window.history.back();
    return 'history_back';
  }

  window.location.assign(fallback);
  return 'app_home';
}
