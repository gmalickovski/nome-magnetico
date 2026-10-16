/** Redirect de login do app (paths /app/*) com Response de headers mutáveis. */
export function buildAppLoginRedirectPath(pathname: string, search: string): string {
  const nextPath = pathname + search;
  return '/auth/login?redirect=' + encodeURIComponent(nextPath);
}

export function createMutableRedirect302(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  });
}

/**
 * Sem sessão em rota /app/* → redirect 302 para login.
 * Retorna null quando a rota segue para `next()`.
 */
export function redirectPublicAppWithoutSession(
  pathname: string,
  search: string,
  accessToken: string | undefined,
): Response | null {
  if (!accessToken && pathname.startsWith('/app')) {
    return createMutableRedirect302(buildAppLoginRedirectPath(pathname, search));
  }
  return null;
}
