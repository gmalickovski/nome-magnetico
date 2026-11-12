/**
 * Conteúdo canônico de /robots.txt para o site público (www).
 * Mantido em TypeScript para servir só via `src/pages/robots.txt.ts`
 * (sem `public/robots.txt`, que o adapter costuma priorizar).
 */
export const PUBLIC_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /app/
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /*.json$

# Sitemap
Sitemap: https://www.nomemagnetico.com.br/sitemap.xml

# Crawl delay (respeita os servidores — remove se quiser rastreamento mais rápido)
Crawl-delay: 5

# Permitir bots específicos
User-agent: Googlebot
Allow: /
Crawl-delay: 2

User-agent: Bingbot
Allow: /
Crawl-delay: 5

# Bloquear bots maliciosos conhecidos
User-agent: MJ12bot
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 30

User-agent: SemrushBot
Crawl-delay: 30
`;
