import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from '../../shared/auth-cookies';

function cookieSuffix(): string {
  const host = window.location.hostname;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const domain = host.endsWith('nomemagnetico.com.br') ? '; Domain=.nomemagnetico.com.br' : '';
  return `; path=/; SameSite=Lax${domain}${secure}`;
}

export function writeAuthCookies(accessToken: string, refreshToken: string) {
  const suffix = cookieSuffix();
  document.cookie = `${AUTH_ACCESS_COOKIE}=${accessToken}; max-age=3600${suffix}`;
  document.cookie = `${AUTH_REFRESH_COOKIE}=${refreshToken}; max-age=${60 * 60 * 24 * 30}${suffix}`;
}

export function clearAuthCookies() {
  const host = window.location.hostname;
  const domains = host.endsWith('nomemagnetico.com.br')
    ? ['', '; Domain=.nomemagnetico.com.br']
    : [''];
  for (const name of [AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE]) {
    for (const domain of domains) {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domain}`;
    }
  }
}
