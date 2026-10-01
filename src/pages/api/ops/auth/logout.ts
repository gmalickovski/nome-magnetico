import type { APIRoute } from 'astro';
import { isOpsSurface, opsHref, requestHost } from '../../../../backend/ops/host';
import { clearOpsSession } from '../../../../backend/ops/session';

export const POST: APIRoute = async ({ request, cookies, url, redirect }) => {
  const host = requestHost(request, url);
  if (!isOpsSurface(host)) {
    return new Response('Not Found', { status: 404 });
  }

  clearOpsSession(cookies, url, request);
  return redirect(opsHref(host, '/login'), 303);
};
