import type { APIRoute } from 'astro';

/** Probe interno. Não lê banco, sessão nem serviços externos. */
export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
