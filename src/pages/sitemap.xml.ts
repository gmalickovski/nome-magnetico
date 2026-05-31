import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://www.nomemagnetico.com.br';

  // Configuração do Supabase para puxar artigos publicados em tempo real
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  // Páginas do seu site (estáticas) - Adicionei as páginas públicas principais
  const currentDate = new Date().toISOString().split('T')[0];
  const staticPages = [
    { url: '/', changefreq: 'weekly', priority: '1.0', lastmod: currentDate },
    { url: '/blog', changefreq: 'daily', priority: '0.9', lastmod: currentDate },
    { url: '/blog/sobre', changefreq: 'monthly', priority: '0.6', lastmod: currentDate },
    { url: '/sobre', changefreq: 'monthly', priority: '0.6', lastmod: currentDate },
    { url: '/glossario', changefreq: 'monthly', priority: '0.5', lastmod: currentDate },
    { url: '/nome-social', changefreq: 'weekly', priority: '0.9', lastmod: currentDate },
    { url: '/nome-bebe', changefreq: 'weekly', priority: '0.9', lastmod: currentDate },
    { url: '/nome-empresarial', changefreq: 'weekly', priority: '0.9', lastmod: currentDate },
    { url: '/precos', changefreq: 'monthly', priority: '0.8', lastmod: currentDate },
    { url: '/comprar', changefreq: 'weekly', priority: '0.8', lastmod: currentDate },
    { url: '/analise-gratuita', changefreq: 'monthly', priority: '0.8', lastmod: currentDate },
    { url: '/perguntas-frequentes', changefreq: 'monthly', priority: '0.6', lastmod: currentDate },
    { url: '/suporte', changefreq: 'monthly', priority: '0.6', lastmod: currentDate },
    { url: '/privacidade', changefreq: 'yearly', priority: '0.3', lastmod: currentDate },
    { url: '/termos', changefreq: 'yearly', priority: '0.3', lastmod: currentDate },
    { url: '/reembolso', changefreq: 'yearly', priority: '0.3', lastmod: currentDate },
  ];

  // Busca do banco de dados quais posts estão publicados!
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('is_published', true);

  // Converte a lista de posts do banco para o padrão do Sitemap do Google
  const dynamicPages = (posts || []).map(post => ({
    url: `/blog/${post.slug}`,
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: (post.updated_at || post.published_at || currentDate).split('T')[0]
  }));

  const allPages = [...staticPages, ...dynamicPages];

  // Monta o arquivo XML que o bot do Google Search lê
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
