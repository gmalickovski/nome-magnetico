import type { BrowserOptions } from '@sentry/astro';
import { EMAIL_LINK_CHECKER_ERROR, isLocalDevEvent } from './filters';
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
    ignoreErrors: [EMAIL_LINK_CHECKER_ERROR],
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
      // Cliente: hostname da página. Servidor: host de event.request.url.
      const hostname = typeof window !== 'undefined' ? window.location?.hostname : undefined;
      if (isLocalDevEvent(event, hostname)) return null;
      return scrubSentryEvent(event);
    },
  };
}
