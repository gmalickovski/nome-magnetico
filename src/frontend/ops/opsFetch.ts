export type OpsFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Chama `/api/ops/*`. 401 e 403 levam para login e sem-permissão como nas outras telas. */
export async function opsFetch<T>(
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown },
): Promise<OpsFetchResult<T>> {
  try {
    const response = await fetch(path, {
      method: init?.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

    if (response.status === 401) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return { ok: false, error: 'Sessão expirada' };
    }
    if (response.status === 403) {
      window.location.href = '/sem-permissao';
      return { ok: false, error: 'Acesso restrito à equipe' };
    }

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, error: body?.error ?? 'Não foi possível concluir a operação.' };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: 'Não foi possível conectar. Tente de novo.' };
  }
}
