/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('@supabase/supabase-js').User | null;
    accessToken: string | null;
  }
}

interface ImportMetaEnv {
  readonly APP_ENV: 'development' | 'production';
  readonly APP_URL: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_GA4_MEASUREMENT_ID: string;
  readonly GA4_MEASUREMENT_ID: string;
  readonly GA4_API_SECRET: string;
  readonly GA4_CLIENT_ID_HASH_SECRET: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly STRIPE_PRICE_NOME_SOCIAL: string;
  readonly STRIPE_PRICE_NOME_BEBE: string;
  readonly STRIPE_PRICE_NOME_EMPRESA: string;
  readonly GROQ_API_KEY: string;
  readonly ANTHROPIC_API_KEY: string;
  readonly OPENAI_API_KEY: string;
  readonly N8N_WEBHOOK_URL: string;
  readonly N8N_WEBHOOK_SECRET: string;
  readonly N8N_WEBHOOK_FAQ_SYNC: string;
  readonly N8N_WEBHOOK_TRANSACIONAL: string;
  readonly N8N_WEBHOOK_SUPORTE: string;
  readonly N8N_WEBHOOK_MARKETING: string;
  readonly RATE_LIMIT_TESTE_BLOQUEIO: string;
  readonly PRODUCT_SLUG: string;
  readonly INTERNAL_API_SECRET: string;
  readonly SENTRY_DSN: string;
  readonly PUBLIC_SENTRY_DSN: string;
  readonly NEXT_PUBLIC_SENTRY_DSN: string;
  readonly SENTRY_ENVIRONMENT: string;
  readonly SENTRY_ENABLED: string;
  readonly SENTRY_RELEASE: string;
  readonly SENTRY_AUTH_TOKEN: string;
  readonly SENTRY_ORG: string;
  readonly SENTRY_PROJECT: string;
  readonly SENTRY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
