import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  NM_CHAT_DOCK_CLEARANCE,
  NM_CHAT_MOBILE_HEADER_PX,
  nmChatMobileHeaderCssVar,
} from './chat-mobile-layout.ts';

describe('chat-mobile-layout', () => {
  it('header compacto ~52px', () => {
    assert.equal(NM_CHAT_MOBILE_HEADER_PX, 52);
    assert.equal(nmChatMobileHeaderCssVar(), '52px');
  });

  it('clearance da dock inclui safe-area', () => {
    assert.match(NM_CHAT_DOCK_CLEARANCE, /safe-area-inset-bottom/);
  });
});
