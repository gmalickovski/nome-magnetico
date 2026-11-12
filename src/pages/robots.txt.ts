import type { APIRoute } from 'astro';
import { PUBLIC_ROBOTS_TXT } from '../backend/seo/publicRobotsTxt';
import { adminHostRobotsTxtBody, applyAdminHostSeoHeaders } from '../backend/security/adminHostSeo';
import { isAdminHost, requestHostname } from '../backend/security/adminHost';

export const GET: APIRoute = ({ request }) => {
  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });

  if (isAdminHost(requestHostname(request))) {
    applyAdminHostSeoHeaders(headers);
    return new Response(adminHostRobotsTxtBody(), { status: 200, headers });
  }

  return new Response(PUBLIC_ROBOTS_TXT, { status: 200, headers });
};
