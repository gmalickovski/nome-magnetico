import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adminHostRobotsTxtBody,
  applyAdminHostSeoHeaders,
  ADMIN_HOST_ROBOTS_HEADER_VALUE,
} from './adminHostSeo.ts';

describe('adminHostSeo', () => {
  it('robots.txt do admin bloqueia tudo', () => {
    assert.match(adminHostRobotsTxtBody(), /Disallow: \//);
  });

  it('aplica X-Robots-Tag noindex, nofollow', () => {
    const headers = new Headers();
    applyAdminHostSeoHeaders(headers);
    assert.equal(headers.get('X-Robots-Tag'), ADMIN_HOST_ROBOTS_HEADER_VALUE);
  });
});
