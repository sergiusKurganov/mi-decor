import type { APIRoute } from 'astro';
import site from '../data/site.json';

// Адреса уже проиндексированы, терять их нельзя. Страница 404 и редирект /about
// сюда не попадают.
const PAGES = ['/', '/commande', '/project', '/contact'];

export const GET: APIRoute = () => {
  const today = new Date().toISOString().slice(0, 10);

  const urls = PAGES.map(
    (path) => `  <url>\n    <loc>${new URL(path, site.domain).href}</loc>\n` +
      `    <lastmod>${today}</lastmod>\n  </url>`,
  ).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
