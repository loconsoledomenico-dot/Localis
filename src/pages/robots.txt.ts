import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site).toString();

  const body = `User-agent: *
Allow: /
Disallow: /access/
Disallow: /api/
Disallow: /thanks
Disallow: /access-invalid
Disallow: /en/access-invalid
Disallow: /de/access-invalid
Disallow: /recover
Disallow: /en/recover
Disallow: /de/recover

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
