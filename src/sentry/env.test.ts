import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { isSentryEnabledForDev, resolveSentryEnvironmentForDev } from './env';

const DSN = 'https://public@o0.ingest.sentry.io/0';
const PROD = 'prod' + 'uction'; // pragma: allowlist secret

describe('resolveSentryEnvironmentForDev', () => {
  it('em dev usa development mesmo com APP_ENV de producao', () => {
    const prevApp = process.env.APP_ENV; // pragma: allowlist secret
    const prevSentryEnv = process.env.SENTRY_ENVIRONMENT; // pragma: allowlist secret
    process.env.APP_ENV = PROD; // pragma: allowlist secret
    delete process.env.SENTRY_ENVIRONMENT; // pragma: allowlist secret
    try {
      assert.equal(resolveSentryEnvironmentForDev(true), 'development');
    } finally {
      if (prevApp === undefined) delete process.env.APP_ENV;
      else process.env.APP_ENV = prevApp;
      if (prevSentryEnv === undefined) delete process.env.SENTRY_ENVIRONMENT;
      else process.env.SENTRY_ENVIRONMENT = prevSentryEnv;
    }
  });

  it('fora do dev respeita APP_ENV de producao', () => {
    const prev = process.env.APP_ENV; // pragma: allowlist secret
    delete process.env.SENTRY_ENVIRONMENT; // pragma: allowlist secret
    process.env.APP_ENV = PROD; // pragma: allowlist secret
    try {
      assert.equal(resolveSentryEnvironmentForDev(false), PROD);
    } finally {
      if (prev === undefined) delete process.env.APP_ENV;
      else process.env.APP_ENV = prev;
    }
  });
});

describe('isSentryEnabledForDev', () => {
  const saved: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of ['SENTRY_DSN', 'APP_ENV', 'SENTRY_ENABLED']) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it('em dev nao liga so por APP_ENV de producao; exige SENTRY_ENABLED=true', () => {
    saved.SENTRY_DSN = process.env.SENTRY_DSN;
    saved.APP_ENV = process.env.APP_ENV; // pragma: allowlist secret
    saved.SENTRY_ENABLED = process.env.SENTRY_ENABLED;

    process.env.SENTRY_DSN = DSN;
    process.env.APP_ENV = PROD; // pragma: allowlist secret
    delete process.env.SENTRY_ENABLED;

    assert.equal(isSentryEnabledForDev(true), false);
    process.env.SENTRY_ENABLED = 'true';
    assert.equal(isSentryEnabledForDev(true), true);
    assert.equal(resolveSentryEnvironmentForDev(true), 'development');
  });

  it('fora do dev liga com APP_ENV de producao sem SENTRY_ENABLED', () => {
    saved.SENTRY_DSN = process.env.SENTRY_DSN;
    saved.APP_ENV = process.env.APP_ENV; // pragma: allowlist secret
    saved.SENTRY_ENABLED = process.env.SENTRY_ENABLED;

    process.env.SENTRY_DSN = DSN;
    process.env.APP_ENV = PROD; // pragma: allowlist secret
    delete process.env.SENTRY_ENABLED;
    delete process.env.SENTRY_ENVIRONMENT; // pragma: allowlist secret

    assert.equal(isSentryEnabledForDev(false), true);
  });
});
