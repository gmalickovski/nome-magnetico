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

const USER_UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const USER_PUBLIC = new RegExp(`^/users/(${USER_UUID})$`, 'i');
const USER_INTERNAL = new RegExp(`^/ops/users/(${USER_UUID})$`, 'i');

/** Ficha `/users/:id`. O id volta em minúsculas para a URL ficar estável. */
export function matchOpsUserPath(pathname: string): { publicPath: string; internalPath: string } | null {
  const path = normalizePathname(pathname);
  const pub = path.match(USER_PUBLIC);
  if (pub?.[1]) {
    const id = pub[1].toLowerCase();
    return { publicPath: `/users/${id}`, internalPath: `/ops/users/${id}` };
  }
  const internal = path.match(USER_INTERNAL);
  if (internal?.[1]) {
    const id = internal[1].toLowerCase();
    return { publicPath: `/users/${id}`, internalPath: `/ops/users/${id}` };
  }
  return null;
}

/** Destino interno após o login. Só rotas do próprio painel. */
export function safeOpsRedirect(raw: string | null | undefined): string {
  if (!raw) return '/';
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) {
    return '/';
  }
  const path = normalizePathname(value.split('?')[0] ?? '/');
  if (Object.prototype.hasOwnProperty.call(OPS_STAFF_ROUTES, path)) return path;
  const detail = matchOpsUserPath(path);
  if (detail && path.toLowerCase() === detail.publicPath) return detail.publicPath;
  return '/';
}
