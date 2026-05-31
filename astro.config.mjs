import 'dotenv/config'; // carrega .env em process.env antes de qualquer módulo backend
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

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
  ],
  security: {
    checkOrigin: false,
  },
  vite: {
    ssr: {
      noExternal: ['@react-pdf/renderer'],
    },
  },
});
