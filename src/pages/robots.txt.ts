import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { adminHostRobotsTxtBody, applyAdminHostSeoHeaders } from '../backend/security/adminHostSeo';
import { isAdminHost, requestHostname } from '../backend/security/adminHost';

const publicRobots = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public/robots.txt'),
  'utf8'
);

export const GET: APIRoute = ({ request }) => {
  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });

  if (isAdminHost(requestHostname(request))) {
    applyAdminHostSeoHeaders(headers);
    return new Response(adminHostRobotsTxtBody(), { status: 200, headers });
  }

  return new Response(publicRobots, { status: 200, headers });
};
