export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp: string,
  secretKey = process.env.TURNSTILE_SECRET_KEY,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!secretKey?.trim()) {
    return { ok: true };
  }
  if (!token?.trim()) {
    return { ok: false, reason: 'Verificação de segurança obrigatória.' };
  }

  const body = new URLSearchParams({
    secret: secretKey,
    response: token,
    remoteip: remoteIp === 'unknown' ? '' : remoteIp,
  });

  let response: Response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch {
    return { ok: false, reason: 'Não foi possível validar a verificação de segurança.' };
  }

  let data: { success?: boolean; 'error-codes'?: string[] };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    return { ok: false, reason: 'Resposta inválida da verificação de segurança.' };
  }

  if (data.success) {
    return { ok: true };
  }
  return { ok: false, reason: 'Verificação de segurança inválida. Recarregue a página e tente novamente.' };
}
