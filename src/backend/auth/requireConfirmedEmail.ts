import type { User } from '@supabase/supabase-js';

export type EmailConfirmedUser = Pick<User, 'email_confirmed_at'>;

export type RequireConfirmedEmailResult =
  | { ok: true }
  | { ok: false; status: 403; body: { error: 'email_not_confirmed' } };

export function requireConfirmedEmail(user: EmailConfirmedUser | null | undefined): RequireConfirmedEmailResult {
  if (user?.email_confirmed_at) {
    return { ok: true };
  }
  return { ok: false, status: 403, body: { error: 'email_not_confirmed' } };
}

export function emailNotConfirmedResponse(): Response {
  return new Response(JSON.stringify({ error: 'email_not_confirmed' as const }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function guardConfirmedEmail(user: EmailConfirmedUser | null | undefined): Response | null {
  const gate = requireConfirmedEmail(user);
  if (gate.ok) return null;
  return emailNotConfirmedResponse();
}
