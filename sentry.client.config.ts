import * as Sentry from '@sentry/astro';
import { sentryInitOptions } from './src/sentry/options';

function meta(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim();
  return value ? value : undefined;
}

const dsn = meta('nm-sentry-dsn');

if (dsn && !Sentry.getClient()) {
  Sentry.init(
    sentryInitOptions({
      dsn,
      // Sem a meta (HTML fora do BaseLayout), nunca assumir production.
      environment: meta('nm-sentry-environment') ?? 'development',
      release: meta('nm-sentry-release'),
    }),
  );
}
