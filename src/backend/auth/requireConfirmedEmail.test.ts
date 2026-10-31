import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { guardConfirmedEmail, requireConfirmedEmail } from './requireConfirmedEmail';

describe('requireConfirmedEmail', () => {
  it('permite usuário com email_confirmed_at', () => {
    const res = requireConfirmedEmail({ email_confirmed_at: '2026-10-01T00:00:00.000Z' });
    assert.equal(res.ok, true);
  });

  it('bloqueia usuário sem email_confirmed_at', () => {
    const res = requireConfirmedEmail({ email_confirmed_at: null });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.status, 403);
      assert.deepEqual(res.body, { error: 'email_not_confirmed' });
    }
  });

  it('guardConfirmedEmail devolve Response 403', async () => {
    const response = guardConfirmedEmail({ email_confirmed_at: undefined });
    assert.ok(response);
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.deepEqual(body, { error: 'email_not_confirmed' });
  });
});
