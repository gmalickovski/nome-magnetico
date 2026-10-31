import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

describe('AppLayout.astro', () => {
  it('importa AvatarMenu quando usado na sidebar desktop', () => {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'AppLayout.astro');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /import AvatarMenu/);
    assert.match(src, /<AvatarMenu/);
  });
});
