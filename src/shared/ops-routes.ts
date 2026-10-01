/** Rotas públicas do painel ops (host admin). A implementação fica em `/ops/*`. */
export const OPS_STAFF_ROUTES: Record<string, string> = {
  '/': '/ops',
  '/users': '/ops/users',
  '/subscriptions': '/ops/subscriptions',
  '/billing': '/ops/billing',
  '/promocoes': '/ops/promocoes',
  '/monitor': '/ops/monitor',
  '/faq': '/ops/faq',
  '/support': '/ops/support',
  '/blog': '/ops/blog',
  '/mensagens': '/ops/mensagens',
  '/settings': '/ops/settings',
};

export const OPS_PUBLIC_ROUTES: Record<string, string> = {
  '/login': '/ops/login',
  '/sem-permissao': '/ops/forbidden',
};

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

/** Destino interno após o login. Só rotas do próprio painel. */
export function safeOpsRedirect(raw: string | null | undefined): string {
  if (!raw) return '/';
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) {
    return '/';
  }
  const path = normalizePathname(value.split('?')[0] ?? '/');
  if (!Object.prototype.hasOwnProperty.call(OPS_STAFF_ROUTES, path)) return '/';
  return path;
}
