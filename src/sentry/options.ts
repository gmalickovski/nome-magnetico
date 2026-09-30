import type { BrowserOptions } from '@sentry/astro';
import { scrubSentryEvent } from './scrub';

/**
 * Opções compartilhadas pelo browser e pelo servidor.
 *
 * `@sentry/astro` 11 trocou `sendDefaultPii` por `dataCollection`.
 * Tudo que carrega identidade, cookie, header, query ou corpo fica desligado.
 * Tracing fica em 0 — o MVP é só erro.
 */
export function sentryInitOptions(input: {
  dsn: string;
  environment: string;
  release?: string;
}): BrowserOptions {
  return {
    dsn: input.dsn,
    environment: input.environment,
    release: input.release,
    tracesSampleRate: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
      databaseQueryData: false,
      queues: false,
    },
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  };
}
