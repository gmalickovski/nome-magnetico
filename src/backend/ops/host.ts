/**
 * Host e URLs do painel staff em admin.nomemagnetico.com.br.
 * O painel vive nas rotas internas /ops/*, reescritas para URLs curtas
 * só nesse host. O domínio público não entrega essas rotas.
 */

export const OPS_CANONICAL_HOST = 'admin.nomemagnetico.com.br';
export const OPS_REWRITE_HEADER = 'x-nm-ops-rewritten';

const DEFAULT_OPS_HOSTS = [OPS_CANONICAL_HOST, 'admin.localhost'];

export type OpsCleanPath = '/' | '/login' | '/users';

const CLEAN_TO_INTERNAL: Record<OpsCleanPath, string> = {
  '/': '/ops',
  '/login': '/ops/login',
  '/users': '/ops/users',
};

export function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').split(':')[0].trim().toLowerCase();
}

/** Host efetivo da requisição. Nginx substitui Host por $host; não lemos X-Forwarded-Host. */
export function requestHost(request: Request, url: URL): string {
  const header = request.headers.get('host');
  if (header) return normalizeHostname(header);
  return normalizeHostname(url.hostname);
}

export function opsHostnames(): string[] {
  const extra = (process.env.OPS_HOSTS ?? '')
    .split(',')
    .map((item) => normalizeHostname(item))
    .filter(Boolean);
  return [...DEFAULT_OPS_HOSTS, ...extra];
}

export function isOpsHost(hostname: string): boolean {
  return opsHostnames().includes(normalizeHostname(hostname));
}

/**
 * No servidor de desenvolvimento, localhost abre /ops e /api/ops direto
 * para o time testar sem DNS. O build da VPS não tem esse atalho.
 */
export function isLocalOpsDev(hostname: string): boolean {
  if (!import.meta.env.DEV) return false;
  const host = normalizeHostname(hostname);
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

export function isOpsSurface(hostname: string): boolean {
  return isOpsHost(hostname) || isLocalOpsDev(hostname);
}

export function isOpsPath(pathname: string): boolean {
  const path = stripTrailingSlash(pathname);
  return path === '/ops' || path.startsWith('/ops/') || path.startsWith('/api/ops');
}

export function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

export function cleanPathToInternal(pathname: string): string | null {
  const path = stripTrailingSlash(pathname);
  if (path in CLEAN_TO_INTERNAL) return CLEAN_TO_INTERNAL[path as OpsCleanPath];
  return null;
}

export function internalPathToClean(pathname: string): OpsCleanPath | null {
  const path = stripTrailingSlash(pathname);
  if (path === '/ops') return '/';
  if (path === '/ops/login') return '/login';
  if (path === '/ops/users') return '/users';
  return null;
}

/** URL que o staff vê: curta no host admin, prefixada em localhost. */
export function opsHref(hostname: string, cleanPath: OpsCleanPath): string {
  if (isOpsHost(hostname)) return cleanPath;
  if (cleanPath === '/') return '/ops';
  return `/ops${cleanPath}`;
}

export function opsCookieSecure(url: URL, request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (forwarded === 'https') return true;
  if (forwarded === 'http') return false;
  return url.protocol === 'https:';
}
