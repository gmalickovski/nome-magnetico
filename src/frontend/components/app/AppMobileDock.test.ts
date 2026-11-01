import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

describe('AppMobileDock', () => {
  it('monta um único MobileDockRoot (data-nm-mobile-dock) por render', () => {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'AppMobileDock.tsx');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /MobileDockRoot/);
    assert.doesNotMatch(src, /nm-app-mobile-dock-host/);
    const rootOpens = src.match(/<MobileDockRoot/g) ?? [];
    assert.ok(rootOpens.length >= 2, 'nav e action devem usar MobileDockRoot');
    assert.doesNotMatch(src, /MOBILE_DOCK_ROOT_CLASS/);
  });

  it('MobileChatDock no layout usa omitRoot (sem segundo root fixo)', () => {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'AppMobileDock.tsx');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /omitRoot/);
  });
});
