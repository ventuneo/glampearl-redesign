// sitemap.xml for the prototype. Shopify generates its own after the port.
import type { APIRoute } from 'astro';
import { CATEGORIES, products } from '../lib/catalog';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://glampearl.store');
  const paths = ['/', '/shop/', ...CATEGORIES.map((c) => `/shop/${c.slug}/`), '/help/', ...products.map((p) => `/products/${p.handle}/`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
