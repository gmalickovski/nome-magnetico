import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCROLLBAR_HIDDEN_MEDIA,
  SCROLLBAR_VISIBLE_MEDIA,
} from './scrollbar-policy.ts';

describe('scrollbar-policy', () => {
  it('touch/tablet usa breakpoint 1024 e pointer coarse', () => {
    assert.match(SCROLLBAR_HIDDEN_MEDIA, /1023px/);
    assert.match(SCROLLBAR_HIDDEN_MEDIA, /pointer: coarse/);
  });

  it('desktop exige fine pointer e largura mínima', () => {
    assert.match(SCROLLBAR_VISIBLE_MEDIA, /1024px/);
    assert.match(SCROLLBAR_VISIBLE_MEDIA, /pointer: fine/);
  });
});
