const DEFAULT_PUBLIC_BASE_URL = 'https://nomemagnetico.com.br';

/**
 * Origem pública do site. Atrás do nginx, `url.origin` da request vira
 * `http://localhost:4321` (proxy_pass em 127.0.0.1). Links que saem do
 * servidor (e-mail, n8n, Stripe) usam APP_URL.
 */
export function getPublicBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.APP_URL || DEFAULT_PUBLIC_BASE_URL;
  return raw.replace(/\/+$/, '');
}

/** Junta a origem pública a um path (`/api/...` ou `api/...`). */
export function buildPublicUrl(path: string, env: NodeJS.ProcessEnv = process.env): string {
  const base = getPublicBaseUrl(env);
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
