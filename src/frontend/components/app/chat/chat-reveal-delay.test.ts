import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_TYPING_DELAY_MS,
  computeChatRevealDelayMs,
} from './chat-reveal-delay.ts';

describe('computeChatRevealDelayMs', () => {
  it('respeita teto de 600 ms quando a API responde rápido', () => {
    const submitted = 1_000;
    assert.equal(computeChatRevealDelayMs(submitted, submitted, false), CHAT_TYPING_DELAY_MS);
    assert.equal(computeChatRevealDelayMs(submitted, submitted + 400, false), 200);
    assert.equal(computeChatRevealDelayMs(submitted, submitted + 800, false), 0);
  });

  it('zero com reduced motion', () => {
    assert.equal(computeChatRevealDelayMs(0, 0, true), 0);
  });
});
