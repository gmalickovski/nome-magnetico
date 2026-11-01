import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NM_MOBILE_DOCK_CLEARANCE,
  NM_MOBILE_DOCK_STACKED_CLEARANCE,
} from './mobile-dock-tokens.ts';

describe('mobile-dock-tokens', () => {
  it('clearance usa safe-area e altura da barra', () => {
    assert.match(NM_MOBILE_DOCK_CLEARANCE, /3\.5rem/);
    assert.match(NM_MOBILE_DOCK_CLEARANCE, /safe-area-inset-bottom/);
  });

  it('stacked reserva duas barras', () => {
    assert.match(NM_MOBILE_DOCK_STACKED_CLEARANCE, /2 \* 3\.5rem/);
  });
});
