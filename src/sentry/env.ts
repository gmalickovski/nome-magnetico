/**
 * Leitura de ambiente do Sentry em runtime.
 *
 * O build de produção (GitHub Actions) não recebe o DSN. A VPS injeta o
 * `.env` só na hora de subir o processo (`start.mjs`). Por isso o DSN não
 * pode ir para `import.meta.env` — o Vite gravaria o valor (vazio) no bundle.
 */

export interface SentryRuntimeConfig {
  dsn: string;
  environment: string;
  release?: string;
}

function readProcessEnv(name: string): string | undefined {
  const proc = globalThis.process;
  if (!proc?.env) return undefined;
  const value = proc.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readSentryDsn(): string | undefined {
  return (
    readProcessEnv('SENTRY_DSN') ??
    readProcessEnv('PUBLIC_SENTRY_DSN') ??
    readProcessEnv('NEXT_PUBLIC_SENTRY_DSN')
  );
}

export function resolveSentryEnvironment(): string {
  return (
    readProcessEnv('SENTRY_ENVIRONMENT') ??
    readProcessEnv('VERCEL_ENV') ??
    readProcessEnv('APP_ENV') ??
    (readProcessEnv('NODE_ENV') === 'production' ? 'production' : 'development') // pragma: allowlist secret
  );
}

export function resolveSentryRelease(): string | undefined {
  return readProcessEnv('SENTRY_RELEASE') ?? readProcessEnv('VERCEL_GIT_COMMIT_SHA');
}

/**
 * Liga o SDK só com DSN e ambiente de produção.
 * `SENTRY_ENABLED=true` libera um smoke fora de produção.
 * `SENTRY_ENABLED=false` desliga mesmo em produção.
 */
export function isSentryEnabled(): boolean {
  if (!readSentryDsn()) return false;
  const flag = readProcessEnv('SENTRY_ENABLED')?.toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'off') return false;
  if (flag === 'true' || flag === '1' || flag === 'on') return true;
  return resolveSentryEnvironment() === 'production';
}

export function getSentryRuntimeConfig(): SentryRuntimeConfig | undefined {
  if (!isSentryEnabled()) return undefined;
  const dsn = readSentryDsn();
  if (!dsn) return undefined;
  return {
    dsn,
    environment: resolveSentryEnvironment(),
    release: resolveSentryRelease(),
  };
}
