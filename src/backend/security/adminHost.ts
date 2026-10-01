import { OPS_PUBLIC_ROUTES, OPS_STAFF_ROUTES, matchOpsUserPath, safeOpsRedirect } from '../../shared/ops-routes';

const FIXED_ADMIN_HOSTS = new Set([
  'admin.nomemagnetico.com.br',
  'admin.localhost',
]);

export { safeOpsRedirect };

export type AdminRouteKind =
  | { kind: 'public'; publicPath: string; internalPath: string }
  | { kind: 'staff'; publicPath: string; internalPath: string }
  | { kind: 'ops-api' }
  | { kind: 'foreign-api' }
  | { kind: 'redirect'; to: string }
  | { kind: 'customer' };

const PUBLIC_ROUTES = OPS_PUBLIC_ROUTES;
const STAFF_ROUTES = OPS_STAFF_ROUTES;

const INTERNAL_TO_PUBLIC = new Map<string, { publicPath: string; staff: boolean }>();

for (const [publicPath, internalPath] of Object.entries(PUBLIC_ROUTES)) {
  INTERNAL_TO_PUBLIC.set(internalPath, { publicPath, staff: false });
}
for (const [publicPath, internalPath] of Object.entries(STAFF_ROUTES)) {
  INTERNAL_TO_PUBLIC.set(internalPath, { publicPath, staff: true });
}

export function hostnameOf(hostHeader: string | null | undefined): string {
  const raw = (hostHeader ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  return raw.split(':')[0] ?? '';
}

/**
 * Host do painel ops. Usa o header Host (o Nginx grava `$host`), não
 * X-Forwarded-Host, que o cliente pode forjar se o proxy repassar.
 */
export function requestHostname(request: Request): string {
  return hostnameOf(request.headers.get('host'));
}

export function isAdminHost(hostname: string): boolean {
  const host = hostnameOf(hostname);
  if (!host) return false;
  if (FIXED_ADMIN_HOSTS.has(host)) return true;
  const override = process.env.ADMIN_HOST_OVERRIDE?.trim() ?? '';
  if (!override) return false;
  return host === hostnameOf(override);
}

export function publicSiteOrigin(): string {
  const raw = process.env.APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return 'https://www.nomemagnetico.com.br';
}

/** Vazio mantém o redirect legado de `/admin` para o HQ. */
export function adminOpsUrl(): string | null {
  const raw = process.env.ADMIN_OPS_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

export function classifyAdminPath(pathname: string): AdminRouteKind {
  const path = normalizePathname(pathname);

  if (path === '/admin') return { kind: 'redirect', to: '/' };
  if (path === '/auth/login') return { kind: 'redirect', to: '/login' };

  if (path === '/api/ops' || path.startsWith('/api/ops/')) return { kind: 'ops-api' };
  if (path === '/api' || path.startsWith('/api/')) return { kind: 'foreign-api' };

  const publicInternal = PUBLIC_ROUTES[path];
  if (publicInternal) return { kind: 'public', publicPath: path, internalPath: publicInternal };

  const staffInternal = STAFF_ROUTES[path];
  if (staffInternal) return { kind: 'staff', publicPath: path, internalPath: staffInternal };

  const userDetail = matchOpsUserPath(path);
  if (userDetail) {
    return { kind: 'staff', publicPath: userDetail.publicPath, internalPath: userDetail.internalPath };
  }

  const internal = INTERNAL_TO_PUBLIC.get(path);
  if (internal) {
    return internal.staff
      ? { kind: 'staff', publicPath: internal.publicPath, internalPath: path }
      : { kind: 'public', publicPath: internal.publicPath, internalPath: path };
  }

  return { kind: 'customer' };
}
