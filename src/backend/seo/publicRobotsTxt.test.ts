import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_ROBOTS_TXT } from './publicRobotsTxt.ts';

describe('publicRobotsTxt', () => {
  it('preserva Sitemap e disallows da área logada', () => {
    assert.match(PUBLIC_ROBOTS_TXT, /Sitemap: https:\/\/www\.nomemagnetico\.com\.br\/sitemap\.xml/);
    assert.match(PUBLIC_ROBOTS_TXT, /Disallow: \/app\//);
    assert.doesNotMatch(
      PUBLIC_ROBOTS_TXT,
      /^User-agent: \*\nAllow: \/\nDisallow: \/\s*$/m
    );
  });
});
