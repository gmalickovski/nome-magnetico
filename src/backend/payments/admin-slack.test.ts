import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldNotifyAdminSlackForProvider } from './admin-slack';

describe('admin-slack', () => {
  it('suprime Slack para provider test', () => {
    assert.equal(shouldNotifyAdminSlackForProvider('test'), false);
  });

  it('mantém Slack para stripe e asaas', () => {
    assert.equal(shouldNotifyAdminSlackForProvider('stripe'), true);
    assert.equal(shouldNotifyAdminSlackForProvider('asaas'), true);
    assert.equal(shouldNotifyAdminSlackForProvider(null), true);
  });
});
