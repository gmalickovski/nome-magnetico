import * as Sentry from '@sentry/astro';
import { getSentryRuntimeConfig } from './src/sentry/env';
import { sentryInitOptions } from './src/sentry/options';

const runtime = getSentryRuntimeConfig();

if (runtime && !Sentry.getClient()) {
  Sentry.init(sentryInitOptions(runtime));
}
