import 'dotenv/config'; // carrega .env em process.env antes de qualquer módulo backend
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import sentry from '@sentry/astro';

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
  site: 'https://www.nomemagnetico.com.br',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    sentry({
      org: process.env.SENTRY_ORG || 'studio-mlk',
      project: process.env.SENTRY_PROJECT || 'nome-magnetico',
      authToken: sentryAuthToken,
      sentryUrl: process.env.SENTRY_URL || 'https://de.sentry.io',
      // Sem token o upload falharia no CI. O DSN em si entra só em runtime na VPS.
      sourcemaps: {
        disable: !sentryAuthToken,
      },
      // Captura manual no middleware. O handler automático também abre spans de tracing.
      autoInstrumentation: {
        requestHandler: false,
      },
      // Evita instrumentar SDKs de IA no build e mandar prompt/análise para o Sentry.
      buildTimeInstrumentation: false,
      bundleSizeOptimizations: {
        excludeTracing: true,
      },
      telemetry: false,
    }),
  ],
  security: {
    checkOrigin: false,
  },
  vite: {
    server: {
      fs: {
        strict: false,
        allow: ['..', 'C:/Dev/nome-magnetico'],
      },
    },
    ssr: {
      noExternal: ['@react-pdf/renderer'],
    },
  },
});
