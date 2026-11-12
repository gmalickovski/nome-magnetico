/** SEO / indexação do host admin (admin.nomemagnetico.com.br). */

export const ADMIN_HOST_ROBOTS_HEADER_VALUE = 'noindex, nofollow';

export function adminHostRobotsTxtBody(): string {
  return ['User-agent: *', 'Disallow: /', ''].join('\n');
}

export function applyAdminHostSeoHeaders(headers: Headers): void {
  headers.set('X-Robots-Tag', ADMIN_HOST_ROBOTS_HEADER_VALUE);
}
