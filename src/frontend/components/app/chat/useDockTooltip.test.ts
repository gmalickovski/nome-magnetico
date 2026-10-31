import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

describe('useDockTooltip', () => {
  it('não usa delay de 700ms para esconder tooltip', () => {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'useDockTooltip.ts');
    const src = readFileSync(file, 'utf8');
    assert.doesNotMatch(src, /700/);
    assert.match(src, /onPointerLeave/);
    assert.match(src, /onPointerCancel/);
    assert.match(src, /onTouchEnd/);
    assert.match(src, /onTouchCancel/);
  });
});
