import type { ChatReadingSummary } from './chat-types.js';

export async function fetchChatReadingSummary(
  nomeCompleto: string,
  dataNascimento: string
): Promise<ChatReadingSummary | null> {
  const res = await fetch('/api/chat-reading-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      nome_completo: nomeCompleto.trim(),
      data_nascimento: dataNascimento.trim(),
    }),
  });

  if (!res.ok) {
    console.warn('[chat] reading summary failed', res.status);
    return null;
  }

  const data = (await res.json()) as { readingSummary?: ChatReadingSummary };
  return data.readingSummary ?? null;
}
