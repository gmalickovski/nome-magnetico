import type { APIRoute } from 'astro';
import { supabase } from '../../../backend/db/supabase';
import { syncVerifiedEmailMarker } from '../../../backend/auth/confirmEmail';

export const POST: APIRoute = async ({ locals, request }) => {
  let user = (locals as any).user;

  if (!user) {
    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }
  }

  if (!user?.id) {
    return json({ error: 'Autenticação necessária' }, 401);
  }

  const result = await syncVerifiedEmailMarker(user.id);
  if (!result.ok) {
    return json({ error: result.error }, result.status);
  }

  return json({ success: true, email_verified_at: result.verifiedAt });
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
