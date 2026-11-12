import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPotencialCtaUrl } from './pdfPotencialCtaUrl';

describe('pdfPotencialCtaUrl', () => {
  it('monta UTMs do Marketing', () => {
    const url = buildPotencialCtaUrl('Maria Silva');
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('utm_source'), 'pdf');
    assert.equal(parsed.searchParams.get('utm_medium'), 'free');
    assert.equal(parsed.searchParams.get('utm_campaign'), 'nmpotencial');
    assert.equal(parsed.searchParams.get('nome'), 'Maria Silva');
  });
});
